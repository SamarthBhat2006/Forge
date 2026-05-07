import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Reads a file and returns the raw data.
 * For XLSX, it returns an object with sheet names as keys.
 * For CSV, it returns an array of rows.
 */
export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    reader.onload = (e) => {
      try {
        if (extension === 'csv') {
          const csvData = e.target.result;
          Papa.parse(csvData, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => resolve({ type: 'csv', data: results.data }),
            error: (err) => reject(err)
          });
        } else if (['xlsx', 'xls'].includes(extension)) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets = {};
          
          workbook.SheetNames.forEach(name => {
            sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
          });
          
          resolve({ type: 'xlsx', sheets });
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (err) {
        reject(err);
      }
    };

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Extracts headers and a sample of rows for AI analysis.
 */
export const getSampleData = (rows, limit = 5) => {
  if (!rows || rows.length === 0) return null;
  return {
    headers: rows[0],
    sample: rows.slice(1, limit + 1)
  };
};
