document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);

  gapi.load('client', initClient);

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
      renderDepthChart(players);
    }, function(error) {
      console.error('Error loading sheets data:', error);
    });
  }

  function renderDepthChart(players) {
    console.log('Rendering depth chart');
    const startersList = document.getElementById('starters');
    const backupsList = document.getElementById('backups');
    
    const positions = ['Center', 'Quarter Back', 'Full Back', 'Left Guard', 'Right Guard', 'Left Tackle', 'Right Tackle', 'Left Tight End', 'Right Tight End', 'Left Wing Back', 'Right Wing Back'];

    const starters = positions.map(position => {
      const player = players.find(player => player.includes(position));
      console.log('Found starter for position', position, player);
      return player;
    });
    const backups = players.filter(player => !starters.includes(player));

    console.log('Starters:', starters);
    console.log('Backups:', backups);

    startersList.innerHTML = starters.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');
    backupsList.innerHTML = backups.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');
  }
});
