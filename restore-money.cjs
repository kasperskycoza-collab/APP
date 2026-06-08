const fs = require('fs');
const path = require('path');

const filesToRestore = [
  'Dashboard.tsx',
  'Analysis.tsx',
  'Goals.tsx',
  'Transactions.tsx',
  'FundGoalModal.tsx'
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  if (filesToRestore.some(name => filePath.endsWith(name))) {
      // Restore JSX calls
      newContent = newContent.replace(/\{formatMoney\(/g, "{formatCurrency(");
      
      // But also need to rename the import ALIAS! Wait, import { formatCurrency as formatMoney } is still correct, 
      // because the local function is const formatCurrency = (amount) => { return formatMoney(amount, currency) };
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Restored money JSX:', filePath);
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
