const { google } = require('googleapis');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const clientEmail = env.match(/GOOGLE_CLIENT_EMAIL=(.*)/)?.[1]?.trim();
const privateKeyStr = env.match(/GOOGLE_PRIVATE_KEY="(.*)"/)?.[1];

const privateKey = privateKeyStr?.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

async function setup() {
  try {
    // 1. Create Spreadsheet
    console.log("Creating new Spreadsheet...");
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "Japanese App DB (Created by Agent)"
        },
        sheets: [
          { properties: { title: "Words_Dataset" } },
          { properties: { title: "Exam_Templates" } },
          { properties: { title: "Exam_Results" } },
          { properties: { title: "Result_Details" } },
        ]
      }
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = createRes.data.spreadsheetUrl;
    console.log("Spreadsheet created:", spreadsheetId);

    // Remove the default "Sheet1" if it exists, wait, we specified the sheets above, so there's no Sheet1.

    // 2. Set Headers
    console.log("Setting up headers...");
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: "Words_Dataset!A1:E1",
            values: [["id", "japanese_word", "bangla_meaning", "image_url", "chapter"]]
          },
          {
            range: "Exam_Templates!A1:F1",
            values: [["template_id", "allowed_users", "total_questions", "chapters", "start_time", "end_time"]]
          },
          {
            range: "Exam_Results!A1:F1",
            values: [["result_id", "user_name", "template_id", "score", "total_marks", "timestamp"]]
          },
          {
            range: "Result_Details!A1:E1",
            values: [["result_id", "word_id", "user_answer", "correct_answer", "is_correct"]]
          }
        ]
      }
    });

    // 3. Make it accessible to anyone with the link
    console.log("Updating permissions to 'Anyone with link can edit'...");
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: "writer",
        type: "anyone",
      }
    });

    // 4. Update .env.local
    console.log("Updating .env.local...");
    let newEnv = env.replace(/GOOGLE_SHEET_ID=.*/g, `GOOGLE_SHEET_ID=${spreadsheetId}`);
    fs.writeFileSync('.env.local', newEnv);

    console.log("DONE!");
    console.log("Your Spreadsheet URL is:", spreadsheetUrl);

  } catch (err) {
    console.error('Error:', err);
  }
}

setup();
