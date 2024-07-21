document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY';
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';
  const CLIENT_ID = '897172538215-q7h3a6je890n0ctgd4ca6cg1uv6eha9g.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

  console.log('API_KEY:', API_KEY);
  console.log('SHEET_ID:', SHEET_ID);
  console.log('CLIENT_ID:', CLIENT_ID);

  let tokenClient;
  let gapiInited = false;
  let gisInited = false;

  document.getElementById('record-play').addEventListener('click', handleAuthClick);

  function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
  }

  function initializeGapiClient() {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(function() {
      gapiInited = true;
      maybeEnableButtons();
    });
  }

  function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
  }

  function maybeEnableButtons() {
    if (gapiInited && gisInited) {
      document.getElementById('record-play').style.visibility = 'visible';
    }
  }

  function handleAuthClick() {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      await loadSheetsData();
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing token
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  async function loadSheetsData() {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges: ['Depth Chart!A2:Z1000', 'Play Data!A2:E1000'],
      });
      const data = response.result;
      console.log('Sheets data loaded:', data);
      const players = data.valueRanges[0].values || [];
      const plays = data.valueRanges[1].values || [];
      console.log('Players:', players);
      console.log('Plays:', plays);
      renderDepthChart(players);
      updateBestPlays(plays);
    } catch (error) {
      console.error('Error loading sheets data:', error);
    }
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
      },
      body: JSON.stringify({ values: playData })
    }).then(response => response.json())
      .then(data => {
        console.log('Play recorded:', data);
        loadSheetsData(); // Refresh the data
      })
      .catch(error => console.error('Error recording play:', error));
  });

  gapiLoaded();
  gisLoaded();
});
