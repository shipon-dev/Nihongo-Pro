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

async function setupHeaders() {
  console.log("Setting up headers...");
  try {
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
    console.log("Headers set successfully!");
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupHeaders();
