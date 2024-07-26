const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEET_ID = '1e0EMRqmzGXB9etrRNMW7luqSsxehVeliGaTR8i8ASFw';

// Serve static files (HTML, CSS, etc.)
app.use(express.static(path.join(__dirname)));

// Load service account credentials
const CREDENTIALS = JSON.parse(fs.readFileSync('mason-youth-football-704335378362.json'));

// Authenticate with Google Sheets API
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth.getClient();
}

// Fetch data from Google Sheets
async function fetchSheetData(authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges: ['Depth Chart!A2:Z1000', 'Play Data!A2:E1000'],
  });
  return response.data.valueRanges;
}

// Endpoint to get data from Google Sheets
app.get('/api/sheet-data', async (req, res) => {
  try {
    const authClient = await authenticate();
    const data = await fetchSheetData(authClient);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching sheet data');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
