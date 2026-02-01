import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('Type of pdfParse:', typeof pdfParse);
console.log('pdfParse keys:', Object.keys(pdfParse || {}));
if (typeof pdfParse !== 'function') {
    console.log('Is pdfParse.default a function?', typeof pdfParse.default);
}
