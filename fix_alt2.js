const fs = require('fs');
const path = require('path');

const files = [
  'app/components/inventory-manager.tsx',
  'app/components/pages/BrandsManager.tsx',
  'app/components/pages/HomePage.tsx',
  'app/components/pages/PartnersManager.tsx',
  'app/components/products/Application.tsx',
  'app/components/products/Category.tsx',
  'app/dashboard/page.tsx',
  'app/projects/page.tsx',
  'app/api/send-email/route.ts'
];

let total = 0;
for (const file of files) {
  if (!fs.existsSync(file)) { console.log('SKIP: ' + file); continue; }
  let content = fs.readFileSync(file, 'utf8');
  // Match <SmartImage src={...} className and add alt before className
  // Pattern: <SmartImage src={...} className  (note: we need raw backslash for \s)
  const regex = /<SmartImage src=(\{[^}]+\})\s+className/g;
  const newContent = content.replace(regex, '<SmartImage src=$1 alt="Product image" className');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('FIXED: ' + file);
    total++;
  } else {
    console.log('NO CHANGE: ' + file);
  }
}
console.log('Total fixed: ' + total);