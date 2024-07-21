let API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
let CLIENT_ID = '897172538215-q7h3a6je890n0ctgd4ca6cg1uv6eha9g.apps.googleusercontent.com';
let SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

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

  const positions = ['Center', 'Quarter Back', 'Full Back', 'Left Guard', 'Right Guard', 'Left Tackle', 'Right Tackle', 'Left Tight End', 'Right Tight End', 'Left Wing Back', 'Right Wing Back'];

  const starters = [];
  const backups = [...players];

  positions.forEach(position => {
    const playerIndex = players.findIndex(p => p[1] === position);
    if (playerIndex !== -1) {
      const player = players[playerIndex];
      starters.push([player[0], player[1]]);
      backups.splice(backups.indexOf(player), 1); // Remove starter from backups
    } else {
      starters.push([`No starter for ${position}`, position]);
    }
  });

  console.log('Starters:', starters);
  console.log('Backups:', backups);

  startersList.innerHTML = starters.map(player => player[0].includes('No starter') ? `<li>${player[0]}</li>` : `<li>${player[0]} - ${player[1]}</li>`).join('');
  backupsList.innerHTML = backups.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);
  console.log('CLIENT_ID:', CLIENT_ID);
});
