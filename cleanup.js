const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'ralvie-logo.svg',
  'ralvie-logo-dark.svg'
];

filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Successfully deleted: ${file}`);
  } else {
    console.log(`File not found or already deleted: ${file}`);
  }
});