document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
  const CLIENT_ID = '897172538215-q7h3a6je890n0ctgd4ca6cg1uv6eha9g.apps.googleusercontent.com';
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);
  console.log('CLIENT_ID:', CLIENT_ID);

  gapi.load('client:auth2', initClient);

  function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
      scope: "https://www.googleapis.com/auth/spreadsheets"
    }).then(function () {
      console.log('GAPI client initialized');
      gapi.auth2.getAuthInstance().signIn().then(loadSheetsData).catch(function(error) {
        console.error('Sign-in error:', error);
      });
    }).catch(function(error) {
      console.error('GAPI client initialization error:', error);
      console.log('Error details:', error.details);
    });
  }

  function loadSheetsData() {
    console.log('Loading sheets data...');
    gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: ['Depth Chart!A2:Z', 'Play Data!A2:E']
    }).then(function(response) {
      console.log('Sheets data loaded:', response);
      const players = response.result.valueRanges[0].values;
      console.log('Players:', players);
      renderDepthChart(players);
    }).catch(function(error) {
      console.error('Error loading sheets data:', error);
    });
  }

  function renderDepthChart(players) {
    console.log('Rendering depth chart');
    const startersList = document.getElementById('starters');
    const backupsList = document.getElementById('backups');

    const positions = ['Center', 'Quarter Back', '
