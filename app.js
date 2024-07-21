let gapiInitialized = false;
let gisInitialized = false;

const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
const CLIENT_ID = '897172538215-q7h3a6je890n0ctgd4ca6cg1uv6eha9g.apps.googleusercontent.com';
const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

function gapiLoaded() {
  console.log('GAPI library loaded');
  gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
  console.log('GIS library loaded');
  gisInitialized = true;
}

function handleCredentialResponse(response) {
  console.log('Credential Response:', response);
  const user = jwt_decode(response.credential);
  console.log('User:', user);
  initializeGapiClient();
}

function initializeGapiClient() {
  if (!gisInitialized) return;

  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
  }).then(function () {
    console.log('GAPI client initialized');
    loadSheetsData();
  }).catch(function(error) {
    console.error('GAPI client initialization error:', error);
  });
}

function loadSheetsData() {
  console.log('Loading sheets data...');
  gapi.client.sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges: ['Depth Chart!A2:Z', '
