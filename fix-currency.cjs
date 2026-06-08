const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  if (content.includes('Intl.NumberFormat')) {
    if (!content.includes("import { formatCurrency } from '../utils'")) {
       const importRegex = /(import [^\n]+ from [^\n]+;)/;
       const match = importRegex.exec(content);
       if (match) {
         newContent = newContent.replace(importRegex, "$1\nimport { formatCurrency } from '../utils';");
       } else {
         newContent = "import { formatCurrency } from '../utils';\n" + newContent;
       }
    }

    if (filePath.includes('Dashboard.tsx')) {
        newContent = newContent.replace(/return new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency, maximumFractionDigits: 0 \}\)\.format\(amount\);/g, "return formatCurrency(amount, currency, 0);");
    } else {
        newContent = newContent.replace(/return new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency \}\)\.format\(amount\);/g, "return formatCurrency(amount, currency);");
    }

    newContent = newContent.replace(/\{new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency \}\)\.format\(spent\)\}/g, "{formatCurrency(spent, currency)}");
    newContent = newContent.replace(/\{new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency \}\)\.format\(limitNum\)\}/g, "{formatCurrency(limitNum, currency)}");
    newContent = newContent.replace(/\{new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency \}\)\.format\(acc\.balance\)\}/g, "{formatCurrency(acc.balance, currency)}");

  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed currency:', filePath);
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
