import { google } from "googleapis";

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function getSheetData(range: string) {
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is missing.");
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error: any) {
    console.error(`Error fetching sheet data for range ${range}:`, error);
    throw error;
  }
}

export async function appendSheetRow(range: string, values: any[]) {
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is missing.");
  }
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error appending row to range ${range}:`, error);
    throw error;
  }
}

export async function appendSheetRows(range: string, values: any[][]) {
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is missing.");
  }
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error appending rows to range ${range}:`, error);
    throw error;
  }
}

export async function verifySheetsConnection() {
  if (!clientEmail || !privateKey || !spreadsheetId) {
    return {
      connected: false,
      error: "Missing required Google Sheets credentials in environment variables.",
    };
  }
  try {
    // Attempt to read the spreadsheet metadata or a default cell
    await sheets.spreadsheets.get({ spreadsheetId });
    return { connected: true };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || String(error),
    };
  }
}
