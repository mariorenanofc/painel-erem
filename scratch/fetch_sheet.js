const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function main() {
  const url = 'https://docs.google.com/spreadsheets/d/1himFlAIQbTyLiUnytkE5MsUiq9X47vdH3DaB59U9y-E/export?format=xlsx';
  console.log('Downloading spreadsheet from:', url);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download spreadsheet: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Parsing spreadsheet...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const output = [];
    output.push('# Google Sheet Structure and Sample Data');
    output.push(`Downloaded at: ${new Date().toLocaleString()}`);
    output.push('');
    
    for (const sheetName of workbook.SheetNames) {
      output.push(`## Sheet: \`${sheetName}\``);
      const sheet = workbook.Sheets[sheetName];
      // Convert to JSON array of arrays
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (rows.length === 0) {
        output.push('Empty sheet.');
        output.push('');
        continue;
      }
      
      const headers = rows[0];
      output.push('**Headers:**');
      output.push(headers.map((h, i) => `${i + 1}. \`${h || ''}\``).join(', '));
      output.push('');
      
      output.push('**Sample Row (Row 2):**');
      if (rows.length > 1) {
        const sampleRow = rows[1];
        const formatted = sampleRow.map((cell, idx) => `* **${headers[idx] || `Col ${idx + 1}`}**: ${cell}`).join('\n');
        output.push(formatted);
      } else {
        output.push('*No sample data*');
      }
      output.push('');
      output.push('---');
      output.push('');
    }
    
    const outputPath = path.join(__dirname, 'sheet_analysis.md');
    fs.writeFileSync(outputPath, output.join('\n'));
    console.log('Successfully written sheet analysis to:', outputPath);
    
  } catch (error) {
    console.error('Error fetching sheet:', error);
  }
}

main();
