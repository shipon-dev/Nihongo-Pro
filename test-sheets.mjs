import { verifySheetsConnection } from './src/lib/googleSheets.js';

async function test() {
  const result = await verifySheetsConnection();
  console.log('Result:', result);
}
test();
