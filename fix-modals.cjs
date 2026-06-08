const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/flex items-end sm:items-center/g, 'flex items-center')
    .replace(/rounded-t-2xl sm:rounded-2xl/g, 'rounded-2xl m-4')
    .replace(/slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95/g, 'zoom-in-95');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  }
}

walk('./src/components');
