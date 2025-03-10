# Sat-Data-Demo

Sat-Data-Demo is a NodeJS app for ingesting and analysing satellite data. 

It allows users to create Areas of Interest (AOIs) and fill them with real-time processing requests from the Senintel Hub's multi-spectral, multi-temporal big data satellite imagery service.  

## How

This demo uses Vanilla JS for the frontend, Express for the backend and middleware, and MongoDB for storage. This allows the app to authenicate known users against a database, act as an OAuth client to generate and securely store Sentinel tokens, and proxy authorized users' API requests.

The frontend uses a Leaflet map to capture and display user AOIs and their respective satellite data, together with date-time and number inputs to capture the user's requested timespan. 

When users submit the request, the frontend generates the API request parameters for the user's request, modelled on Sentinel's [Process](https://docs.sentinel-hub.com/api/latest/api/process/) API, (this basic demo makes requests for Sentinel-2 L2A PREVIEW data (max. resolution 1500m per pixel), atmospherically corrected imagery from the European Commission's Coperinicus programme's Senitinel 2 satellite) and passes them to our Express middleware. 

Our backend makes an API request using a valid token from our MongoDB, and then passes the response to back to our frontend. PNG image reponses are added to the Leaflet map as image overlays.

## Why

Sentinel Hub API uses OAuth2 Authenication, and requires registered clients to use JSON Web Tokens issued with a validity period from Sentinel's OAuth2 server, to access the service.  

Sentinel's service is billed in both processing units (data processing to generate the requested sat data) as well as HTTP requests. 

This service setup is typical of many satellite data providers.

Sat-Data-Demoo is designed to provide priveleged access for a group of registered users to a single subscription, as often found within an enterprise setting, without exposing the service token to frontend clients.

## Installation

Clone this repo and run ```npm install```.

You'll need to generate an .env file with your own Sentinel Client ID and Secret, MongoDB URI, Session Secret, and Port number. Remember to add this .env to your .gitignore to avoid exposing your Senitinel and MongoDB credentials! 

Run ```npm run dev``` to build the frontend (uses Webpack) and run the server locally. 

Open ```localhost:XXXX``` (where XXXX is the port number you specified in your .env) in a browser to view the app. 

There's no method to create new users from the frontend. You'll need to create a user entry in a 'users' collection in your MongoDB, before you can login. The auth middleware assumes you used bcyrpt to hash user passwords, do not save plaintext passwords in your database!

## Next steps

Some ideas for developing this demo further

Frontend

- Add more inputs to expose more of the (Sentinel) Process API to user
    - Non-preview image data
    - Mosiacking settings
    - Max. cloud coverage settings
    - Data from other satellites
    - Data from all/other bands
    - Data in other file formats
- Add other sat data service providers
    - Maxar
    - PlanetLabs
- Save or upload image responses (images are currently cached in browser)
    - Download to local client
    - Upload to a sat imagery database / AWS bucket
- UI tools to organise imagery layers
    - Stacking order
    - Remove/clear a single image
- Tools for analysis
    - Inspect individual bands
    - Create band composites (false colour)
    - Anaylsis tooling via a Python console
- Batch download, or create orders
    - Capture larger areas
    - Create a recurring order for data over a timeframe

Backend / Tooling

- Use a frontend framework for build, routes, and UI
- Allow users to update their password

## Contributing

Pull requests, contributions and feedback are welcome. 

