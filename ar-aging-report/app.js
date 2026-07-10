function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const arFiles = [null, null]; // [file0, file1]

function arDragOver(e, id){ e.preventDefault(); document.getElementById(id).style.borderColor='#1D9E75'; }
function arDragLeave(id){ document.getElementById(id).style.borderColor='#D3D1C7'; }
function arDrop(e, idx){
  e.preventDefault();
  const id = idx===0?'ar-drop-0':'ar-drop-1';
  document.getElementById(id).style.borderColor='#D3D1C7';
  const file = e.dataTransfer.files[0];
  if(file) arSetFile(idx, file);
}
function arFileSelected(idx, input){
  if(input.files[0]) arSetFile(idx, input.files[0]);
}
function arSetFile(idx, file){
  arFiles[idx] = file;
  const icon  = document.getElementById('ar-icon-'+idx);
  const label = document.getElementById('ar-label-'+idx);
  const drop  = document.getElementById(idx===0?'ar-drop-0':'ar-drop-1');
  icon.className  = 'ti ti-file-check';
  icon.style.color = '#1D9E75';
  label.textContent = file.name;
  label.style.color = '#0F6E56';
  drop.style.borderColor = '#1D9E75';
  drop.style.borderStyle = 'solid';
  // Enable button if both files loaded
  if(arFiles[0] && arFiles[1]){
    const btn = document.getElementById('ar-generate-btn');
    btn.disabled = false;
    btn.style.background = '#1E2761';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
  }
}

async function arGenerateReport(){
  const btn = document.getElementById('ar-generate-btn');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  try {
    // Load SheetJS dynamically if not present
    if(typeof XLSX === 'undefined'){
      await new Promise((res,rej)=>{
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    const [wb0, wb1] = await Promise.all([arReadXLSX(arFiles[0]), arReadXLSX(arFiles[1])]);
    const d0 = arParseRows(wb0, arFiles[0].name);
    const d1 = arParseRows(wb1, arFiles[1].name);

    // Determine recent vs old by date in filename
    const recent = d0.fileDate >= d1.fileDate ? d0 : d1;
    const old    = d0.fileDate >= d1.fileDate ? d1 : d0;

    // Apply offset to all customer rows (not totals)
    arApplyOffset(recent.customers);
    arApplyOffset(old.customers);

    // Grand totals (raw, no offset)
    const gt = recent.grandTotal;
    const gtOld = old.grandTotal;

    // Top 15 by total desc
    const top15 = [...recent.customers].sort((a,b)=>b.total-a.total).slice(0,15);

    // Lookup old values for each top15 customer
    const oldMap = {};
    old.customers.forEach(r => oldMap[r.customer] = r);

    // Detect flags (using raw pre-offset values)
    const flags = arDetectFlags(top15, recent.rawMap, old.rawMap);

    // Derive labels
    const rd = recent.fileDate;
    const blueDate  = new Date(rd.slice(0,4), parseInt(rd.slice(4,6))-2, 1);
    const greenDate = new Date(rd.slice(0,4), parseInt(rd.slice(4,6))-3, 1);
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const blueLabel  = MONTHS[blueDate.getMonth()]  + ' Close';
    const greenLabel = MONTHS[greenDate.getMonth()] + ' Close';
    const asOfLabel  = `${rd.slice(4,6)}/${rd.slice(6,8)}/${rd.slice(0,4)}`;
    const outName    = `AR_Aging_Report_${MONTHS[blueDate.getMonth()]}${blueDate.getFullYear()}.html`;

    const html = arBuildHTML({top15, oldMap, gt, gtOld, blueLabel, greenLabel, asOfLabel, flags, outName});
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();

  } catch(err){
    alert('Error generating report: ' + err.message);
    console.error(err);
  }

  btn.innerHTML = '<i class="ti ti-report-analytics" style="font-size:16px;"></i>Generate Report';
  btn.disabled = false;
  btn.style.background = '#1E2761';
  btn.style.color = '#fff';
}

async function arReadXLSX(file){
  return new Promise((res,rej)=>{
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        res(wb);
      } catch(err){ rej(err); }
    };
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });
}

// ---------------------------------------------------------------------------
// The four functions below (arParseRows, arApplyOffset, arDetectFlags,
// arBuildHTML) were MISSING from the uploaded app.js — arGenerateReport()
// called them but they were never defined anywhere in the file, so every
// "Generate Report" click threw a ReferenceError as soon as it tried to run
// them (caught by the try/catch above, which is why nothing visibly happened
// beyond an alert box). They have been reconstructed below based on the
// business rules documented in the companion ar-aging-report skill reference
// (offset logic, Top 15 selection, flag detection, report layout). Please
// spot-check the first generated report against a known-good prior version
// before relying on it for close, since the exact original implementation
// wasn't available to compare against.
// ---------------------------------------------------------------------------

function arToNum(v){
  if(typeof v === 'number') return v;
  if(v===null || v===undefined || v==='') return 0;
  let s = String(v).trim();
  if(s==='') return 0;
  const neg = /^\(.*\)$/.test(s);
  s = s.replace(/[(),$\s]/g,'').replace(/,/g,'');
  const n = parseFloat(s);
  if(isNaN(n)) return 0;
  return neg ? -Math.abs(n) : n;
}

function arParseRows(wb, filename){
  const m = filename.match(/(\d{2})(\d{2})(\d{4})\.xlsx?$/i);
  if(!m){
    throw new Error('Cannot parse date from filename "' + filename + '" — expected pattern JAZAR-ACO-MMDDYYYY.xlsx');
  }
  const mm = m[1], dd = m[2], yyyy = m[3];
  const fileDate = yyyy + mm + dd; // YYYYMMDD, sortable

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});

  // The known NetSuite export layout has headers on row 7 (index 6) and data
  // starting row 9 (index 8). We try to locate the header row by looking for
  // a "Customer" label first, and fall back to the fixed index if not found,
  // so small formatting differences between exports don't silently break this.
  let headerIdx = rows.findIndex(r => r && String(r[0]||'').toLowerCase().includes('customer'));
  let startIdx = headerIdx >= 0 ? headerIdx + 1 : 8;

  const customers = [];
  const rawMap = {};
  let grandTotal = null;

  for(let i=startIdx; i<rows.length; i++){
    const r = rows[i];
    if(!r || r.length===0) continue;
    const name = String(r[0]||'').trim();
    if(!name) continue;

    const cur   = arToNum(r[1]);
    const b30   = arToNum(r[2]);
    const b60   = arToNum(r[3]);
    const b90   = arToNum(r[4]);
    const b90p  = arToNum(r[5]);
    const total = arToNum(r[6]);

    if(name.toLowerCase() === 'total'){
      grandTotal = {cur, b30, b60, b90, b90p, total};
      break;
    }

    customers.push({customer:name, cur, b30, b60, b90, b90p, total});
    rawMap[name] = {cur, b30, b60, b90, b90p, total};
  }

  if(!grandTotal){
    throw new Error('Could not find a "Total" row in ' + filename + ' — check the file format/layout.');
  }
  if(customers.length === 0){
    throw new Error('No customer rows found in ' + filename + '.');
  }

  return {fileDate, customers, grandTotal, rawMap};
}

function arApplyOffset(customers){
  // Reclassifies negative bucket values against positive buckets, oldest
  // bucket first. Total Balance (row.total) is left unchanged.
  customers.forEach(row => {
    const vals = [row.b90p, row.b90, row.b60, row.b30, row.cur]; // oldest -> newest
    for(let i=0; i<vals.length; i++){
      if(vals[i] < 0){
        let credit = -vals[i];
        vals[i] = 0;
        for(let j=0; j<vals.length; j++){
          if(j!==i && vals[j] > 0 && credit > 0){
            const consumed = Math.min(vals[j], credit);
            vals[j] -= consumed;
            credit -= consumed;
          }
        }
        if(credit > 0){
          vals[4] -= credit; // remainder stays in "Not due yet" as negative
        }
      }
    }
    row.b90p = vals[0]; row.b90 = vals[1]; row.b60 = vals[2]; row.b30 = vals[3]; row.cur = vals[4];
  });
}

function arDetectFlags(top15, recentRawMap, oldRawMap){
  const bucketsMap = [['b30','0 – 30'], ['b60','31 – 60'], ['b90','61 – 90'], ['b90p','90+']];
  const flags = {};

  top15.forEach(row => {
    const name = row.customer;
    const rRaw = recentRawMap[name] || {};
    const oRaw = oldRawMap[name] || {};
    const customerFlags = [];

    bucketsMap.forEach(([key, label]) => {
      const rVal = rRaw[key] || 0;
      const oVal = oRaw[key] || 0;
      if(rVal < 0 || oVal < 0){
        let note;
        if(oVal < 0 && rVal >= 0){
          note = 'Bucket was negative in prior close (' + Math.abs(oVal).toLocaleString('en-US') + '). Value changed sign in current close. Verify if credit was correctly applied or rebucketed.';
        } else if(rVal < 0 && oVal === 0){
          note = 'New negative appeared in current close (' + Math.abs(rVal).toLocaleString('en-US') + ') not present in prior close. Verify source of credit.';
        } else {
          note = 'Negative present in both closes. Current: ' + rVal.toLocaleString('en-US') + ' / Prior: ' + oVal.toLocaleString('en-US') + '. Verify if amounts are consistent.';
        }
        customerFlags.push({bucket:label, recentVal:rVal, oldVal:oVal, note});
      }
    });

    if(customerFlags.length) flags[name] = customerFlags;
  });

  return flags;
}

function arBuildHTML(ctx){
  const rows = ctx.top15.map(r => {
    const o = ctx.oldMap[r.customer] || {b90:0, b90p:0};
    return {
      name: r.customer,
      cur: r.cur, b30: r.b30, b60: r.b60, b90: r.b90, b90p: r.b90p,
      oldB90: o.b90 || 0, oldB90p: o.b90p || 0,
      flags: ctx.flags[r.customer] || []
    };
  });

  let dataJSON = JSON.stringify({
    rows,
    gt: {cur:ctx.gt.cur, b30:ctx.gt.b30, b60:ctx.gt.b60, b90:ctx.gt.b90, b90p:ctx.gt.b90p, total:ctx.gt.total},
    gtOld: {b90:ctx.gtOld.b90, b90p:ctx.gtOld.b90p},
    outName: ctx.outName
  });
  // Guard against a customer name accidentally containing "</script>"
  dataJSON = dataJSON.replace(/</g, '\\u003c');

  const n = rows.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(ctx.outName)}</title>
<style>
:root{ --bg:#f5f6f8; --surface:#fff; --border:#d0d7df; --border-md:#b0bcc8; --t1:#1a1a2e; --t2:#6b7a8d; --t3:#b0bcc8; }
body{ margin:0; font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif; background:var(--bg); color:var(--t1); }
.report-wrap{ max-width:1400px; margin:0 auto; padding:24px; }
.report-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; gap:16px; flex-wrap:wrap; }
.report-header h1{ margin:0 0 4px; font-size:22px; }
.report-header .sub{ color:var(--t2); font-size:13px; }
.report-actions{ display:flex; gap:8px; }
.report-actions button{ border:1px solid var(--border-md); background:#fff; color:var(--t1); padding:8px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
.report-actions button:hover{ background:#f0f4f8; }
.report-actions button.lock-btn{ border-color:#1D9E75; color:#0F6E56; }
.report-card{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; overflow-x:auto; }
table{ border-collapse:collapse; width:100%; font-size:12px; }
th,td{ border:1px solid var(--border); padding:6px 8px; text-align:right; white-space:nowrap; }
th:first-child, td:first-child{ text-align:left; position:sticky; left:0; background:inherit; }
thead th{ font-weight:700; }
.grp-blue{ background:#0c447c; color:#b5d4f4; border-color:#185fa5; }
.grp-green{ background:#3b6d11; color:#c0dd97; border-color:#639922; }
.grp-orange{ background:#854f0b; color:#fac775; border-color:#ba7517; }
.divider{ border-left:2px solid var(--border-md); }
tr.total-row td{ background:#f0f4f8; font-weight:600; border-top:1.5px solid var(--border-md); }
tr.pct-row td{ background:#fafbfc; color:var(--t2); font-size:10.5px; }
td.editable{ background:#f0f7ff; cursor:text; }
input.cell-edit{ width:70px; border:none; background:transparent; text-align:right; font:inherit; color:inherit; }
input.cell-edit:focus{ outline:1px solid #1D9E75; }
td.flagged{ background:#fff7e6; color:#7a3e00; }
.flag-icon{ color:#b9770e; margin-right:4px; }
.pos-var{ color:#a32d2d; font-weight:600; }
.neg-var{ color:#27670a; font-weight:600; }
.recalc-note{ margin-top:8px; font-size:12px; color:var(--t2); font-style:italic; }
.flags-section{ margin-top:20px; border:1px solid #ba7517; border-radius:12px; overflow:hidden; }
.flags-head{ background:#854f0b; color:#fff; padding:10px 14px; font-weight:700; font-size:13px; }
.flags-section table{ font-size:12px; }
body.frozen td.editable{ background:inherit; cursor:default; }
body.frozen input.cell-edit{ pointer-events:none; }
body.frozen td.flagged{ background:inherit; color:inherit; }
body.frozen .flag-icon{ display:none; }
body.frozen .flags-section{ display:none; }
body.frozen .recalc-note{ display:none; }
</style>
</head>
<body>
<div class="report-wrap">
  <div class="report-header">
    <div>
      <h1>A/R Aging Report</h1>
      <div class="sub">Days overdue as of ${esc(ctx.asOfLabel)}</div>
    </div>
    <div class="report-actions">
      <button id="lockBtn" class="lock-btn" onclick="arToggleLock()">Lock report</button>
      <button onclick="arCopyImage()">Copy as image</button>
      <button onclick="arDownloadPNG()">Download PNG</button>
    </div>
  </div>
  <div class="report-card" id="reportCard">
    <table id="arTable">
      <thead>
        <tr>
          <th rowspan="2">Days overdue as of ${esc(ctx.asOfLabel)}</th>
          <th class="grp-blue" colspan="7">${esc(ctx.blueLabel)}</th>
          <th class="grp-green divider" colspan="3">${esc(ctx.greenLabel)}</th>
          <th class="grp-orange divider" colspan="2">Variance</th>
        </tr>
        <tr>
          <th class="grp-blue">Not due yet</th>
          <th class="grp-blue">0 – 30</th>
          <th class="grp-blue">31 – 60</th>
          <th class="grp-blue">61 – 90</th>
          <th class="grp-blue">90+</th>
          <th class="grp-blue">60+ days total</th>
          <th class="grp-blue">Total Balance</th>
          <th class="grp-green divider">61 – 90</th>
          <th class="grp-green">90+</th>
          <th class="grp-green">60+ days total</th>
          <th class="grp-orange divider">90+ vs Prior Close</th>
          <th class="grp-orange">60+ vs Prior Close</th>
        </tr>
      </thead>
      <tbody id="arBody"></tbody>
      <tfoot id="arFoot"></tfoot>
    </table>
  </div>
  <div class="recalc-note" id="recalcNote" style="display:none;">* Subtotals and variances recalculated after manual edit.</div>
  <div class="flags-section" id="flagsSection" style="display:none;">
    <div class="flags-head">Negative bucket inconsistencies — Top ${n} (requires investigation)</div>
    <table>
      <thead><tr><th>Customer</th><th>Bucket</th><th>Current close value</th><th>Prior close value</th><th style="text-align:left;">Note</th></tr></thead>
      <tbody id="flagsBody"></tbody>
    </table>
  </div>
  <div style="margin-top:16px;font-size:11px;color:#94a3b8;">Suggested filename when saving: ${esc(ctx.outName)}</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script>
var DATA = ${dataJSON};

function fmt(n){
  if(n === 0) return '-';
  var abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return n < 0 ? '(' + abs + ')' : abs;
}
function pct(n,d){
  if(!d) return '-';
  return Math.round(n/d*100) + '%';
}
function parseInput(val){
  var t = val.trim();
  var isNeg = t.charAt(0) === '(' || t.charAt(0) === '-';
  var num = parseFloat(t.replace(/[(),$\\s]/g,'').replace(/,/g,''));
  if(isNaN(num)) return null;
  return isNeg ? -Math.abs(num) : num;
}
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

var BUCKET_KEYS = ['cur','b30','b60','b90','b90p'];
var FLAG_KEY_BY_LABEL = {'0 – 30':'b30', '31 – 60':'b60', '61 – 90':'b90', '90+':'b90p'};

function flagKeysFor(row){
  var keys = {};
  (row.flags||[]).forEach(function(f){
    var k = FLAG_KEY_BY_LABEL[f.bucket];
    if(k) keys[k] = true;
  });
  return keys;
}

function render(){
  var body = document.getElementById('arBody');
  var html = '';
  var subtotal = {cur:0,b30:0,b60:0,b90:0,b90p:0,oldB90:0,oldB90p:0};

  DATA.rows.forEach(function(row, idx){
    var sixtyPlus = row.b90 + row.b90p;
    var totalBal = row.cur + row.b30 + row.b60 + row.b90 + row.b90p;
    var oldSixtyPlus = row.oldB90 + row.oldB90p;
    var varB90 = row.b90 - row.oldB90;
    var var60 = sixtyPlus - oldSixtyPlus;
    var flagKeys = flagKeysFor(row);
    var hasFlags = (row.flags||[]).length > 0;

    subtotal.cur += row.cur; subtotal.b30 += row.b30; subtotal.b60 += row.b60;
    subtotal.b90 += row.b90; subtotal.b90p += row.b90p;
    subtotal.oldB90 += row.oldB90; subtotal.oldB90p += row.oldB90p;

    html += '<tr>';
    html += '<td>' + (hasFlags ? '<span class="flag-icon">\\u26A0</span>' : '') + esc(row.name) + '</td>';
    BUCKET_KEYS.forEach(function(key){
      var val = row[key];
      var cls = 'editable' + (flagKeys[key] ? ' flagged' : '');
      html += '<td class="' + cls + '"><input class="cell-edit" data-idx="' + idx + '" data-key="' + key + '" value="' + fmt(val) + '" onchange="arCellChanged(this)"></td>';
    });
    html += '<td>' + fmt(sixtyPlus) + '</td>';
    html += '<td>' + fmt(totalBal) + '</td>';
    html += '<td class="divider">' + fmt(row.oldB90) + '</td>';
    html += '<td>' + fmt(row.oldB90p) + '</td>';
    html += '<td>' + fmt(oldSixtyPlus) + '</td>';
    html += '<td class="divider ' + (varB90 > 0 ? 'pos-var' : (varB90 < 0 ? 'neg-var' : '')) + '">' + fmt(varB90) + '</td>';
    html += '<td class="' + (var60 > 0 ? 'pos-var' : (var60 < 0 ? 'neg-var' : '')) + '">' + fmt(var60) + '</td>';
    html += '</tr>';
  });
  body.innerHTML = html;

  var n = DATA.rows.length;
  var t15SixtyPlus = subtotal.b90 + subtotal.b90p;
  var t15Total = subtotal.cur + subtotal.b30 + subtotal.b60 + subtotal.b90 + subtotal.b90p;
  var t15OldSixtyPlus = subtotal.oldB90 + subtotal.oldB90p;
  var t15VarB90 = subtotal.b90 - subtotal.oldB90;
  var t15Var60 = t15SixtyPlus - t15OldSixtyPlus;
  var gt = DATA.gt, gtOld = DATA.gtOld;
  var gtSixtyPlus = gt.b90 + gt.b90p;
  var gtOldSixtyPlus = gtOld.b90 + gtOld.b90p;
  var gtVarB90 = gt.b90 - gtOld.b90;
  var gtVar60 = gtSixtyPlus - gtOldSixtyPlus;

  var foot = '';
  foot += '<tr class="total-row"><td>Top ' + n + ' Total</td>' +
    '<td>' + fmt(subtotal.cur) + '</td><td>' + fmt(subtotal.b30) + '</td><td>' + fmt(subtotal.b60) + '</td>' +
    '<td>' + fmt(subtotal.b90) + '</td><td>' + fmt(subtotal.b90p) + '</td>' +
    '<td>' + fmt(t15SixtyPlus) + '</td><td>' + fmt(t15Total) + '</td>' +
    '<td class="divider">' + fmt(subtotal.oldB90) + '</td><td>' + fmt(subtotal.oldB90p) + '</td><td>' + fmt(t15OldSixtyPlus) + '</td>' +
    '<td class="divider">' + fmt(t15VarB90) + '</td><td>' + fmt(t15Var60) + '</td></tr>';

  foot += '<tr class="pct-row"><td>% of Total Amount (Top ' + n + ' vs Grand Total)</td>' +
    '<td>' + pct(subtotal.cur, gt.cur) + '</td><td>' + pct(subtotal.b30, gt.b30) + '</td><td>' + pct(subtotal.b60, gt.b60) + '</td>' +
    '<td>' + pct(subtotal.b90, gt.b90) + '</td><td>' + pct(subtotal.b90p, gt.b90p) + '</td>' +
    '<td>' + pct(t15SixtyPlus, gtSixtyPlus) + '</td><td>' + pct(t15Total, gt.total) + '</td>' +
    '<td class="divider">-</td><td>-</td><td>-</td><td class="divider">-</td><td>-</td></tr>';

  foot += '<tr class="total-row"><td>Total Amount (Grand Total, no offset)</td>' +
    '<td>' + fmt(gt.cur) + '</td><td>' + fmt(gt.b30) + '</td><td>' + fmt(gt.b60) + '</td>' +
    '<td>' + fmt(gt.b90) + '</td><td>' + fmt(gt.b90p) + '</td>' +
    '<td>' + fmt(gtSixtyPlus) + '</td><td>' + fmt(gt.total) + '</td>' +
    '<td class="divider">' + fmt(gtOld.b90) + '</td><td>' + fmt(gtOld.b90p) + '</td><td>' + fmt(gtOldSixtyPlus) + '</td>' +
    '<td class="divider ' + (gtVarB90 > 0 ? 'pos-var' : (gtVarB90 < 0 ? 'neg-var' : '')) + '">' + fmt(gtVarB90) + '</td>' +
    '<td class="' + (gtVar60 > 0 ? 'pos-var' : (gtVar60 < 0 ? 'neg-var' : '')) + '">' + fmt(gtVar60) + '</td></tr>';

  document.getElementById('arFoot').innerHTML = foot;
  renderFlags();
}

function renderFlags(){
  var any = DATA.rows.some(function(r){ return (r.flags||[]).length > 0; });
  var section = document.getElementById('flagsSection');
  if(!any){ section.style.display = 'none'; return; }
  section.style.display = '';
  var body = document.getElementById('flagsBody');
  var html = '';
  DATA.rows.forEach(function(row){
    (row.flags||[]).forEach(function(f){
      html += '<tr><td>' + esc(row.name) + '</td><td>' + esc(f.bucket) + '</td><td>' + fmt(f.recentVal) + '</td><td>' + fmt(f.oldVal) + '</td><td style="text-align:left;">' + esc(f.note) + '</td></tr>';
    });
  });
  body.innerHTML = html;
}

function arCellChanged(input){
  var idx = parseInt(input.getAttribute('data-idx'), 10);
  var key = input.getAttribute('data-key');
  var val = parseInput(input.value);
  if(val === null){ input.value = fmt(DATA.rows[idx][key]); return; }
  DATA.rows[idx][key] = val;
  document.getElementById('recalcNote').style.display = '';
  render();
}

function arToggleLock(){
  var body = document.body;
  var btn = document.getElementById('lockBtn');
  body.classList.toggle('frozen');
  btn.textContent = body.classList.contains('frozen') ? 'Unlock report' : 'Lock report';
}

function arCopyImage(){
  if(typeof html2canvas === 'undefined'){ alert('Image library not loaded yet, try again in a moment.'); return; }
  html2canvas(document.getElementById('reportCard')).then(function(canvas){
    canvas.toBlob(function(blob){
      if(navigator.clipboard && window.ClipboardItem){
        navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).catch(function(err){
          alert('Copy failed: ' + err.message);
        });
      } else {
        alert('Clipboard image copy is not supported in this browser.');
      }
    });
  });
}

function arDownloadPNG(){
  if(typeof html2canvas === 'undefined'){ alert('Image library not loaded yet, try again in a moment.'); return; }
  html2canvas(document.getElementById('reportCard')).then(function(canvas){
    var link = document.createElement('a');
    link.download = (DATA.outName || 'ar-aging-report').replace(/\\.html$/,'') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

document.title = DATA.outName || 'A/R Aging Report';
render();
</script>
</body>
</html>`;
}
