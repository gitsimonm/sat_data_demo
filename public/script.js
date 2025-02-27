
// function logout() {
//     document.getElementById('login-form').classList.remove('hidden');
//     document.getElementById('content').classList.add('hidden'); 
//     document.getElementById('username').value = '';
//     document.getElementById('password').value = '';
// }

// function showError(msg) {
//     const errorDiv = document.getElementById('error-message');
//     errorDiv.textContent = msg;
//     setTimeout(() => {errorDiv.textContent = '', 3000});
// }

function createMap() {
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    var editableLayers = new L.FeatureGroup();
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

