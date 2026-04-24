// CSV Export
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'passwordHash' && k !== 'avatar' && k !== 'attachment');
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(h => {
      let val = row[h];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape commas and quotes
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// CSV Import (parse CSV string into array of objects)
export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = values[idx]?.trim() || '';
    });
    results.push(obj);
  }
  
  return results;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Read file as text
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
