document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);

  // Function to load the Google Sheets data
  function loadSheetsData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?ranges=Depth Chart!A2:Z&ranges=Play Data!A2:E&key=${API_KEY}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Sheets data loaded:', data);
        const players = data.valueRanges[0].values || [];
        const plays = data.valueRanges[1].values || [];
        console.log('Players:', players);
        console.log('Plays:', plays);
        renderDepthChart(players);
        updateBestPlays(plays);
      })
      .catch(error => console.error('Error loading sheets data:', error));
  }

  // Function to render the depth chart
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
        backups.splice(playerIndex, 1); // Remove starter from backups
      } else {
        starters.push([`No starter for ${position}`, position]);
      }
    });

    console.log('Starters:', starters);
    console.log('Backups:', backups);

    startersList.innerHTML = starters.map(player => player[0].includes('No starter') ? `<li>${player[0]}</li>` : `<li>${player[0]} - ${player[1]}</li>`).join('');
    backupsList.innerHTML = backups.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');
  }

  // Function to update the best plays
  function updateBestPlays(plays) {
    console.log('Updating best plays');
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
  }

  // Event listener for recording a play
  document.getElementById('record-play').addEventListener('click', function() {
    const playType = document.getElementById('play-type').value;
    const play = document.getElementById('play').value.trim();
    const yardage = document.getElementById('yardage').value;
    const lineup = [...document.getElementById('starters').children].map(li => li.textContent).join(', ');

    console.log('Recording play');
    console.log('Play Type:', playType);
    console.log('Play:', play);
    console.log('Yardage:', yardage);
    console.log('Lineup:', lineup);

    if (!playType || !play || !yardage || !lineup) {
      console.error('Missing required fields:', { playType, play, yardage, lineup });
      alert('Please fill in all fields before recording the play.');
      return;
    }

    const playData = [
      [new Date().toISOString(), lineup, play, yardage, playType]
    ];

    console.log('Play Data to Append:', playData);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Play Data!A2:E:append?valueInputOption=RAW&key=${API_KEY}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: playData })
    }).then(response => response.json())
      .then(data => {
        console.log('Play recorded:', data);
        loadSheetsData(); // Refresh the data
      })
      .catch(error => console.error('Error recording play:', error));
  });

  loadSheetsData(); // Initial load
});
