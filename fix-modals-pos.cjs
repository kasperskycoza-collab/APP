const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/sm:p-5/g, 'p-5');
  newContent = newContent.replace(/z-50/g, 'z-[60]');
  newContent = newContent.replace(/rounded-2xl m-4/g, 'rounded-2xl flex flex-col'); // avoid double m-4 if it was added

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed modals pos:', filePath);
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
