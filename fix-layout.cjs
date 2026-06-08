const fs = require('fs');
const path = require('path');
const dir = './src/components';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    content = content.replace(/max-h-\[90vh\]/g, 'max-h-[85vh]');
    content = content.replace(/overflow-y-auto/g, 'overflow-y-auto custom-scrollbar');
    content = content.replace(/overflow-y-auto custom-scrollbar custom-scrollbar/g, 'overflow-y-auto custom-scrollbar');
    content = content.replace(/flex flex-col max-h-\[85vh\] flex flex-col/g, 'flex flex-col max-h-[85vh]');
    content = content.replace(/flex flex-col max-h-\[90vh\] flex flex-col/g, 'flex flex-col max-h-[85vh]');
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
  }
}
