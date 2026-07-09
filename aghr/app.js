// ── AGHR Report Generator ─────────────────────────────────────
let aghrFile = null;

const AGHR_HIST_FTE = [{"month":"Feb-25","start":692,"newHires":15,"attrition":-10,"ending":697},{"month":"Mar-25","start":697,"newHires":40,"attrition":-19,"ending":718},{"month":"Apr-25","start":718,"newHires":32,"attrition":-15,"ending":735},{"month":"May-25","start":735,"newHires":40,"attrition":-19,"ending":756},{"month":"Jun-25","start":756,"newHires":20,"attrition":-15,"ending":761},{"month":"Jul-25","start":761,"newHires":22,"attrition":-14,"ending":769},{"month":"Aug-25","start":769,"newHires":16,"attrition":-54,"ending":731},{"month":"Sep-25","start":731,"newHires":25,"attrition":-42,"ending":714},{"month":"Oct-25","start":714,"newHires":10,"attrition":-13,"ending":711},{"month":"Nov-25","start":711,"newHires":7,"attrition":-14,"ending":704},{"month":"Dec-25","start":704,"newHires":14,"attrition":-21,"ending":697},{"month":"Jan-26","start":697,"newHires":11,"attrition":-15,"ending":693},{"month":"Feb-26","start":693,"newHires":11,"attrition":-43,"ending":661},{"month":"Mar-26","start":661,"newHires":19,"attrition":-32,"ending":648},{"month":"Apr-26","start":648,"newHires":11,"attrition":-15,"ending":644},{"month":"May-26","start":644,"newHires":27,"attrition":-29,"ending":642},{"month":"Jun-26","start":642,"newHires":22,"attrition":-20,"ending":644}];
const AGHR_HIST_CON = [{"month":"Feb-25","start":77,"newHires":6,"attrition":-3,"ending":80},{"month":"Mar-25","start":80,"newHires":8,"attrition":-5,"ending":83},{"month":"Apr-25","start":83,"newHires":6,"attrition":-4,"ending":85},{"month":"May-25","start":85,"newHires":10,"attrition":-7,"ending":88},{"month":"Jun-25","start":88,"newHires":4,"attrition":-34,"ending":58},{"month":"Jul-25","start":58,"newHires":4,"attrition":-2,"ending":60},{"month":"Aug-25","start":60,"newHires":6,"attrition":-13,"ending":53},{"month":"Sep-25","start":53,"newHires":8,"attrition":-14,"ending":47},{"month":"Oct-25","start":47,"newHires":1,"attrition":-2,"ending":46},{"month":"Nov-25","start":46,"newHires":5,"attrition":-1,"ending":50},{"month":"Dec-25","start":50,"newHires":4,"attrition":-4,"ending":50},{"month":"Jan-26","start":50,"newHires":8,"attrition":-5,"ending":53},{"month":"Feb-26","start":53,"newHires":4,"attrition":-6,"ending":51},{"month":"Mar-26","start":51,"newHires":7,"attrition":-3,"ending":55},{"month":"Apr-26","start":55,"newHires":8,"attrition":-4,"ending":59},{"month":"May-26","start":59,"newHires":4,"attrition":-9,"ending":54},{"month":"Jun-26","start":54,"newHires":9,"attrition":-4,"ending":59}];
const AGHR_HIST_CR  = [{"month":"Feb-25","start":14,"newHires":3,"attrition":0,"ending":17},{"month":"Mar-25","start":17,"newHires":1,"attrition":-1,"ending":17},{"month":"Apr-25","start":17,"newHires":3,"attrition":-1,"ending":19},{"month":"May-25","start":19,"newHires":3,"attrition":-1,"ending":21},{"month":"Jun-25","start":21,"newHires":1,"attrition":0,"ending":22},{"month":"Jul-25","start":22,"newHires":2,"attrition":0,"ending":24},{"month":"Aug-25","start":24,"newHires":1,"attrition":0,"ending":25},{"month":"Sep-25","start":25,"newHires":1,"attrition":-10,"ending":16},{"month":"Oct-25","start":16,"newHires":0,"attrition":-1,"ending":15},{"month":"Nov-25","start":15,"newHires":3,"attrition":0,"ending":18},{"month":"Dec-25","start":18,"newHires":1,"attrition":0,"ending":19},{"month":"Jan-26","start":19,"newHires":0,"attrition":-1,"ending":18},{"month":"Feb-26","start":18,"newHires":1,"attrition":-1,"ending":18},{"month":"Mar-26","start":18,"newHires":1,"attrition":0,"ending":19},{"month":"Apr-26","start":19,"newHires":1,"attrition":-1,"ending":19},{"month":"May-26","start":19,"newHires":0,"attrition":0,"ending":19},{"month":"Jun-26","start":19,"newHires":0,"attrition":0,"ending":19}];
const AGHR_FUTURE   = ['Aug-26','Sep-26','Oct-26','Nov-26','Dec-26','Jan-27','Feb-27'];
const AGHR_MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const AGHR_MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function aghrDragOver(e,id){ e.preventDefault(); document.getElementById(id).style.borderColor='#C4623A'; }
function aghrDragLeave(id){ document.getElementById(id).style.borderColor='#D3D1C7'; }
function aghrDrop(e,idx){ e.preventDefault(); document.getElementById('aghr-drop-0').style.borderColor='#D3D1C7'; const f=e.dataTransfer.files[0]; if(f) aghrSetFile(f); }
function aghrFileSelected(idx,input){ if(input.files[0]) aghrSetFile(input.files[0]); }

function aghrSetFile(file){
  aghrFile = file;
  document.getElementById('aghr-icon-0').className = 'ti ti-file-check';
  document.getElementById('aghr-icon-0').style.color = '#C4623A';
  document.getElementById('aghr-label-0').textContent = file.name;
  document.getElementById('aghr-label-0').style.color = '#993C1D';
  const drop = document.getElementById('aghr-drop-0');
  drop.classList.add('filled');
  drop.style.borderColor = '#C4623A';
  drop.style.borderStyle = 'solid';
  const btn = document.getElementById('aghr-generate-btn');
  btn.disabled = false;
  btn.classList.add('enabled');
}


async function aghrGenerateReport(){
  const btn = document.getElementById('aghr-generate-btn');
  btn.innerHTML = '<i class="ti ti-loader-2"></i>Processing...';
  btn.disabled = true;
  btn.classList.remove('enabled');

  try {
    if(typeof XLSX === 'undefined'){
      await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    }

    if(!aghrFile) throw new Error('Please upload an AGHR workbook first.');
    const fname = aghrFile.name;
    const m = fname.match(/AGHR([A-Za-z]{3})(\d{2})\.xlsx$/i);
    if(!m) throw new Error(`Filename "${fname}" doesn't match pattern AGHRMmmYY.xlsx`);
    const monStr = m[1]; const yr = parseInt('20'+m[2]);
    const monIdx = AGHR_MONTH_ABBR.findIndex(x=>x.toLowerCase()===monStr.toLowerCase());
    if(monIdx<0) throw new Error(`Cannot parse month "${monStr}" from filename`);

    const reportLabel = `${AGHR_MONTH_ABBR[monIdx]}-${String(yr).slice(2)}`;
    const calcMonIdx  = monIdx === 0 ? 11 : monIdx-1;
    const calcYr      = monIdx === 0 ? yr-1 : yr;
    const calcLabel   = `${AGHR_MONTH_ABBR[calcMonIdx]}-${String(calcYr).slice(2)}`;
    const cutoff = new Date(yr, monIdx, 1);

    const wb = await new Promise((res,rej)=>{
      const reader=new FileReader();
      reader.onload=e=>{ try{ res(XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true})); }catch(err){ rej(err); } };
      reader.onerror=rej; reader.readAsArrayBuffer(aghrFile);
    });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

    const headers = raw[2].map(h=>String(h||'').trim());
    const rows = [];
    for(let i=3;i<raw.length;i++){
      const r={};
      headers.forEach((h,j)=>{ r[h]=raw[i][j]!==undefined?raw[i][j]:''; });
      if(!r['Name']&&!r['EE ID']) continue;
      rows.push(r);
    }

    function parseDate(v){
      if(!v) return null;
      if(v instanceof Date) return v;
      if(typeof v==='number'){ return new Date(Math.round((v-25569)*86400000)); }
      const s=String(v).trim();
      if(!s) return null;
      const d=new Date(s);
      return isNaN(d)?null:d;
    }

    rows.forEach(r=>{
      if(r['Worker Type']==='Employee' && r['Employee Type, Contingent Type']!=='Regular'){
        r['Worker Type']='Contingent Worker';
      }
    });

    const filtered = rows.filter(r=>{ const hd=parseDate(r['Original Hire Date']); return hd && hd < cutoff; });

    filtered.forEach(r=>{
      r._isFte = r['Worker Type']==='Employee' && r['Employee Type, Contingent Type']==='Regular';
      r._isCR  = String(r['Work Location']||'').toLowerCase().includes('costa rica');
      r['EE ID'] = r['EE ID']!=='' ? String(Math.round(Number(r['EE ID']))) : '';
      if(r['Cost Center - ID']!==''&&r['Cost Center - ID']!==null) r['Cost Center - ID'] = String(Math.round(Number(r['Cost Center - ID'])));
    });

    const allData = filtered;
    const empData = filtered.filter(r=>r._isFte);
    const conData = filtered.filter(r=>!r._isFte);
    const kpis = { total:allData.length, fte:empData.length, con:conData.length, ft:allData.filter(r=>r['Time Type']==='Full time').length, pt:allData.filter(r=>r['Time Type']!=='Full time').length };

    const calcFirst = new Date(calcYr, calcMonIdx, 1);
    const calcLast  = new Date(calcYr, calcMonIdx+1, 0);
    function countNewHires(arr){ return arr.filter(r=>{ const d=parseDate(r['Original Hire Date']); return d&&d>=calcFirst&&d<=calcLast; }).length; }

    function buildHist(base, ending, newHires){
      const start = base[base.length-1]?.ending||0;
      const attrition = ending - start - newHires;
      const row = {month:calcLabel, start, newHires, attrition, ending};
      const hist = [...base];
      const idx = hist.findIndex(r=>r.month===calcLabel);
      if(idx>=0) hist[idx]=row; else hist.push(row);
      AGHR_FUTURE.forEach(fm=>{ if(!hist.find(r=>r.month===fm)) hist.push({month:fm,start:null,newHires:null,attrition:null,ending:null}); });
      return hist;
    }

    const histFte = buildHist(AGHR_HIST_FTE, empData.length, countNewHires(empData));
    const histCon = buildHist(AGHR_HIST_CON, conData.length, countNewHires(conData));
    const histCr  = buildHist(AGHR_HIST_CR,  filtered.filter(r=>r._isCR).length, countNewHires(filtered.filter(r=>r._isCR)));

    function groupBy(arr, key){ const m={}; arr.forEach(r=>{ const v=r[key]||'Unknown'; if(!m[v]) m[v]={Total:0,FTEs:0,Contingent:0}; m[v].Total++; if(r._isFte) m[v].FTEs++; else m[v].Contingent++; }); return Object.entries(m).map(([k,v])=>({[key]:k,...v})).sort((a,b)=>b.Total-a.Total); }
    const byOrg     = groupBy(allData,'KLT Level Org');
    const byCountry = groupBy(allData,'Country');
    const bySubtype = [];
    const subtypeMap={};
    allData.forEach(r=>{ const key=r['Worker Type']+'||'+r['Employee Type, Contingent Type']; if(!subtypeMap[key]) subtypeMap[key]={wt:r['Worker Type'],st:r['Employee Type, Contingent Type'],count:0}; subtypeMap[key].count++; });
    Object.values(subtypeMap).sort((a,b)=>b.count-a.count).forEach(v=>bySubtype.push({'Worker Type':v.wt,'Employee Type, Contingent Type':v.st,Count:v.count}));

    const pigmentMap={};
    allData.forEach(r=>{ const key=[r['Cost Center'],r['Cost Center - ID'],r['Worker Type'],r['Employee Type, Contingent Type'],r['Time Type'],r['Country']].join('||'); if(!pigmentMap[key]) pigmentMap[key]={cc:r['Cost Center'],ccid:r['Cost Center - ID'],wt:r['Worker Type'],st:r['Employee Type, Contingent Type'],tt:r['Time Type'],country:r['Country'],count:0}; pigmentMap[key].count++; });
    const pigmentRows = Object.values(pigmentMap).sort((a,b)=>b.count-a.count);
    const calcMonthLabel = `${AGHR_MONTHS[calcMonIdx]} ${calcYr}`;

    const html = aghrBuildHTML({allData,empData,conData,kpis,histFte,histCon,histCr,byOrg,byCountry,bySubtype,pigmentRows,calcLabel,reportLabel,calcMonthLabel,headers});
    const win = window.open('','_blank');
    win.document.write(html);
    win.document.close();

  } catch(err){
    alert('Error generating AGHR: '+err.message);
    console.error(err);
  }

  btn.innerHTML = '<i class="ti ti-report-analytics"></i>Generate Report';
  btn.disabled = false;
  btn.classList.add('enabled');
}


function aghrBuildHTML({allData,empData,conData,kpis,histFte,histCon,histCr,byOrg,byCountry,bySubtype,pigmentRows,calcLabel,reportLabel,calcMonthLabel,headers}){
  function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function mvTable(hist){
    const rows=[...hist].reverse();
    let h='<table class="mv-table"><thead><tr><th>Month</th><th>Start HC</th><th>New Hires</th><th>Attrition</th><th>Ending HC</th></tr></thead><tbody>';
    rows.forEach(r=>{
      const isReport=r.month===reportLabel, isCalc=r.month===calcLabel;
      const cls=isReport?'report-month':isCalc?'calc-month':'';
      if(r.start===null){ h+=`<tr class="${cls}"><td>${r.month}</td><td class="empty">—</td><td class="empty">—</td><td class="empty">—</td><td class="empty">—</td></tr>`; return; }
      h+=`<tr class="${cls}"><td>${r.month}</td><td>${r.start}</td>`;
      h+=`<td class="${r.newHires>0?'pos':''}">${r.newHires>0?'+'+r.newHires:r.newHires}</td>`;
      h+=`<td class="${r.attrition<0?'neg':''}">${r.attrition}</td><td>${r.ending}</td></tr>`;
    });
    return h+'</tbody></table>';
  }

  const pigmentCSV = ['Actual Month,Cost Center,Cost Center - ID,Worker Type,Employee Type Contingent Type,Time Type,Country,# of Employees',
    ...pigmentRows.map(r=>`"${calcMonthLabel}","${r.cc}","${r.ccid}","${r.wt}","${r.st}","${r.tt}","${r.country}",${r.count}`)
  ].join('\n');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Active Global Headcount Report — ${reportLabel}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#F7F8FA;--surface:#FFFFFF;--surface2:#F0F2F5;--border:#E2E6EC;--border2:#C8CDD6;--accent:#C4623A;--accent-lt:#E07A50;--accent-bg:rgba(196,98,58,.08);--text:#1A1F2E;--muted:#6B7385;--muted2:#A0A8B8;--emp:#1E7A4E;--con:#C4623A;--ft:#2563A8;--pt:#C49A2A;--radius:4px;--font-display:'Cormorant Garamond',Georgia,serif;--font-body:'Inter',-apple-system,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:13px;line-height:1.5;}
.header{background:var(--surface);border-bottom:1px solid var(--border);border-top:3px solid var(--accent);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.header-left{display:flex;align-items:center;gap:12px;}
.header-logo{width:32px;height:32px;border:2px solid var(--accent);border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;color:var(--accent);}
.header-title{font-size:16px;font-weight:600;font-family:var(--font-display);color:var(--text);}
.header-sub{font-size:11px;color:var(--muted);margin-top:1px;}
.header-badge{background:var(--accent-bg);border:1px solid var(--accent);border-radius:2px;padding:4px 12px;font-size:11px;color:var(--accent-lt);font-weight:500;letter-spacing:.04em;text-transform:uppercase;}
.tab-bar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;display:flex;}
.tab{padding:10px 18px;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;user-select:none;}
.tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600;}
.tab-count{display:inline-block;background:var(--surface2);border-radius:10px;padding:1px 6px;font-size:10px;margin-left:5px;color:var(--muted);}
.tab.active .tab-count{background:var(--accent-bg);color:var(--accent);}
.tab-content{display:none;}.tab-content.active{display:block;}
.main{padding:20px 24px;}
.kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;border-left:3px solid var(--border2);}
.kpi-label{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.kpi-value{font-size:28px;font-weight:700;line-height:1;font-family:var(--font-mono);}
.kpi-value.total{color:var(--text);}.kpi-value.emp{color:var(--emp);}.kpi-value.con{color:var(--con);}.kpi-value.ft{color:var(--ft);}.kpi-value.pt{color:var(--pt);}
.kpi-sub{font-size:10px;color:var(--muted);margin-top:4px;}
.movement-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;}
.summary-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
.summary-card-header{padding:10px 16px;border-bottom:1px solid var(--border);font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
.mv-table-scroll{max-height:310px;overflow-y:auto;}
.mv-table{width:100%;border-collapse:collapse;}
.mv-table th{padding:6px 10px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--surface2);border-bottom:1px solid var(--border);text-align:right;position:sticky;top:0;z-index:2;}
.mv-table th:first-child{text-align:left;}
.mv-table td{padding:6px 10px;font-size:12px;border-bottom:1px solid var(--border);font-family:var(--font-mono);text-align:right;color:var(--text);}
.mv-table td:first-child{text-align:left;font-family:inherit;font-weight:500;}
.mv-table tr.calc-month td{background:rgba(30,122,78,.07);}
.mv-table tr.calc-month td:first-child{color:var(--emp);font-weight:600;}
.mv-table tr.report-month td{background:var(--accent-bg);}
.mv-table tr.report-month td:first-child{color:var(--accent);font-weight:600;}
.mv-table td.pos{color:var(--emp);}.mv-table td.neg{color:var(--con);}.mv-table td.empty{color:var(--muted);}
.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.summary-card table{width:100%;border-collapse:collapse;}
.summary-card th{padding:6px 12px;text-align:right;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--surface2);border-bottom:1px solid var(--border);}
.summary-card th:first-child{text-align:left;}
.summary-card td{padding:7px 12px;text-align:right;border-bottom:1px solid var(--border);font-size:12px;color:var(--text);font-family:var(--font-mono);}
.summary-card td:first-child{text-align:left;font-family:inherit;}
.summary-card tr:last-child td{border-bottom:none;}
.summary-card tr:hover td{background:var(--surface2);}
.mini-bar-wrap{display:flex;align-items:center;gap:8px;}
.mini-bar-bg{flex:1;height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;}
.mini-bar{height:100%;background:var(--accent);border-radius:3px;}
.mini-bar-num{font-size:10px;color:var(--muted);min-width:28px;text-align:right;}
.bar-cell{min-width:130px;}
.table-toolbar{display:flex;align-items:center;gap:10px;padding:14px 0 10px;flex-wrap:wrap;}
.search-wrap{position:relative;flex:1;min-width:180px;}
.search-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted2);}
.search-input{width:100%;padding:7px 10px 7px 32px;border:1px solid var(--border);border-radius:var(--radius);font-size:12px;background:var(--surface);color:var(--text);outline:none;}
.search-input:focus{border-color:var(--accent);}
.export-table-btn{padding:6px 12px;font-size:12px;font-weight:500;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--muted);cursor:pointer;white-space:nowrap;}
.export-table-btn:hover{border-color:var(--accent);color:var(--accent);}
.row-count{font-size:11px;color:var(--muted2);white-space:nowrap;}
.pinned-bar{display:none;align-items:center;gap:10px;padding:6px 14px;background:var(--accent-bg);border:1px solid var(--accent);border-radius:var(--radius);margin-bottom:8px;font-size:12px;color:var(--accent);}
.pinned-bar.visible{display:flex;}
.pinned-bar button{padding:3px 8px;font-size:11px;background:var(--accent);border:none;border-radius:2px;color:#fff;cursor:pointer;}
.table-scroll{overflow-x:auto;}
.data-table{width:100%;border-collapse:collapse;font-size:11.5px;}
.data-table th{padding:5px 8px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);white-space:nowrap;position:sticky;top:0;z-index:2;cursor:pointer;}
.data-table td{padding:5px 8px;border-bottom:1px solid var(--border);white-space:nowrap;vertical-align:middle;}
.data-table tr:hover td{background:var(--surface2);}
.data-table tr.pinned td{background:rgba(196,98,58,.06);}
.pill{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600;}
.pill-emp{background:#e3f5ec;color:var(--emp);}.pill-con{background:var(--accent-bg);color:var(--accent);}.pill-ft{background:#e6f1fb;color:var(--ft);}.pill-pt{background:rgba(196,154,42,.12);color:var(--pt);}.pill-yes{background:#e3f5ec;color:var(--emp);}.pill-no{background:#fef0ec;color:var(--con);}
.num{font-family:var(--font-mono);}
.cc-dropdown{position:relative;}
.cc-btn{display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:12px;color:var(--muted);cursor:pointer;white-space:nowrap;}
.cc-btn:hover,.cc-btn.open{border-color:var(--accent);color:var(--accent);}
.cc-panel{display:none;position:absolute;top:calc(100%+4px);left:0;z-index:50;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 4px 16px rgba(0,0,0,.1);width:280px;}
.cc-panel.open{display:block;}
.cc-search{width:100%;padding:8px 10px;border:none;border-bottom:1px solid var(--border);font-size:12px;outline:none;background:var(--surface2);}
.cc-list{max-height:200px;overflow-y:auto;}
.cc-item{display:flex;align-items:center;gap:8px;padding:6px 10px;font-size:12px;cursor:pointer;}
.cc-item:hover{background:var(--surface2);}
.cc-footer{display:flex;justify-content:flex-end;gap:8px;padding:8px 10px;border-top:1px solid var(--border);}
.cc-footer button{padding:4px 10px;font-size:11px;border-radius:2px;cursor:pointer;border:1px solid var(--border);background:var(--surface);}
.cc-footer button.cc-apply{background:var(--accent);color:#fff;border-color:var(--accent);}
.cc-badge{display:inline-block;background:var(--accent);color:#fff;border-radius:10px;padding:0 6px;font-size:10px;font-weight:600;margin-right:4px;}
.pigment-toolbar{display:flex;align-items:center;gap:10px;padding:14px 0 10px;}
.pigment-btn{padding:7px 14px;font-size:12px;font-weight:600;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;}
.pigment-table{width:100%;border-collapse:collapse;font-size:12px;}
.pigment-table th{padding:6px 10px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-align:left;}
.pigment-table td{padding:6px 10px;border-bottom:1px solid var(--border);color:var(--text);}
.pigment-table tr:hover td{background:var(--surface2);}
.table-wrap{overflow-x:auto;}
</style></head>
<body>
<div class="header">
  <div class="header-left">
    <div class="header-logo">HC</div>
    <div>
      <div class="header-title">Active Global Headcount Report</div>
      <div class="header-sub">Effective ${calcLabel} · Report month ${reportLabel}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <button onclick="downloadReport()" style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:5px 14px;border-radius:6px;border:1.5px solid var(--accent);background:#fff;color:var(--accent);cursor:pointer;white-space:nowrap;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download HTML
    </button>
    <div class="header-badge">Generated · ${reportLabel}</div>
  </div>
</div>
<div class="tab-bar">
  <div class="tab active" onclick="showTab('summary',this)">Summary</div>
  <div class="tab" onclick="showTab('raw',this)">Raw Data <span class="tab-count" id="tc-raw">${allData.length}</span></div>
  <div class="tab" onclick="showTab('fte',this)">FTEs <span class="tab-count" id="tc-fte">${empData.length}</span></div>
  <div class="tab" onclick="showTab('con',this)">Contingent + Intern <span class="tab-count" id="tc-con">${conData.length}</span></div>
  <div class="tab" onclick="showTab('pigment',this)">Pigment HC Load <span class="tab-count">${pigmentRows.length}</span></div>
</div>
<div class="tab-content active" id="tab-summary"><div class="main">
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">Total Active</div><div class="kpi-value total">${kpis.total}</div><div class="kpi-sub">as of ${calcLabel}</div></div>
    <div class="kpi-card"><div class="kpi-label">FTEs</div><div class="kpi-value emp">${kpis.fte}</div><div class="kpi-sub">Employees — Regular</div></div>
    <div class="kpi-card"><div class="kpi-label">Contingent + Intern</div><div class="kpi-value con">${kpis.con}</div><div class="kpi-sub">All non-FTE workers</div></div>
    <div class="kpi-card"><div class="kpi-label">Full Time</div><div class="kpi-value ft">${kpis.ft}</div><div class="kpi-sub">Full time workers</div></div>
    <div class="kpi-card"><div class="kpi-label">Part Time</div><div class="kpi-value pt">${kpis.pt}</div><div class="kpi-sub">Part time workers</div></div>
  </div>
  <div class="movement-grid">
    <div class="summary-card"><div class="summary-card-header">FTE Movement</div><div class="mv-table-scroll">${mvTable(histFte)}</div></div>
    <div class="summary-card"><div class="summary-card-header">Contingent + Intern Movement</div><div class="mv-table-scroll">${mvTable(histCon)}</div></div>
    <div class="summary-card"><div class="summary-card-header">Costa Rica Movement</div><div class="mv-table-scroll">${mvTable(histCr)}</div></div>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-card-header">By Organization</div><div id="org-table"></div></div>
    <div class="summary-card"><div class="summary-card-header">By Country</div><div id="country-table"></div></div>
  </div>
  <div class="summary-card" style="margin-bottom:20px;"><div class="summary-card-header">By Worker Type &amp; Subtype</div><div id="subtype-table"></div></div>
</div></div>
<div class="tab-content" id="tab-raw"><div class="main">
  <div class="table-toolbar">
    <div class="search-wrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="search-raw" placeholder="Search name, title, email…" oninput="filterTable('raw')"/></div>
    <div class="cc-dropdown"><div class="cc-btn" id="cc-btn-raw" onclick="toggleCCDropdown('raw')"><span class="cc-label" id="cc-label-raw">All Cost Centers</span><svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="cc-panel" id="cc-panel-raw"><input class="cc-search" id="cc-search-raw" placeholder="Search…" oninput="filterCCList('raw')"/><div class="cc-list" id="cc-list-raw"></div><div class="cc-footer"><button onclick="clearCCFilter('raw')">Clear</button><button class="cc-apply" onclick="applyCCFilter('raw')">Apply</button></div></div></div>
    <button class="export-table-btn" onclick="exportTableCSV('raw')">⬇ Export to Excel</button>
    <span class="row-count" id="rc-raw"></span>
  </div>
  <div class="pinned-bar" id="pinned-bar-raw"><span id="pinned-count-raw">0 rows pinned</span><button onclick="clearPinned('raw')">Clear All</button></div>
  <div class="table-wrap"><div class="table-scroll"><table class="data-table" id="table-raw"></table></div></div>
</div></div>
<div class="tab-content" id="tab-fte"><div class="main">
  <div class="table-toolbar">
    <div class="search-wrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="search-fte" placeholder="Search name, title, email…" oninput="filterTable('fte')"/></div>
    <div class="cc-dropdown"><div class="cc-btn" id="cc-btn-fte" onclick="toggleCCDropdown('fte')"><span class="cc-label" id="cc-label-fte">All Cost Centers</span><svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="cc-panel" id="cc-panel-fte"><input class="cc-search" id="cc-search-fte" placeholder="Search…" oninput="filterCCList('fte')"/><div class="cc-list" id="cc-list-fte"></div><div class="cc-footer"><button onclick="clearCCFilter('fte')">Clear</button><button class="cc-apply" onclick="applyCCFilter('fte')">Apply</button></div></div></div>
    <button class="export-table-btn" onclick="exportTableCSV('fte')">⬇ Export to Excel</button>
    <span class="row-count" id="rc-fte"></span>
  </div>
  <div class="pinned-bar" id="pinned-bar-fte"><span id="pinned-count-fte">0 rows pinned</span><button onclick="clearPinned('fte')">Clear All</button></div>
  <div class="table-wrap"><div class="table-scroll"><table class="data-table" id="table-fte"></table></div></div>
</div></div>
<div class="tab-content" id="tab-con"><div class="main">
  <div class="table-toolbar">
    <div class="search-wrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" id="search-con" placeholder="Search name, title, email…" oninput="filterTable('con')"/></div>
    <div class="cc-dropdown"><div class="cc-btn" id="cc-btn-con" onclick="toggleCCDropdown('con')"><span class="cc-label" id="cc-label-con">All Cost Centers</span><svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="cc-panel" id="cc-panel-con"><input class="cc-search" id="cc-search-con" placeholder="Search…" oninput="filterCCList('con')"/><div class="cc-list" id="cc-list-con"></div><div class="cc-footer"><button onclick="clearCCFilter('con')">Clear</button><button class="cc-apply" onclick="applyCCFilter('con')">Apply</button></div></div></div>
    <button class="export-table-btn" onclick="exportTableCSV('con')">⬇ Export to Excel</button>
    <span class="row-count" id="rc-con"></span>
  </div>
  <div class="pinned-bar" id="pinned-bar-con"><span id="pinned-count-con">0 rows pinned</span><button onclick="clearPinned('con')">Clear All</button></div>
  <div class="table-wrap"><div class="table-scroll"><table class="data-table" id="table-con"></table></div></div>
</div></div>
<div class="tab-content" id="tab-pigment"><div class="main">
  <div class="pigment-toolbar">
    <button class="pigment-btn" onclick="exportPigment()">⬇ Export as CSV for Pigment</button>
    <span class="row-count">${pigmentRows.length} rows · Actual Month: ${calcMonthLabel}</span>
  </div>
  <div class="table-wrap">
    <table class="pigment-table">
      <thead><tr><th>Actual Month</th><th>Cost Center</th><th>Cost Center ID</th><th>Worker Type</th><th>Employee Type / Contingent Type</th><th>Time Type</th><th>Country</th><th># of Employees</th></tr></thead>
      <tbody>${pigmentRows.map(r=>`<tr><td>${calcMonthLabel}</td><td>${escH(r.cc)}</td><td>${escH(r.ccid)}</td><td>${escH(r.wt)}</td><td>${escH(r.st)}</td><td>${escH(r.tt)}</td><td>${escH(r.country)}</td><td style="font-family:var(--font-mono);font-weight:600;">${r.count}</td></tr>`).join('')}</tbody>
    </table>
  </div>
</div></div>
<script>
const ALL_DATA=${JSON.stringify(allData)};
const EMP_DATA=${JSON.stringify(empData)};
const CON_DATA=${JSON.stringify(conData)};
const PIGMENT_CSV=${JSON.stringify(pigmentCSV)};
const CALC_LABEL='${calcLabel}';
const state={raw:{data:ALL_DATA,filtered:ALL_DATA.slice(),sortCol:null,sortDir:1},fte:{data:EMP_DATA,filtered:EMP_DATA.slice(),sortCol:null,sortDir:1},con:{data:CON_DATA,filtered:CON_DATA.slice(),sortCol:null,sortDir:1}};
const pinnedRows={raw:{},fte:{},con:{}};
const ccSelected={raw:{},fte:{},con:{}};
const ccAllOptions={raw:[],fte:[],con:[]};

function showTab(id,btn){ document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.getElementById('tab-'+id).classList.add('active'); btn.classList.add('active'); }
function workerPill(v){ return v==='Employee'?'<span class="pill pill-emp">'+v+'</span>':'<span class="pill pill-con">'+v+'</span>'; }
function timetypePill(v){ return v==='Full time'?'<span class="pill pill-ft">'+v+'</span>':'<span class="pill pill-pt">'+v+'</span>'; }
function yesnoPill(v){ return v==='Yes'?'<span class="pill pill-yes">Yes</span>':'<span class="pill pill-no">No</span>'; }
function cellVal(col,val){ if(val===null||val===undefined||val==='') return '<span style="color:var(--muted)">—</span>'; if(col==='Worker Type') return workerPill(val); if(col==='Time Type') return timetypePill(val); if(col==='FLSA Exempt?'||col==='People Manager') return yesnoPill(val); if(col==='EE ID'||col==='Cost Center - ID') return '<span class="num">'+String(val)+'</span>'; if(typeof val==='number') return '<span class="num">'+(Number.isInteger(val)?val.toLocaleString():val.toFixed(2))+'</span>'; return String(val); }
function ccLabel(r){ const id=r['Cost Center - ID']!=null?String(r['Cost Center - ID']):''; const nm=r['Cost Center']||''; return id&&nm?id+' - '+nm:(id||nm); }

function renderTable(key){
  const s=state[key]; const filtered=s.filtered;
  const rcEl=document.getElementById('rc-'+key); if(rcEl) rcEl.textContent=filtered.length+' workers';
  const tcEl=document.getElementById('tc-'+key); if(tcEl) tcEl.textContent=filtered.length;
  const tbl=document.getElementById('table-'+key); if(!tbl) return;
  if(!filtered.length){ tbl.innerHTML='<tr><td colspan="100" style="padding:20px;text-align:center;color:var(--muted);">No results</td></tr>'; return; }
  const cols=Object.keys(filtered[0]).filter(h=>!h.startsWith('_'));
  let h='<thead><tr><th style="width:28px"></th>';
  cols.forEach(c=>{ h+=\`<th onclick="sortTable('\${key}','\${c.replace(/'/g,"\\\\'")}')">\${c}</th>\`; });
  h+='</tr></thead><tbody>';
  filtered.forEach(r=>{ const eid=String(r['EE ID']||''); const isPinned=!!pinnedRows[key][eid]; h+=\`<tr class="\${isPinned?'pinned':''}" ><td><input type="checkbox" \${isPinned?'checked':''} onchange="togglePin('\${key}','\${eid}',this)"></td>\`; cols.forEach(c=>{ h+=\`<td>\${cellVal(c,r[c])}</td>\`; }); h+='</tr>'; });
  tbl.innerHTML=h+'</tbody>';
}

function filterTable(key){ const s=state[key]; const search=document.getElementById('search-'+key).value.toLowerCase(); const pinned=pinnedRows[key]; const selCC=ccSelected[key]; const hasCC=Object.keys(selCC).length>0; s.filtered=s.data.filter(r=>{ const isPinned=pinned[String(r['EE ID']||'')]; if(isPinned) return true; if(hasCC&&!selCC[ccLabel(r)]) return false; if(search){ const hay=[r.Name,r['Business Title'],r['Cost Center'],r['Country'],r['Email - Primary Work'],String(r['EE ID']||'')].join(' ').toLowerCase(); if(!hay.includes(search)) return false; } return true; }); renderTable(key); }
function sortTable(key,col){ const s=state[key]; s.sortDir=s.sortCol===col?-s.sortDir:1; s.sortCol=col; s.filtered.sort((a,b)=>{ const av=a[col]||'',bv=b[col]||''; if(typeof av==='number'&&typeof bv==='number') return (av-bv)*s.sortDir; return String(av).localeCompare(String(bv))*s.sortDir; }); renderTable(key); }
function togglePin(key,eid,cb){ if(cb.checked) pinnedRows[key][eid]=true; else delete pinnedRows[key][eid]; updatePinnedBar(key); filterTable(key); }
function updatePinnedBar(key){ const n=Object.keys(pinnedRows[key]).length; const bar=document.getElementById('pinned-bar-'+key); document.getElementById('pinned-count-'+key).textContent=n+(n===1?' row pinned':' rows pinned')+' — showing alongside search results'; n>0?bar.classList.add('visible'):bar.classList.remove('visible'); }
function clearPinned(key){ pinnedRows[key]={}; updatePinnedBar(key); filterTable(key); }
function populateFilters(key,data){ const seen={}; data.forEach(r=>{ const l=ccLabel(r); if(l&&!seen[l]){seen[l]=1;ccAllOptions[key].push(l);} }); ccAllOptions[key].sort(); renderCCList(key,''); }
function renderCCList(key,search){ const list=document.getElementById('cc-list-'+key); const opts=ccAllOptions[key].filter(o=>!search||o.toLowerCase().includes(search.toLowerCase())); list.innerHTML=''; opts.forEach(o=>{ const item=document.createElement('div'); item.className='cc-item'; const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!ccSelected[key][o]; cb.setAttribute('data-val',o); cb.onchange=function(){ this.checked?ccSelected[key][this.getAttribute('data-val')]=true:delete ccSelected[key][this.getAttribute('data-val')]; updateCCBtn(key); }; const lbl=document.createElement('span'); lbl.textContent=o; item.appendChild(cb); item.appendChild(lbl); item.onclick=function(e){ if(e.target!==cb){cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'));} }; list.appendChild(item); }); }
function filterCCList(key){ renderCCList(key,document.getElementById('cc-search-'+key).value); }
function toggleCCDropdown(key){ const p=document.getElementById('cc-panel-'+key); const b=document.getElementById('cc-btn-'+key); const isOpen=p.classList.contains('open'); document.querySelectorAll('.cc-panel.open').forEach(x=>x.classList.remove('open')); document.querySelectorAll('.cc-btn.open').forEach(x=>x.classList.remove('open')); if(!isOpen){p.classList.add('open');b.classList.add('open');document.getElementById('cc-search-'+key).focus();} }
document.addEventListener('click',function(e){ if(!e.target.closest('.cc-dropdown')){ document.querySelectorAll('.cc-panel.open').forEach(x=>x.classList.remove('open')); document.querySelectorAll('.cc-btn.open').forEach(x=>x.classList.remove('open')); } });
function updateCCBtn(key){ const n=Object.keys(ccSelected[key]).length; const lbl=document.getElementById('cc-label-'+key); const btn=document.getElementById('cc-btn-'+key); if(n===0){lbl.textContent='All Cost Centers';btn.querySelector('.cc-badge')&&btn.querySelector('.cc-badge').remove();}else{lbl.textContent=n===1?Object.keys(ccSelected[key])[0]:n+' selected';if(!btn.querySelector('.cc-badge')){const b=document.createElement('span');b.className='cc-badge';btn.insertBefore(b,btn.querySelector('svg'));}btn.querySelector('.cc-badge').textContent=n;} }
function clearCCFilter(key){ ccSelected[key]={}; renderCCList(key,''); updateCCBtn(key); filterTable(key); }
function applyCCFilter(key){ toggleCCDropdown(key); filterTable(key); }
function exportTableCSV(key){ const s=state[key]; if(!s.filtered.length) return; const cols=Object.keys(s.filtered[0]).filter(h=>!h.startsWith('_')); const csv=[cols.join(','),...s.filtered.map(r=>cols.map(c=>{ const v=r[c]||''; return '"'+String(v).replace(/"/g,'""')+'"'; }).join(','))].join('\\n'); const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='AGHR_'+key.toUpperCase()+'_'+CALC_LABEL.replace('-','')+'.csv'; a.click(); }
function exportPigment(){ const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(PIGMENT_CSV); a.download='PigmentHCLoad_'+CALC_LABEL.replace('-','')+'.csv'; a.click(); }
function downloadReport(){ const html='<!DOCTYPE html>'+document.documentElement.outerHTML; const a=document.createElement('a'); a.href='data:text/html;charset=utf-8,'+encodeURIComponent(html); a.download='AGHR_${reportLabel.replace('-','')}.html'; a.click(); }

var maxOrg=Math.max(1,...${JSON.stringify(byOrg)}.map(function(r){return r.Total;}));
document.getElementById('org-table').innerHTML='<table><thead><tr><th>Organization</th><th>Total</th><th style="color:var(--emp)">FTEs</th><th style="color:var(--con)">Con</th><th style="min-width:120px">Distribution</th></tr></thead><tbody>'+${JSON.stringify(byOrg)}.map(function(r){var pct=Math.round(r.Total/maxOrg*100);var pctT=Math.round(r.Total/${kpis.total||1}*100);return '<tr><td>'+r['KLT Level Org']+'</td><td>'+r.Total+'</td><td style="color:var(--emp)">'+r.FTEs+'</td><td style="color:var(--con)">'+r.Contingent+'</td><td class="bar-cell"><div class="mini-bar-wrap"><div class="mini-bar-bg"><div class="mini-bar" style="width:'+pct+'%"></div></div><span class="mini-bar-num">'+pctT+'%</span></div></td></tr>';}).join('')+'</tbody></table>';
var maxCtry=Math.max(1,...${JSON.stringify(byCountry)}.map(function(r){return r.Total;}));
document.getElementById('country-table').innerHTML='<table><thead><tr><th>Country</th><th>Total</th><th style="color:var(--emp)">FTEs</th><th style="color:var(--con)">Con</th><th style="min-width:120px">Distribution</th></tr></thead><tbody>'+${JSON.stringify(byCountry)}.filter(function(r){return r.Country&&r.Country!=='Unknown';}).map(function(r){var pct=Math.round(r.Total/maxCtry*100);var pctT=Math.round(r.Total/${kpis.total||1}*100);return '<tr><td>'+r.Country+'</td><td>'+r.Total+'</td><td style="color:var(--emp)">'+r.FTEs+'</td><td style="color:var(--con)">'+r.Contingent+'</td><td class="bar-cell"><div class="mini-bar-wrap"><div class="mini-bar-bg"><div class="mini-bar" style="width:'+pct+'%"></div></div><span class="mini-bar-num">'+pctT+'%</span></div></td></tr>';}).join('')+'</tbody></table>';
document.getElementById('subtype-table').innerHTML='<table><thead><tr><th>Worker Type</th><th>Subtype</th><th>Count</th></tr></thead><tbody>'+${JSON.stringify(bySubtype)}.map(function(r){return '<tr><td>'+workerPill(r['Worker Type'])+'</td><td>'+r['Employee Type, Contingent Type']+'</td><td><span class="num">'+r.Count+'</span></td></tr>';}).join('')+'</tbody></table>';

['raw','fte','con'].forEach(function(key){ populateFilters(key,state[key].data); renderTable(key); });
<\/script></body></html>`;
}

(function(){
  const el = document.getElementById('last-updated');
  if(el) el.textContent = new Date().toLocaleString();
})();
