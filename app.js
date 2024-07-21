document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);

  document.getElementById('record-play').addEventListener('click', function() {
    const playType = document.getElementById('play-type').value;
    const play = document.getElementById('play').value;
    const yardage = document.getElementById('yardage').value;
    const lineup = [...document.getElementById('starters').children].map(li => li.textContent).join(', ');

    console.log('Recording play');
    console.log('Play Type:', playType);
    console.log('Play:', play);
    console.log('Yardage:', yardage);
    console.log('Lineup:', lineup);

    if (!playType || !play || !yardage || !lineup) {
      console.error('Missing required fields:', { playType, play, yardage, lineup });
      return;
    }

    const playData = [
      [new Date().toISOString(), lineup, play, yardage, playType]
    ];

    console.log('Play Data to Append:', playData);

    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Play Data!A2:E',
      valueInputOption: 'RAW',
      resource: {
        values: playData
      }
    }).then(function(response) {
      console.log('Play recorded:', response);
      updateBestPlays();
    }).catch(function(error) {
      console.error('Error recording play:', error);
      if (error.result && error.result.error) {
        console.error('Error details:', error.result.error);
      }
    });
  });

  gapi.load('client', function() {
    console.log('GAPI library loaded');
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    }).then(function() {
      console.log('GAPI client initialized');
      loadSheetsData();
    }).catch(function(error) {
      console.error('Error initializing GAPI client:', error);
    });
  });

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

  function updateBestPlays() {
    console.log('Updating best plays...');
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Play Data!A2:E'
    }).then(function(response) {
      const plays = response.result.values;
      if (!plays || plays.length === 0) {
        console.log('No play data available');
        return;
      }

      const playStats = {};

      plays.forEach(play => {
        const [ , lineup, playName, yardage, playType] = play;
        if (!playStats[playName]) {
          playStats[playName] = { totalYardage: 0, count: 0, type: playType };
        }
        playStats[playName].totalYardage += parseInt(yardage);
        playStats[playName].count += 1;
      });

      const sortedPlays = Object.entries(playStats).map(([playName, stats]) => ({
        playName,
        averageYardage: stats.totalYardage / stats.count,
        type: stats.type
      })).sort((a, b) => b.type === 'Offense' ? b.averageYardage - a.averageYardage : a.averageYardage - b.averageYardage);

      const bestPlaysList = document.getElementById('best-plays');
      bestPlaysList.innerHTML = sortedPlays.map(play => `<li>${play.playName} (${play.type}) - ${play.averageYardage.toFixed(2)} yards</li>`).join('');
    }).catch(function(error) {
      console.error('Error updating best plays:', error);
    });
  }
});
