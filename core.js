(function (root) {
  'use strict';
  const LIMITS = Object.freeze({bytes:262144, rows:1000, columns:32, cells:20000});
  const encoder = new TextEncoder();

  function splitRow(line) {
    const raw=line.trim(); const cells=[]; let value=''; let lastDelimiter=false;
    for(let i=0;i<raw.length;i++) {
      const c=raw[i];
      if(c==='\\' && ['\\','|'].includes(raw[i+1])) {value+=raw[++i];lastDelimiter=false;}
      else if(c==='|') {cells.push(value.trim());value='';lastDelimiter=true;}
      else {value+=c;lastDelimiter=false;}
    }
    cells.push(value.trim());
    if(raw.startsWith('|'))cells.shift();
    if(lastDelimiter)cells.pop();
    return cells;
  }
  function parse(source) {
    if(typeof source!=='string')throw new TypeError('Source must be text');
    const result={headers:[],rows:[],issues:[],contextLines:0,tableCount:0};
    if(encoder.encode(source).length>LIMITS.bytes) {result.issues.push({code:'size',line:1});return result;}
    if(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/.test(source) || [...source].some(c=>c.codePointAt(0)>=0xd800 && c.codePointAt(0)<=0xdfff))
      result.issues.push({code:'characters',line:1});
    const lines=source.split('\n'); const used=new Set(); let fenced=false;
    const nonempty=lines.map((s,i)=>({s:s.trim(),i})).filter(x=>x.s);
    const wrapper=nonempty.length>=2 && /^```(?:md|markdown)?$/i.test(nonempty[0].s) && nonempty.at(-1).s==='```';
    for(let i=0;i<lines.length-1;i++) {
      const text=lines[i].trim();
      if(/^(`{3,}|~{3,})/.test(text)) {if(!wrapper)fenced=!fenced;continue;}
      if(fenced || !text.includes('|'))continue;
      const markers=splitRow(lines[i+1]);
      if(!markers.length || !markers.every(cell=>/^:?-+:?$/.test(cell)))continue;
      result.tableCount++;
      const header=splitRow(lines[i]);
      if(result.tableCount>1) {result.issues.push({code:'multiple',line:i+1});continue;}
      result.headers=header; used.add(i);used.add(i+1);
      if(header.length!==markers.length)result.issues.push({code:'divider',line:i+2,expected:header.length,actual:markers.length});
      if(header.length>LIMITS.columns)result.issues.push({code:'columns',line:i+1});
      i++;
      while(i+1<lines.length && lines[i+1].trim() && lines[i+1].includes('|') && !/^(`{3,}|~{3,})/.test(lines[i+1].trim())) {
        i++;used.add(i);const cells=splitRow(lines[i]);
        result.rows.push({line:i+1,cells});
        if(cells.length!==header.length)result.issues.push({code:'width',line:i+1,expected:header.length,actual:cells.length});
        if(cells.some(c=>c.length>32767))result.issues.push({code:'cellLength',line:i+1});
      }
    }
    if(!result.tableCount && source.trim())result.issues.push({code:'missing',line:1});
    if(result.headers.some(c=>c.length>32767))result.issues.push({code:'cellLength',line:1});
    if(result.rows.length>LIMITS.rows || result.rows.reduce((n,r)=>n+r.cells.length,0)>LIMITS.cells)
      result.issues.push({code:'rows',line:1});
    result.contextLines=lines.filter((s,i)=>s.trim() && !used.has(i) && !(wrapper && [nonempty[0].i,nonempty.at(-1).i].includes(i))).length;
    return result;
  }
  function joinAdjacent(source,line,left) {
    const model=parse(source);const row=model.rows.find(r=>r.line===line);
    if(!row || row.cells.length<=model.headers.length || !Number.isInteger(left) || left<0 || left>=row.cells.length-1)
      throw new Error('Choose two adjacent cells in an over-wide row');
    const cells=row.cells.slice();cells.splice(left,2,cells[left]+' | '+cells[left+1]);
    const lines=source.split('\n');const before=lines[line-1];
    const after='| '+cells.map(c=>c.replace(/\\/g,'\\\\').replace(/\|/g,'\\|')).join(' | ')+' |'+(before.endsWith('\r')?'\r':'');
    lines[line-1]=after;
    return {source:lines.join('\n'),repair:{line,before,after,joinedCells:[left+1,left+2]}};
  }
  function numeric(value) {
    if(value==='')return null;
    if(!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value))throw new Error('plainDecimal');
    const digits=value.replace(/^-?0*\.?0*/, '').replace('.','');
    if(digits.length>15 || !Number.isFinite(Number(value)) || (Number(value)===0 && /[1-9]/.test(value)))throw new Error('precision');
    return Number(value);
  }
  function typeIssues(model,types) {
    if(!Array.isArray(types) || types.length!==model.headers.length || types.some(t=>!['text','number'].includes(t)))
      throw new Error('Invalid column types');
    const issues=[];
    model.rows.forEach(row=>row.cells.forEach((value,column)=>{
      if(types[column]==='number')try {numeric(value);}catch(error){issues.push({code:error.message,line:row.line,column:column+1});}
    }));
    return issues;
  }
  function xml(s) {return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
  const crcTable=Array.from({length:256},(_,n)=>{
    for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;
  });
  function crc(bytes) {let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
  function zip(entries) {
    const chunks=[];const central=[];let offset=0;
    const u16=(v,o,n)=>v.setUint16(o,n,true),u32=(v,o,n)=>v.setUint32(o,n,true);
    for(const [filename,text] of entries) {
      const name=encoder.encode(filename),data=encoder.encode(text),checksum=crc(data);
      const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
      u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,12,33);
      u32(v,14,checksum);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,name.length);header.set(name,30);
      chunks.push(header,data);
      const directory=new Uint8Array(46+name.length),d=new DataView(directory.buffer);
      u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x800);u16(d,14,33);
      u32(d,16,checksum);u32(d,20,data.length);u32(d,24,data.length);u16(d,28,name.length);u32(d,42,offset);directory.set(name,46);
      central.push(directory);offset+=header.length+data.length;
    }
    const centralSize=central.reduce((n,x)=>n+x.length,0);const end=new Uint8Array(22),e=new DataView(end.buffer);
    u32(e,0,0x06054b50);u16(e,8,entries.length);u16(e,10,entries.length);u32(e,12,centralSize);u32(e,16,offset);
    const all=[...chunks,...central,end];const result=new Uint8Array(all.reduce((n,x)=>n+x.length,0));let i=0;
    for(const chunk of all){result.set(chunk,i);i+=chunk.length;}return result;
  }
  function columnName(n) {let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  function makeWorkbook(source,types) {
    const model=parse(source);types=types||model.headers.map(()=>'text');
    if(!model.headers.length || model.issues.length || typeIssues(model,types).length)throw new Error('Resolve the table issues before exporting');
    const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const rows=[model.headers,...model.rows.map(r=>r.cells)];
    const sheetRows=rows.map((cells,i)=>'<row r="'+(i+1)+'">'+cells.map((value,j)=>{
      const ref=columnName(j)+(i+1);
      if(i>0 && types[j]==='number' && value!=='')return '<c r="'+ref+'" s="2"><v>'+numeric(value)+'</v></c>';
      return '<c r="'+ref+'" t="inlineStr" s="'+(i===0?1:0)+'"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
    }).join('')+'</row>').join('');
    const cols=model.headers.map((_,j)=>{
      const width=Math.min(40,Math.max(12,...rows.map(r=>[...r[j]].length+2)));
      return '<col min="'+(j+1)+'" max="'+(j+1)+'" width="'+width+'" customWidth="1"/>';
    }).join('');
    return zip([
      ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
      ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Reviewed table" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml','<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ['xl/worksheets/sheet1.xml','<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+cols+'</cols><sheetData>'+sheetRows+'</sheetData></worksheet>']
    ]);
  }
  const api=Object.freeze({LIMITS,splitRow,parse,joinAdjacent,numeric,typeIssues,makeWorkbook});
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else root.CellReview=api;
})(typeof globalThis!=='undefined'?globalThis:this);
