import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('Trying require("pdf-parse")...');
const main = require('pdf-parse');
console.log('Main export keys:', Object.keys(main || {}));

console.log('Trying require("pdf-parse/lib/pdf-parse.js")...');
try {
    const lib = require('pdf-parse/lib/pdf-parse.js');
    console.log('Lib export type:', typeof lib);
    if (typeof lib === 'function') console.log('Lib is a function! WE FOUND IT');
} catch (e) {
    console.log('Lib import failed:', e.message);
}

console.log('Trying require("pdf-parse/index.js")...');
try {
    const index = require('pdf-parse/index.js');
    console.log('Index export type:', typeof index);
} catch (e) {
    console.log('Index import failed:', e.message);
}
