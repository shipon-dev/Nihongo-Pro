const { google } = require('googleapis');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const clientEmail = env.match(/GOOGLE_CLIENT_EMAIL=(.*)/)?.[1]?.trim();
const privateKeyStr = env.match(/GOOGLE_PRIVATE_KEY="(.*)"/)?.[1];
const spreadsheetId = "1gpeobpRhjDn36-pEgyJfYdLCkIa2BOaqmZxXK8sRQQ4";

const privateKey = privateKeyStr?.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function test() {
  console.log("Testing with Spreadsheet ID:", spreadsheetId);
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Connected! Title:', res.data.properties.title);
    
    // Log current sheets
    console.log("Current Sheets:");
    res.data.sheets.forEach(s => console.log(s.properties.title));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
