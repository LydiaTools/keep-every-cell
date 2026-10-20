'use strict';
const fs=require('node:fs'),path=require('node:path'),C=require('../core.js');
const root=path.resolve(__dirname,'../runs');fs.mkdirSync(root,{recursive:true});
const source='| SKU | Description | Qty |\n| - | - | - |\n| 0017 | Cedar \\| Oak | 12 |\n| 0099 | =2+2 | 3 |\n| 12345678901234567 | 中文 & < > | 0.25 |';
fs.writeFileSync(path.join(root,'text-fixture.xlsx'),C.makeWorkbook(source));
fs.writeFileSync(path.join(root,'typed-fixture.xlsx'),C.makeWorkbook(source,['text','text','number']));
fs.writeFileSync(path.join(root,'fixture-source.md'),source+'\n');
console.log('Wrote original text and explicitly typed workbook fixtures.');
