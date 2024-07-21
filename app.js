document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY'; // Replace with your actual API key
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';
  const CLIENT_ID = '897172538215-q7h3a6je890n0ctgd4ca6cg1uv6eha9g.apps.googleusercontent.com'; // Replace with your actual client ID

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);
  console.log('CLIENT_ID:', CLIENT_ID);

  function handleCredentialResponse(response) {
    console.log('Encoded JWT ID token: ' + response.credential);
    gapi.load('client', initClient);
  }

  function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    }).then(function () {
      console.log('GAPI client initialized');
      loadSheetsData();
    }, function(error) {
      console.error('Error initializing GAPI client:', error);
    });
  }

  function loadSheetsData() {
    console.log('Loading sheets data...');
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Depth Chart!A2:Z'
    }).then(function(response) {
      console.log('Sheets data loaded:', response);
      const players = response.result.values;
      console.log('Players:', players);
    }, function(error) {
      console.error('Error loading sheets data:', error);
    });
  }

  window.onload = function() {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById('g_id_signin'),
      { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt(); // Also display the One Tap dialog
  };
});
