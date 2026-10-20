'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
const broken='| SKU | Description | Qty |\n| --- | --- | ---: |\n| 0017 | Cedar | Oak | 12 |\n| 0021 | Spruce | 8 |';
test('extra cells remain visible and cannot be exported',()=>{
 const p=C.parse(broken);assert.equal(p.headers.length,3);
 assert.deepEqual(p.rows[0].cells,['0017','Cedar','Oak','12']);
 assert.deepEqual(p.issues,[{code:'width',line:3,expected:3,actual:4}]);
 assert.throws(()=>C.makeWorkbook(broken),/Resolve/);
});
test('explicit joining escapes the literal pipe and keeps every value',()=>{
 const fixed=C.joinAdjacent(broken,3,1);
 assert.deepEqual(C.parse(fixed.source).rows[0].cells,['0017','Cedar | Oak','12']);
 assert.equal(C.parse(fixed.source).issues.length,0);assert.equal(fixed.repair.before,broken.split('\n')[2]);
 assert.deepEqual(fixed.repair.joinedCells,[2,3]);assert.equal(broken.includes('Cedar \\| Oak'),false);
 assert.deepEqual(fixed.source.split('\n').filter((_,i)=>i!==2),broken.split('\n').filter((_,i)=>i!==2));
});
test('a short row is not padded',()=>{
 const p=C.parse('| A | B | C |\n| - | - | - |\n| one | two |');
 assert.deepEqual(p.rows[0].cells,['one','two']);assert.equal(p.issues[0].actual,2);
});
test('a body line without pipes is retained as a short row, not discarded as prose',()=>{
 const source='| A | B |\n| - | - |\none value';const p=C.parse(source);
 assert.deepEqual(p.rows[0].cells,['one value']);assert.equal(p.issues[0].code,'width');assert.throws(()=>C.makeWorkbook(source));
});
test('a single-column table keeps body lines without outer pipes',()=>{
 const p=C.parse('| A |\n| - |\none value\nanother');
 assert.deepEqual(p.rows.map(r=>r.cells),[['one value'],['another']]);assert.equal(p.issues.length,0);
});
test('divider width mismatch blocks export',()=>{
 const source='| A | B |\n| - |\n| 1 | 2 |';
 assert.equal(C.parse(source).issues[0].code,'divider');assert.throws(()=>C.makeWorkbook(source));
});
test('more than one separated table cannot be silently reduced to the first',()=>{
 const source='| A | B |\n| - | - |\n| 1 | 2 |\n\n| C | D |\n| - | - |\n| 3 | 4 |';
 assert.equal(C.parse(source).tableCount,2);assert.ok(C.parse(source).issues.some(x=>x.code==='multiple'));assert.throws(()=>C.makeWorkbook(source));
});
test('ordinary fenced code is ignored; a whole Markdown wrapper can be reviewed',()=>{
 assert.equal(C.parse('```js\n'+broken+'\n```').tableCount,0);
 assert.equal(C.parse('```markdown\n'+broken+'\n```').rows[0].line,4);
});
test('escaped pipes, escaped backslashes and empty last cells retain their meaning',()=>{
 assert.deepEqual(C.splitRow(String.raw`| 007 | Cedar \| Oak | C:\\Temp | |`),['007','Cedar | Oak','C:\\Temp','']);
 assert.deepEqual(C.splitRow('A | B |'),['A','B']);
});
test('joining a CRLF source preserves other line endings',()=>{
 const source=broken.replaceAll('\n','\r\n');
 const fixed=C.joinAdjacent(source,3,1).source;
 assert.equal(fixed.split('\r\n').length,4);assert.equal(fixed.includes('Cedar \\| Oak'),true);
});
test('join requires an over-wide data row and valid adjacent cells',()=>{
 for(const [line,left] of [[1,0],[3,-1],[3,3],[4,0],[99,0]])assert.throws(()=>C.joinAdjacent(broken,line,left));
});
test('numeric conversion is explicit and rejects identifiers and formulas',()=>{
 const source='| ID | Value |\n| - | - |\n| 0017 | =2+2 |';const p=C.parse(source);
 assert.deepEqual(C.typeIssues(p,['text','text']),[]);
 assert.equal(C.typeIssues(p,['number','text'])[0].code,'plainDecimal');
 assert.equal(C.typeIssues(p,['text','number'])[0].code,'plainDecimal');
 assert.throws(()=>C.makeWorkbook(source,['text','number']));
});
test('numeric precision and underflow are checked rather than rounded into acceptance',()=>{
 for(const value of ['1234567890123456','1e4','1,000','$10','00','0.'+'0'.repeat(400)+'1'])assert.throws(()=>C.numeric(value));
 assert.equal(C.numeric('12.5'),12.5);assert.equal(C.numeric('-0.01'),-.01);assert.equal(C.numeric(''),null);
});
test('invalid XML controls and broken Unicode cannot become a workbook',()=>{
 for(const value of ['\x00','\ufffe','\ud800']) {
  const source='| A | B |\n| - | - |\n| safe | '+value+' |';assert.ok(C.parse(source).issues.some(x=>x.code==='characters'));assert.throws(()=>C.makeWorkbook(source));
 }
});
test('oversized input and excessive rows fail without a partial export',()=>{
 assert.equal(C.parse('x'.repeat(C.LIMITS.bytes+1)).issues[0].code,'size');
 const source='| A | B |\n| - | - |\n'+Array.from({length:1001},()=> '| a | b |').join('\n');
 assert.ok(C.parse(source).issues.some(x=>x.code==='rows'));assert.equal(C.parse(source).rows.length,1001);assert.throws(()=>C.makeWorkbook(source));
});
test('an extremely wide broken row retains every cell and cannot export',()=>{
 const source='| A | B |\n| - | - |\n| '+Array.from({length:80},(_,i)=>String(i)).join(' | ')+' |';
 const p=C.parse(source);assert.equal(p.rows[0].cells.length,80);assert.equal(p.rows[0].cells[79],'79');assert.throws(()=>C.makeWorkbook(source));
});
test('untrusted header names and markup stay ordinary string data',()=>{
 const source='| __proto__ | <script> |\n| - | - |\n| 0007 | <img onerror=alert(1)> |';
 const workbook=C.makeWorkbook(source);
 assert.equal(new DataView(workbook.buffer).getUint32(0,true),0x04034b50);
 assert.ok(new TextDecoder().decode(workbook).includes('&lt;img onerror=alert(1)&gt;'));
});
