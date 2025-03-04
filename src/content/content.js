import "./content.css";
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import "leaflet-draw/dist/leaflet.draw.js"; 
import "leaflet-draw/dist/leaflet.draw.css"; 
import imageSrc from "../images/rectangle_button.png"; // Import image

// ref to map object 
let map;
// ref for user rectangle AOIs
let editableLayers = new L.FeatureGroup();
// ref for user date time
let dateTimeInput = document.getElementById('timestamp');

function setupDefaults () {
    let imgElement = document.getElementById('rectDrawButton');
    imgElement.src = imageSrc; // Set image src dynamically
    dateTimeInput.value = '2024-06-01T08:30';
}

function addEventListners() {
    let searchButton = document.getElementById('searchbutton');
    searchButton.addEventListener("click", getSentinelData);
}

function createMap() {
    map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    map.addLayer(editableLayers);
    
    var drawControl = new L.Control.Draw({
        draw: {
            marker: false,
            polyline : false,
            circle : false,
            polygon : false,
            circlemarker : false,
            rectangle : {
                showArea : false,
            }
        },
        edit: {
            featureGroup: editableLayers,  
        },    
    });
    map.addControl(drawControl);
    
    map.on(L.Draw.Event.CREATED, function(event) {
    var layer = event.layer;
    editableLayers.addLayer(layer);
    });    
}

function validateSearchParams() {
    return true
}

function getBoundingBox() {
    let latLngBounds = editableLayers.getBounds().toBBoxString().split(',').map(Number);
    let lngLatBounds = [latLngBounds[1],latLngBounds[0],latLngBounds[3],latLngBounds[2]];
    return lngLatBounds
}

function getDateTimeValue() {
    return dateTimeInput.value
}

function getEndDateTime() {
    let dateTime = getDateTimeValue();
    return new Date(dateTime).toISOString();
}

function addMonths(date, months) {
    let result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result
}

function getStartDateTime() {
    let endDate = getDateTimeValue();
    return addMonths(endDate, -1);
}

function searchParams() {

    let aoiBounds = getBoundingBox();
    console.log('bounds', aoiBounds);
    let endDate = getEndDateTime();
    console.log('endDateTime', endDate);
    let startDate = getStartDateTime();
    console.log('startDateTime', startDate);

    const url = "https://services.sentinel-hub.com/api/v1/process";
    const body = {
        "input": {
          "bounds": {
            "properties": {
                "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
            },
            "bbox": aoiBounds
          },
          "data": [{
            "type": "sentinel-2-l2a",
            "dataFilter" : {
                "timeRange" : {
                    "from" : startDate, 
                    "to" : endDate
                },
                "previewMode" : "PREVIEW"
            }
          }],
        },
        "output" : {
            "width" : 128,
            "height" : 128
        },
        "evalscript": `//VERSION=3
            function setup() {
            return {
                input: ["B02", "B03", "B04"],
                output: {
                bands: 3,
                sampleType: "AUTO" // default value - scales the output values from [0,1] to [0,255].
                }
            }
            }

            function evaluatePixel(sample) {
            return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02]
            }`
    }

    return {url : url, body : body}      
}

async function getSentinelData() { 
    const params = searchParams();
    try {
        const response = await fetch('/api/sentinel-data', {
            method : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body : JSON.stringify(params)
        });

        if (!response.ok) throw new Error('Failed to fetch Sentinel data');

        const contentType = response.headers.get('Content-Type') || 'image/png';
        if (contentType && contentType.includes('application/json')) {
            // Response is JSON (probably an error), so handle it as JSON
            const errorData = await response.json();
            console.error("Error fetching image:", errorData.error.message);
        } else if (contentType && contentType.startsWith('image/')) {
            // Response is an image, process as Blob
            const blob = await response.blob();
            let src = URL.createObjectURL(blob);
            var bb = params.body.input.bounds.bbox;
            var imageBounds = [[bb[0],bb[1]], [bb[2], bb[3]]];
            L.imageOverlay(src, imageBounds).addTo(map);
            map.fitBounds(imageBounds);
        }
    } catch (error) {
        console.error('Sentinel API Error:', error);
        throw error;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    createMap();
    setupDefaults();
    addEventListners();
});