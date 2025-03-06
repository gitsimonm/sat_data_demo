import "./content.css";
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import "leaflet-draw/dist/leaflet.draw.js"; 
import "leaflet-draw/dist/leaflet.draw.css"; 
import rect_icon from "../images/rectangle_button.png"; // Import image
import edit_icon from "../images/edit_icon.png"; // Import image


// ref to map object 
let map;

// ref for user rectangle AOIs
let editableLayers = new L.FeatureGroup();

// ref for images loaded 
let loadedImages = new L.LayerGroup();

// ref for user date time
let dateTimeInput = document.getElementById('timestamp');

function setCurrentTime(date, hours) {
    let now = new Date();
    now.setHours(now.getHours() -2);
    return now.toISOString().slice(0, 16)
}

function setupDefaults () {
    let rectIcon = document.getElementById('rectDrawIcon');
    rectIcon.src = rect_icon;

    let editIcon = document.getElementById('rectEditIcon');
    editIcon.src = edit_icon; 

    dateTimeInput.value = setCurrentTime();
    updateTimePeriodDisplay();
}

function updateTimePeriodDisplay () {
    let timePeriodInput = document.getElementById('timePeriod');
    let numDays = timePeriodInput.value;
    let timePeriodDisplay = document.getElementById('timePeriodDisplay');
    let timePeriodString = `Imagery will be collected from the ${numDays} days prior`;
    timePeriodDisplay.innerText = timePeriodString;
}

function getNumDays() {
    return document.getElementById('timePeriod').value;
}

function clearAllImages() {
    loadedImages.eachLayer(function (layer) {
        layer.remove();
    });
    loadedImages.clearLayers();
}

function addEventListners() {
    let searchButton = document.getElementById('searchbutton');
    searchButton.addEventListener("click", getSentinelData);
    let timePeriodInput = document.getElementById('timePeriod');
    timePeriodInput.addEventListener("change", updateTimePeriodDisplay);
    let clearImagesButton = document.getElementById('clearImagesButton');
    clearImagesButton.addEventListener('click', clearAllImages);
}

function toggleRectSizeWarning(toggle) {
    let rectSizeWarning = document.getElementById('warningMsg');
    if (toggle) {
        rectSizeWarning.style.display = 'flex';
    } else {
        rectSizeWarning.style.display = 'none';
    }
}

function createMap() {
    map = L.map('map').setView([41.9, 12.4], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.control.scale().addTo(map);
    
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

    map.on(L.Draw.Event.EDITED, function(event) {
       toggleRectSizeWarning(false);
    }); 
}

function getBoundingBox() {
    let latLngBounds = editableLayers.getBounds().toBBoxString().split(',').map(Number);
    // let lngLatBounds = [latLngBounds[1],latLngBounds[0],latLngBounds[3],latLngBounds[2]];
    return latLngBounds
}

function getHeightInMetres() {
    let latLngBounds = editableLayers.getBounds();
    let northWest = latLngBounds.getNorthWest();
    let southWest = latLngBounds.getSouthWest();
    return haverSine(northWest.lat, northWest.lng, southWest.lat, southWest.lng);
}

function getWidthInMetres() {
    let latLngBounds = editableLayers.getBounds();
    let northWest = latLngBounds.getNorthWest();
    let northEast = latLngBounds.getNorthEast();
    return haverSine(northWest.lat, northWest.lng, northEast.lat, northEast.lng);
}

function haverSine(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
        function toRad(degree) {
            return degree * Math.PI / 180;
        }
        
        const lat1 = toRad(lat1Deg);
        const lon1 = toRad(lon1Deg);
        const lat2 = toRad(lat2Deg);
        const lon2 = toRad(lon2Deg);
        
        const { sin, cos, sqrt, atan2 } = Math;
        
        const R = 6378137; // earth radius in metres
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a = sin(dLat / 2) * sin(dLat / 2)
                + cos(lat1) * cos(lat2)
                * sin(dLon / 2) * sin(dLon / 2);
        const c = 2 * atan2(sqrt(a), sqrt(1 - a)); 
        const d = R * c;
        return d; // distance in metres
}

function getDateTimeValue() {
    return dateTimeInput.value;
}

function getEndDateTime() {
    let dateTime = getDateTimeValue();
    return new Date(dateTime).toISOString();
}

function addMonths(date, months) {
    let result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result.toISOString()
}

function subtractDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() - days);
    return result.toISOString()
}

function addWeeks(date, weeks) {
    let result = new Date(date);
    let days = weeks * 7;
    result.setDate(result.getDay() + days);
    return result.toISOString()
}



function getStartDateTime(timeSpan) {
    let endDate = getEndDateTime();
    return subtractDays(endDate, timeSpan);
}

function validateSearchParams() {

    let valid = true;

    let maxResolution_detail = 200; // metres per pixel
    let maxResolution_preview = 1500; // metres per pixel

    let height = getHeightInMetres();
    let width = getWidthInMetres();

    let defaultWidth = 256;

    if ((height > (defaultWidth * maxResolution_preview)) || (width >  (defaultWidth * maxResolution_preview))) {
        valid = false;
    }

    return valid
}

const trueColorES = `//VERSION=3
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

const falseColorES = `//VERSION=3
            function setup() {
            return {
                input: ["B08", "B04", "B03"],
                output: {
                bands: 3,
                sampleType: "AUTO" // default value - scales the output values from [0,1] to [0,255].
                }
            }
            }

            function evaluatePixel(sample) {
            return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02]
            }`

function searchParams() {
    
    let aoiBounds = getBoundingBox();
    console.log('bounds', aoiBounds);

    let timeSpan = getNumDays();

    let height = getHeightInMetres();
    let width = getWidthInMetres();

    let defaultWidth = 256;

    let longestEdge = height >= width ? height : width;
    let ratio = defaultWidth / longestEdge;
    let scaledHeight = Math.round(height * ratio);
    let scaledWidth = Math.round(width * ratio);

    let endDate = getEndDateTime();
    console.log('endDateTime', endDate);
    let startDate = getStartDateTime(timeSpan);
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
                "mosaickingOrder" : "leastCC",
                "previewMode" : "PREVIEW"
            }
          }],
        },
        "output" : {
            "width" : scaledWidth,
            "height" : scaledHeight
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
    if (!validateSearchParams()) {
        toggleRectSizeWarning(true);
    } else {
        toggleRectSizeWarning(false);
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
                console.error("Error fetching image:", errorData);
            } else if (contentType && contentType.startsWith('image/')) {
                // Response is an image, process as Blob
                const blob = await response.blob();
                let src = URL.createObjectURL(blob);
                var bb = params.body.input.bounds.bbox;
                var imageBounds = [[bb[1],bb[0]], [bb[3], bb[2]]];
                var imageLayer = L.imageOverlay(src, imageBounds);
                imageLayer.addTo(map);
                loadedImages.addLayer(imageLayer);
                map.fitBounds(imageBounds);
            }
        } catch (error) {
            console.error('Sentinel API Error:', error);
            throw error;
        }
        editableLayers.clearLayers();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    createMap();
    setupDefaults();
    addEventListners();
});