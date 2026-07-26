const fs = require('fs');
const data = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = data.split('\n');
const badLineIndex = 1313;
let badLine = lines[badLineIndex];
if (badLine.startsWith('"') && badLine.endsWith('"')) {
  badLine = badLine.substring(1, badLine.length - 1);
}
badLine = badLine.replace(/\\n/g, '\n').replace(/\\"/g, '"');
lines[badLineIndex] = badLine;
fs.writeFileSync('src/components/Dashboard.tsx', lines.join('\n'));
