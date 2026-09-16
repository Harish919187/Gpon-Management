import * as XLSX from 'xlsx';
import { GponRecord } from '../types';
import { generateId } from './id';

export const parseExcelData = async (file: File): Promise<GponRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const normalizeKey = (key: string) => key.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const getVal = (row: any, possibleKeys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const pk of possibleKeys) {
            const npk = normalizeKey(pk);
            const match = rowKeys.find(k => normalizeKey(k) === npk || normalizeKey(k).includes(npk));
            if (match) return row[match];
          }
          return '';
        };

        const parsedData: GponRecord[] = json.map((row: any) => {
          console.log("Raw row data:", row); // For debugging in browser console
          return {
            id: generateId(),
            oltName: String(getVal(row, ['OLTNAME', 'OLT'])),
            oltNumber: String(getVal(row, ['OLTNUMBER', 'OLTNO', 'OLTNUM'])),
            portNumber: String(getVal(row, ['PORTNUMBER', 'PORTNO', 'PORTNUM', 'PORT'])),
            location: String(getVal(row, ['LOCATION', 'ADDRESS', 'AREA'])),
            status: String(getVal(row, ['STATUS', 'STATE'])) || 'Pending',
          };
        });
        
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    
    reader.readAsBinaryString(file);
  });
};
