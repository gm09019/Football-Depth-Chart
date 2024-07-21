document.addEventListener('DOMContentLoaded', function() {
  console.log('Testing change detection');

  // Existing code follows...
});
document.addEventListener('DOMContentLoaded', function() {
  const startersList = document.getElementById('starters');
  const backupsList = document.getElementById('backups');
  const bestPlaysList = document.getElementById('best-plays');
  const yardageInput = document.getElementById('yardage');
  const minusButton = document.getElementById('minus');
  const plusButton = document.getElementById('plus');

  const API_KEY = 'AIzaSyBQT0HSLG0Duc7iRvcDtv5PFAGXknTk-aY'; // Replace with your actual API key
  const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';
  const CLIENT_ID = 'football-depth-chart-service-a@lexical-period-406219.iam.gserviceaccount.com'; // Replace with your client email

  gapi.load('client:auth2', initClient);

  function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
      scope: "https://www.googleapis.com/auth/spreadsheets"
    }).then(function () {
      gapi.auth2.getAuthInstance().signIn().then(loadSheetsData);
    });
  }

  function loadSheetsData() {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Depth Chart!A2:Z'
    }).then(function(response) {
      const players = response.result.values;
      renderDepthChart(players);
    });
  }

  function renderDepthChart(players) {
    const positions = ['Center', 'Quarter Back', 'Full Back', 'Left Guard', 'Right Guard', 'Left Tackle', 'Right Tackle', 'Left Tight End', 'Right Tight End', 'Left Wing Back', 'Right Wing Back'];
    
    const starters = positions.map(position => players.find(player => player.includes(position)));
    const backups = players.filter(player => !starters.includes(player));

    startersList.innerHTML = starters.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');
    backupsList.innerHTML = backups.map(player => `<li>${player[0]} - ${player[1]}</li>`).join('');

    new Sortable(startersList, {
      group: 'players',
      animation: 150,
      onEnd: handlePlayerMove
    });

    new Sortable(backupsList, {
      group: 'players',
      animation: 150,
      onEnd: handlePlayerMove
    });
  }

  function handlePlayerMove(evt) {
    const movedFrom = evt.from.id;
    const movedTo = evt.to.id;

    if (movedFrom === movedTo) {
      return; // No change in list
    }

    if ((movedFrom === 'starters' && movedTo === 'backups') || (movedFrom === 'backups' && movedTo === 'starters')) {
      swapPlayers();
    } else {
      saveDepthChart();
    }
  }

  function swapPlayers() {
    const starters = [...document.getElementById('starters').children].map(li => li.textContent.split(' - ')[0]);
    const backups = [...document.getElementById('backups').children].map(li => li.textContent.split(' - ')[0]);

    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Depth Chart!A2',
      valueInputOption: 'RAW',
      resource: {
        values: [starters.concat(backups)],
        majorDimension: 'COLUMNS'
      }
    });
  }

  function saveDepthChart() {
    const starters = [...document.getElementById('starters').children].map(li => li.textContent.split(' - ')[0]);
    const backups = [...document.getElementById('backups').children].map(li => li.textContent.split(' - ')[0]);

    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Depth Chart!A2',
      valueInputOption: 'RAW',
      resource: {
        values: [starters.concat(backups)],
        majorDimension: 'COLUMNS'
      }
    });
  }

  document.getElementById('record-play').addEventListener('click', function() {
    const playType = document.getElementById('play-type').value;
    const play = document.getElementById('play').value;
    const yardage = document.getElementById('yardage').value;
    const lineup = [...document.getElementById('starters').children].map(li => li.textContent).join(', ');

    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Play Data!A2',
      valueInputOption: 'RAW',
      resource: {
        values: [[new Date(), lineup, play, yardage, playType]],
        majorDimension: 'ROWS'
      }
    }).then(updateBestPlays);
  });

  function updateBestPlays() {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Play Data!A2:E'
    }).then(function(response) {
      const plays = response.result.values;
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

      bestPlaysList.innerHTML = sortedPlays.map(play => `<li>${play.playName} (${play.type}) - ${play.averageYardage.toFixed(2)} yards</li>`).join('');
    });
  }

  minusButton.addEventListener('click', () => {
    yardageInput.value = (parseInt(yardageInput.value) || 0) - 1;
  });

  plusButton.addEventListener('click', () => {
    yardageInput.value = (parseInt(yardageInput.value) || 0) + 1;
  });
});
