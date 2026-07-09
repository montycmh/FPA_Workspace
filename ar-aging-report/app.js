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
