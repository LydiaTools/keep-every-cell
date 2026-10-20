'use strict';
(() => {
  const Core=window.CellReview,$=id=>document.getElementById(id);
  let language=new URLSearchParams(location.search).get('lang')==='zh'?'zh':'en';
  let model=Core.parse(''),types=[],repairs=[],timer;
  const words={
    en:{skip:'Skip to source',sourceLink:'Source & guide',title:'Fix the row before Excel sees it.',intro:'An extra pipe can put a quantity in the wrong column. Keep every cell visible, choose the repair, then download a workbook.',example:'Try a broken table',open:'Open .md / .txt',local:'In this tab. No uploads or account.',input:'Source table',inputLabel:'Markdown table source',clear:'Clear',preview:'Check the columns',syntax:'A literal pipe inside a cell is written as \\|. Markdown styling stays as text.',emptyTitle:'Start with the table you have.',emptyBody:'Paste Markdown on the left, open a UTF-8 file, or try the original sample.',typesNote:'Columns start as Text. Choose Number only for quantities you want to calculate. IDs, dates and formula-like text are not inferred.',reviewJson:'Save review JSON',download:'Download reviewed Excel',scopeTitle:'What is checked, and what stays yours?',scopeBody:'This tool checks table structure and your chosen number columns, not whether AI-generated facts are true. It handles one small pipe-delimited Markdown table. It does not read PDF, CSV, images or existing Excel files. Text columns keep their literal values; number conversion is your choice.',limits:'UTF-8 input: 256 KiB, 1,000 data rows, 32 header columns, 20,000 data cells. Preview shows the first 50 rows. Input is not saved after reload; download your review if you need it later.',footer:'Original, open-source work by',feedback:'Report a reproducible problem',placeholder:'Paste one Markdown table here…',dimensions:'{rows} rows · {columns} header columns',extra:'Unassigned',text:'Text',number:'Number',columnType:'Column type: {name}',width:'Line {line}: {actual} cells; the header expects {expected}.',divider:'Line {line}: the divider has {actual} cells; the header has {expected}.',size:'Input exceeds 256 KiB. Use a smaller table; no partial export is made.',characters:'Remove unsupported control characters or broken Unicode before export.',columns:'This preview supports up to 32 header columns. Nothing is exported partially.',rows:'This preview supports 1,000 data rows and 20,000 data cells. Use a smaller table.',cellLength:'Line {line}: a cell exceeds the Excel text limit of 32,767 characters.',multiple:'Line {line}: another table was found. Paste one table at a time.',missing:'No supported table found. Use a header, a pipe divider, and data rows.',plainDecimal:'Line {line}, column {column}: choose Text or use a plain decimal without grouping, currency or exponents.',precision:'Line {line}, column {column}: this number is outside the supported precision. Keep it as Text.',choosePair:'Choose which two cells belong together',pair:'Join {a} + {b}: {value}',join:'Join these cells',editLine:'Edit line {line} in source',emptyStatus:'Paste a table to begin.',blocked:'Resolve {count} {issueWord} before Excel export.',ready:'Ready: {rows} {rowWord} checked against {columns} columns.',changes:'{count} deliberate {changeWord} recorded. Review JSON keeps the current source and change details.',context:'{count} non-table line(s) stay in the source; they are not included in the workbook.',previewLimit:'Showing the first 50 of {count} data rows. Export includes all valid rows.',sampleNotice:'Original synthetic sample: one extra separator. Choose cells 2 + 3 on line 3 to keep “Cedar | Oak” together.',joined:'Line {line} changed by your selected join. Check the source and preview.',workbookPrepared:'Workbook prepared for download. Text columns stay text; chosen numeric columns become numbers.',jsonPrepared:'Review JSON prepared, including the current source, issues, types and explicit join records.',fileError:'Could not open this file as UTF-8 text. The previous source is unchanged.',fileLarge:'This file exceeds 256 KiB. The previous source is unchanged.',fileLoaded:'Loaded {name}. Check the rows before exporting.',exportError:'Export stopped. Resolve the table issues and try again.',previewColumns:'Preview shows the first 64 of {count} columns. Every parsed cell remains in source and review JSON; fix the mismatched row before Excel export.'},
    zh:{skip:'跳到原文',sourceLink:'源码与说明',title:'先修好这一行，再交给 Excel。',intro:'多一个分隔符，数量就可能跑进别的列。保留每个格子，明确选择修法，再下载工作簿。',example:'试用有问题的示例',open:'打开 .md / .txt',local:'只在当前标签页处理，无需上传或账号。',input:'表格原文',inputLabel:'Markdown 表格原文',clear:'清空',preview:'核对每一列',syntax:'格子内的竖线写成 \\|。Markdown 格式标记保留为文字。',emptyTitle:'从你手里的表格开始。',emptyBody:'在上方粘贴 Markdown、打开 UTF-8 文件，或试用原创示例。',typesNote:'所有列默认“文本”。需要计算的数量列再选“数字”，不自动猜测编号、日期或公式。',reviewJson:'保存核对 JSON',download:'下载已核对的 Excel',scopeTitle:'工具检查什么，哪些判断交给你？',scopeBody:'工具检查表格结构和你选择的数字列，不判断 AI 生成的事实是否正确。支持单个小型竖线 Markdown 表格，不读取 PDF、CSV、图片或现成 Excel。文本列保留字面值，数字转换由你选择。',limits:'UTF-8 输入限 256 KiB、1,000 行数据、32 列表头、20,000 个数据格。预览展示前 50 行。刷新后不保留输入，需要续作时请下载核对文件。',footer:'原创开源作品，作者',feedback:'反馈可复现的问题',placeholder:'在这里粘贴一个 Markdown 表格…',dimensions:'{rows} 行数据 · {columns} 列表头',extra:'未分配',text:'文本',number:'数字',columnType:'列类型：{name}',width:'第 {line} 行有 {actual} 格，表头需要 {expected} 格。',divider:'第 {line} 行分隔行有 {actual} 格，表头有 {expected} 格。',size:'输入超过 256 KiB。请使用较小的表格，不会部分导出。',characters:'请先移除不支持的控制字符或损坏的 Unicode。',columns:'当前版本最多支持 32 列表头，不会截取后导出。',rows:'当前版本支持 1,000 行数据、20,000 个数据格，请缩小表格。',cellLength:'第 {line} 行有格子超过 Excel 的 32,767 字符文本上限。',multiple:'第 {line} 行发现另一个表格，请一次粘贴一个。',missing:'尚未找到支持的表格，请包含表头、竖线分隔行和数据行。',plainDecimal:'第 {line} 行第 {column} 列：保留文本，或使用不含千分位、货币、指数的普通小数。',precision:'第 {line} 行第 {column} 列数字超出支持的精度，请保留文本。',choosePair:'选择本来应在同一格的两个内容',pair:'合并 {a} + {b}：{value}',join:'合并这两格',editLine:'到原文编辑第 {line} 行',emptyStatus:'粘贴表格即可开始。',blocked:'解决 {count} 个问题后才能导出 Excel。',ready:'可导出：{rows} 行数据已按 {columns} 列核对。',changes:'已记录 {count} 次明确合并。核对 JSON 包含当前原文及这些改动。',context:'另外 {count} 行非表格文字保留在原文中，不写入工作簿。',previewLimit:'预览前 50 行，共 {count} 行。导出包含全部有效行。',sampleNotice:'原创合成示例：多了一个分隔符。在第 3 行选择合并 2 + 3 格，保留“Cedar | Oak”。',joined:'已按你的选择合并第 {line} 行，请核对原文和预览。',workbookPrepared:'工作簿已生成，可由浏览器下载。文本列保留文本，所选数字列写成数字。',jsonPrepared:'核对 JSON 已生成，包含当前原文、问题、列类型及明确合并记录。',fileError:'无法按 UTF-8 文本打开，原有输入未变。',fileLarge:'文件超过 256 KiB，原有输入未变。',fileLoaded:'已打开 {name}，请核对后导出。',exportError:'导出已停止，请先解决表格问题。',previewColumns:'预览展示前 64 列，共 {count} 列。全部已解析格子仍保留在原文和核对 JSON 中，修好错列后才能导出 Excel。'}
  };
  function t(key,values={}) {return (words[language][key]||key).replace(/\{(\w+)\}/g,(_,k)=>String(values[k]??''));}
  function node(tag,text,className) {const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
  function notify(key,values) {$('notice').textContent=key?t(key,values):'';$('notice').classList.toggle('error',['fileError','fileLarge','exportError'].includes(key));}
  function focusLine(line) {const parts=$('source').value.split('\n');const start=parts.slice(0,line-1).reduce((n,s)=>n+s.length+1,0);$('source').focus();$('source').setSelectionRange(start,start+(parts[line-1]||'').length);}
  function update() {
    const previous=model.headers;model=Core.parse($('source').value);
    if(JSON.stringify(previous)!==JSON.stringify(model.headers))types=model.headers.map(()=>'text');
    render();
  }
  function render() {
    const issues=[...model.issues,...(types.length===model.headers.length?Core.typeIssues(model,types):[])];
    const active=!!model.headers.length,ready=active&&!issues.length;
    const widest=Math.max(model.headers.length,...model.rows.map(r=>r.cells.length));
    $('counts').textContent=active?t('dimensions',{rows:model.rows.length,columns:model.headers.length}):'';
    $('empty').hidden=active;$('table-scroll').hidden=!active;$('type-note').hidden=!active;
    const head=$('preview-table').tHead,body=$('preview-table').tBodies[0];head.replaceChildren();body.replaceChildren();
    if(active) {
      const width=Math.max(model.headers.length,...model.rows.map(r=>r.cells.length));
      const tr=node('tr');tr.append(node('th','#','row-number'));
      for(let j=0;j<Math.min(width,64);j++) {
        const th=node('th',model.headers[j]??t('extra'),j>=model.headers.length?'extra':'');
        if(j<model.headers.length) {
          const select=node('select');select.dataset.column=String(j);select.setAttribute('aria-label',t('columnType',{name:model.headers[j]||j+1}));
          for(const type of ['text','number']) {const option=node('option',t(type));option.value=type;select.append(option);}
          select.value=types[j];select.addEventListener('change',()=>{types[j]=select.value;render();$('preview-table').querySelector('select[data-column="'+j+'"]').focus({preventScroll:true});});th.append(select);
        }
        tr.append(th);
      }
      head.append(tr);
      for(const row of model.rows.slice(0,50)) {
        const tr=node('tr',undefined,issues.some(i=>i.line===row.line)?'row-problem':'');tr.dataset.line=String(row.line);
        tr.append(node('td',String(row.line),'row-number'));
        for(let j=0;j<Math.min(width,64);j++) {
          const cell=node('td',row.cells[j]??'',j>=model.headers.length?'extra':j>=row.cells.length?'missing':types[j]==='number'?'as-number':'');
          tr.append(cell);
        }
        body.append(tr);
      }
    }
    const previewNotes=[];if(model.rows.length>50)previewNotes.push(t('previewLimit',{count:model.rows.length}));if(widest>64)previewNotes.push(t('previewColumns',{count:widest}));$('preview-limit').textContent=previewNotes.join(' ');
    const list=$('issues');list.replaceChildren();
    for(const issue of issues.slice(0,25)) {
      const box=node('div',undefined,'issue');box.append(node('p',t(issue.code,issue),'issue-heading'));
      const row=model.rows.find(r=>r.line===issue.line);
      if(issue.code==='width' && row.cells.length>model.headers.length && row.cells.length<=64) {
        const controls=node('div',undefined,'repair-controls'),select=node('select');
        select.setAttribute('aria-label',t('choosePair'));select.dataset.repairLine=String(issue.line);
        const placeholder=node('option',t('choosePair'));placeholder.value='';select.append(placeholder);
        for(let j=0;j<row.cells.length-1;j++) {const option=node('option',t('pair',{a:j+1,b:j+2,value:(row.cells[j]+' | '+row.cells[j+1]).slice(0,65)}));option.value=String(j);select.append(option);}
        const button=node('button',t('join'));button.type='button';button.disabled=true;select.addEventListener('change',()=>{button.disabled=select.value==='';});
        button.addEventListener('click',()=>{const joined=Core.joinAdjacent($('source').value,issue.line,Number(select.value));$('source').value=joined.source;repairs.push(joined.repair);notify('joined',{line:issue.line});update();});
        controls.append(select,button);box.append(controls);
      }
      const edit=node('button',t('editLine',{line:issue.line}),'edit-line');edit.type='button';edit.addEventListener('click',()=>focusLine(issue.line));box.append(edit);list.append(box);
    }
    if(issues.length>25)list.append(node('p',language==='en'?'Showing the first 25 issues; all must be resolved.':'展示前 25 个问题，全部解决后才能导出。','muted'));
    $('context').textContent=model.contextLines?t('context',{count:model.contextLines}):'';
    $('status').textContent=issues.length?t('blocked',{count:issues.length,issueWord:issues.length===1?'issue':'issues'}):ready?t('ready',{rows:model.rows.length,rowWord:model.rows.length===1?'row':'rows',columns:model.headers.length}):t('emptyStatus');
    $('status').className=issues.length?'blocked':ready?'ready':'';
    $('change-count').textContent=repairs.length?t('changes',{count:repairs.length,changeWord:repairs.length===1?'change':'changes'}):'';
    $('download').disabled=!ready;$('review-json').disabled=!$('source').value.trim() || new TextEncoder().encode($('source').value).length>Core.LIMITS.bytes;
  }
  function download(data,name,type) {const url=URL.createObjectURL(new Blob([data],{type}));const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function translate() {document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=language==='zh'?'Keep Every Cell｜AI 表格校对台':'Keep Every Cell — Markdown table review for Excel';document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});$('language').textContent=language==='en'?'中文':'English';$('source').placeholder=t('placeholder');notify('');render();}
  $('source').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{notify('');update();},100);});
  $('example').addEventListener('click',()=>{$('source').value='| SKU | Description | Qty |\n| --- | --- | ---: |\n| 0017 | Cedar | Oak | 12 |\n| 0021 | Spruce | 8 |\n| 0099 | =2+2 | 3 |';repairs=[];update();notify('sampleNotice');});
  $('clear').addEventListener('click',()=>{$('source').value='';repairs=[];notify('');update();});
  $('language').addEventListener('click',()=>{language=language==='en'?'zh':'en';translate();});
  $('open-file').addEventListener('click',()=>$('file').click());
  $('file').addEventListener('change',async()=>{const f=$('file').files[0];if(!f)return;if(f.size>Core.LIMITS.bytes){notify('fileLarge');$('file').value='';return;}try{const text=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());$('source').value=text;repairs=[];update();notify('fileLoaded',{name:f.name});}catch{notify('fileError');}finally{$('file').value='';}});
  $('download').addEventListener('click',()=>{try{const bytes=Core.makeWorkbook($('source').value,types);download(bytes,'reviewed-table.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');notify('workbookPrepared');}catch{notify('exportError');update();}});
  $('review-json').addEventListener('click',()=>{const review={schema_version:1,source:$('source').value,headers:model.headers,rows:model.rows,column_types:types,issues:[...model.issues,...Core.typeIssues(model,types)],explicit_joins:repairs,scope:'Structure and selected numeric columns only; not factual verification.'};download(JSON.stringify(review,null,2)+'\n','table-review.json','application/json');notify('jsonPrepared');});
  translate();
})();
