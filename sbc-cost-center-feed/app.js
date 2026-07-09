function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
const SBC_STORAGE_KEY = 'sbc_mapping_v2';
const SBC_DEFAULT_MAPPING = (() => {
const SBC_MAPPING = {"000700 - MAVENS PATIENT PRACTICE": {"id": 3540, "name": "Mavens - Operations"}, "100 - ENGINEERING": {"id": 1941, "name": "Engineering"}, "100 - MAVENS MEDICAL PRACTICE": {"id": 3540, "name": "Mavens - Operations"}, "1100 - ENG & PROD LEADERSHIP": {"id": 1001, "name": "Office of CTO"}, "1200 - GENERAL MANAGEMENT": {"id": 1001, "name": "Office of CTO"}, "1300 - DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1300 DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1400 - DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "1400 DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "1500 - FULL STACK": {"id": 1600, "name": "Infrastructure"}, "1600 - INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "1600 INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "1700 - PROGRAM MANAGEMENT": {"id": 1941, "name": "Engineering"}, "1800 - QUALITY ASSURANCE": {"id": 1941, "name": "Engineering"}, "1900 - SECURITY": {"id": 1900, "name": "Security"}, "1900 SECURITY": {"id": 1900, "name": "Security"}, "1940 - PRODUCT MANAGEMENT": {"id": 1943, "name": "Product"}, "1941 SOFTWARE ENGINEERING": {"id": 1941, "name": "Engineering"}, "1942 QA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1943 PRODUCT": {"id": 1943, "name": "Product"}, "1944 PRODUCT/ENGINEERING MANAGEMENT": {"id": 1943, "name": "Product"}, "1945 PROD/ENG OPERATIONS": {"id": 1943, "name": "Product"}, "1980 - PRODUCT DESIGN": {"id": 1943, "name": "Product"}, "2100 - DATA OPERATIONS": {"id": 2200, "name": "Data Products"}, "2200 - DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "2200 DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "2300 - DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "2300 DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "2400 - DATA & CLINICAL INSIGHTS": {"id": 2400, "name": "BAP Researchers"}, "2400 RESEARCH & ANALYTICS": {"id": 2400, "name": "BAP Researchers"}, "3200 - PRODUCT MARKETING": {"id": 3100, "name": "Marketing"}, "3200 SEGMENT MARKETING": {"id": 3100, "name": "Marketing"}, "3400 - COMMUNICATIONS": {"id": 3100, "name": "Marketing"}, "3400 BRAND MARKETING": {"id": 3100, "name": "Marketing"}, "4100 LT": {"id": 4001, "name": "Function Chief - Commercial"}, "4200 - LSS SALES": {"id": 4510, "name": "Sales"}, "4200 LSS SALES": {"id": 4510, "name": "Sales"}, "4300 - HCS SALES": {"id": 4510, "name": "Sales"}, "4400 - MSI": {"id": 4510, "name": "Sales"}, "4400 MSI": {"id": 4510, "name": "Sales"}, "4500 - CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "4500 CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "4600 - COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "4600 COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "4700 - ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "4700 ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "4710 - TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "4710 TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "4720 - CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4720 CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4730 - SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4730 PROFESSIONAL SERVICES": {"id": 3560, "name": "Mavens - Consulting"}, "4740 BAP RESEARCHER": {"id": 2400, "name": "BAP Researchers"}, "5100 - ACCOUNTING": {"id": 5100, "name": "Accounting"}, "5100 ACCOUNTING": {"id": 5100, "name": "Accounting"}, "5200 - FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "5200 FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "5300 - CORPORATE DEVELOPMENT": {"id": 5200, "name": "Financial Planning & Analysis"}, "5300 CORPORATE DEVELOPMENT": {"id": 5200, "name": "Financial Planning & Analysis"}, "6100 - TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "6100 TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "6200 - EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "6200 EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "6300 - PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "6300 PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "7100 - COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "7100 COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "7200 - COMPLIANCE": {"id": 7200, "name": "Compliance"}, "7200 COMPLIANCE": {"id": 7200, "name": "Compliance"}, "8100 - EXECUTIVE LEADERSHIP": {"id": 8200, "name": "Executive Operations"}, "8200 - EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "8200 EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "9300 - INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "9300 INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "ACCOUNTING": {"id": 5100, "name": "Accounting"}, "ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "BAP RESEARCHERS": {"id": 2400, "name": "BAP Researchers"}, "CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "COMPLIANCE": {"id": 7200, "name": "Compliance"}, "Cost center not added": {"id": 8200, "name": "Executive Operations"}, "CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "DATA PRODUCT": {"id": 2200, "name": "Data Products"}, "DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "MSI": {"id": 4510, "name": "Sales"}, "PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "PROD/ENG OPERATIONS": {"id": 1943, "name": "Product"}, "PRODUCT": {"id": 1943, "name": "Product"}, "PRODUCT/ENG MGMT": {"id": 1943, "name": "Product"}, "PROFESSIONAL SERVICES": {"id": 3560, "name": "Mavens - Consulting"}, "QUALITY ASSURANCE": {"id": 1941, "name": "Engineering"}, "RESEARCH AND ANALYTICS": {"id": 2400, "name": "BAP Researchers"}, "SALES": {"id": 4510, "name": "Sales"}, "SECURITY": {"id": 1900, "name": "Security"}, "SEGMENT MARKETING": {"id": 3100, "name": "Marketing"}, "SOFTWARE ENGINEERING": {"id": 1941, "name": "Engineering"}, "TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "TECHNICAL SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "ENGINEERING": {"id": 1941, "name": "Engineering"}, "OFFICE OF CTO": {"id": 1001, "name": "Office of CTO"}, "MAVENS - OPERATIONS": {"id": 3540, "name": "Mavens - Operations"}, "FUNCTION CHIEF- COMMERCIAL": {"id": 4001, "name": "Function Chief - Commercial"}, "MAVENS - DELIVERY": {"id": 3560, "name": "Mavens - Consulting"}, "MARKETING": {"id": 3100, "name": "Marketing"}, "PEOPLE OPERATIONS": {"id": 6300, "name": "People"}, "GTM OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "LEGAL": {"id": 7100, "name": "Legal"}, "RETENTION": {"id": 4170, "name": "Retention"}, "ANALYTICS SERVICES": {"id": 4190, "name": "Analytics Services"}, "FAST": {"id": 4180, "name": "FAST"}, "FINANCIAL PLANNING & ANALYSIS": {"id": 5200, "name": "Financial Planning & Analysis"}, "MAVENS - ENGINEERING": {"id": 3510, "name": "Mavens - Engineering"}, "MAVENS - SALES": {"id": 3530, "name": "Mavens - Sales"}, "SALES ENGINEERING": {"id": 4120, "name": "Sales Engineering"}, "MAVENS - SOLUTIONS LEADS": {"id": 3570, "name": "Mavens - Solutions Leads"}, "OFFICE & EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "SALES DEVELOPMENT": {"id": 3200, "name": "Sales Development"}};
let sbcSlots = new Array(8).fill(null); // each: {file, meta, raw, total, agg, missing, error}
  return JSON.parse(JSON.stringify(SBC_MAPPING));
})();

const SBC_MAPPING = {"000700 - MAVENS PATIENT PRACTICE": {"id": 3540, "name": "Mavens - Operations"}, "100 - ENGINEERING": {"id": 1941, "name": "Engineering"}, "100 - MAVENS MEDICAL PRACTICE": {"id": 3540, "name": "Mavens - Operations"}, "1100 - ENG & PROD LEADERSHIP": {"id": 1001, "name": "Office of CTO"}, "1200 - GENERAL MANAGEMENT": {"id": 1001, "name": "Office of CTO"}, "1300 - DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1300 DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1400 - DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "1400 DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "1500 - FULL STACK": {"id": 1600, "name": "Infrastructure"}, "1600 - INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "1600 INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "1700 - PROGRAM MANAGEMENT": {"id": 1941, "name": "Engineering"}, "1800 - QUALITY ASSURANCE": {"id": 1941, "name": "Engineering"}, "1900 - SECURITY": {"id": 1900, "name": "Security"}, "1900 SECURITY": {"id": 1900, "name": "Security"}, "1940 - PRODUCT MANAGEMENT": {"id": 1943, "name": "Product"}, "1941 SOFTWARE ENGINEERING": {"id": 1941, "name": "Engineering"}, "1942 QA ENGINEERING": {"id": 1941, "name": "Engineering"}, "1943 PRODUCT": {"id": 1943, "name": "Product"}, "1944 PRODUCT/ENGINEERING MANAGEMENT": {"id": 1943, "name": "Product"}, "1945 PROD/ENG OPERATIONS": {"id": 1943, "name": "Product"}, "1980 - PRODUCT DESIGN": {"id": 1943, "name": "Product"}, "2100 - DATA OPERATIONS": {"id": 2200, "name": "Data Products"}, "2200 - DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "2200 DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "2300 - DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "2300 DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "2400 - DATA & CLINICAL INSIGHTS": {"id": 2400, "name": "BAP Researchers"}, "2400 RESEARCH & ANALYTICS": {"id": 2400, "name": "BAP Researchers"}, "3200 - PRODUCT MARKETING": {"id": 3100, "name": "Marketing"}, "3200 SEGMENT MARKETING": {"id": 3100, "name": "Marketing"}, "3400 - COMMUNICATIONS": {"id": 3100, "name": "Marketing"}, "3400 BRAND MARKETING": {"id": 3100, "name": "Marketing"}, "4100 LT": {"id": 4001, "name": "Function Chief - Commercial"}, "4200 - LSS SALES": {"id": 4510, "name": "Sales"}, "4200 LSS SALES": {"id": 4510, "name": "Sales"}, "4300 - HCS SALES": {"id": 4510, "name": "Sales"}, "4400 - MSI": {"id": 4510, "name": "Sales"}, "4400 MSI": {"id": 4510, "name": "Sales"}, "4500 - CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "4500 CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "4600 - COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "4600 COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "4700 - ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "4700 ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "4710 - TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "4710 TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "4720 - CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4720 CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4730 - SERVICES": {"id": 4110, "name": "Technical Solutions"}, "4730 PROFESSIONAL SERVICES": {"id": 3560, "name": "Mavens - Consulting"}, "4740 BAP RESEARCHER": {"id": 2400, "name": "BAP Researchers"}, "5100 - ACCOUNTING": {"id": 5100, "name": "Accounting"}, "5100 ACCOUNTING": {"id": 5100, "name": "Accounting"}, "5200 - FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "5200 FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "5300 - CORPORATE DEVELOPMENT": {"id": 5200, "name": "Financial Planning & Analysis"}, "5300 CORPORATE DEVELOPMENT": {"id": 5200, "name": "Financial Planning & Analysis"}, "6100 - TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "6100 TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "6200 - EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "6200 EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "6300 - PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "6300 PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "7100 - COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "7100 COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "7200 - COMPLIANCE": {"id": 7200, "name": "Compliance"}, "7200 COMPLIANCE": {"id": 7200, "name": "Compliance"}, "8100 - EXECUTIVE LEADERSHIP": {"id": 8200, "name": "Executive Operations"}, "8200 - EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "8200 EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "9300 - INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "9300 INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "ACCOUNTING": {"id": 5100, "name": "Accounting"}, "ANALYTICS CONSULTING": {"id": 4190, "name": "Analytics Services"}, "BAP RESEARCHERS": {"id": 2400, "name": "BAP Researchers"}, "CLIENT SERVICES": {"id": 4110, "name": "Technical Solutions"}, "COMMERCIAL LEGAL": {"id": 7100, "name": "Legal"}, "COMMERCIAL STRATEGY & REVENUE OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "COMPLIANCE": {"id": 7200, "name": "Compliance"}, "Cost center not added": {"id": 8200, "name": "Executive Operations"}, "CUSTOMER SUCCESS": {"id": 4170, "name": "Retention"}, "DATA ENGINEERING": {"id": 1941, "name": "Engineering"}, "DATA PRODUCT": {"id": 2200, "name": "Data Products"}, "DATA PRODUCTS": {"id": 2200, "name": "Data Products"}, "DATA SCIENCE": {"id": 1400, "name": "Data Science"}, "DATA STRATEGY": {"id": 2300, "name": "Data Strategy"}, "EXECUTIVE OPERATIONS": {"id": 8200, "name": "Executive Operations"}, "EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "FP&A": {"id": 5200, "name": "Financial Planning & Analysis"}, "INFRASTRUCTURE": {"id": 1600, "name": "Infrastructure"}, "MSI": {"id": 4510, "name": "Sales"}, "PEOPLE PARTNERS & OPERATIONS": {"id": 6300, "name": "People"}, "PROD/ENG OPERATIONS": {"id": 1943, "name": "Product"}, "PRODUCT": {"id": 1943, "name": "Product"}, "PRODUCT/ENG MGMT": {"id": 1943, "name": "Product"}, "PROFESSIONAL SERVICES": {"id": 3560, "name": "Mavens - Consulting"}, "QUALITY ASSURANCE": {"id": 1941, "name": "Engineering"}, "RESEARCH AND ANALYTICS": {"id": 2400, "name": "BAP Researchers"}, "SALES": {"id": 4510, "name": "Sales"}, "SECURITY": {"id": 1900, "name": "Security"}, "SEGMENT MARKETING": {"id": 3100, "name": "Marketing"}, "SOFTWARE ENGINEERING": {"id": 1941, "name": "Engineering"}, "TECH SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "TECHNICAL SOLUTIONS": {"id": 4110, "name": "Technical Solutions"}, "ENGINEERING": {"id": 1941, "name": "Engineering"}, "OFFICE OF CTO": {"id": 1001, "name": "Office of CTO"}, "MAVENS - OPERATIONS": {"id": 3540, "name": "Mavens - Operations"}, "FUNCTION CHIEF- COMMERCIAL": {"id": 4001, "name": "Function Chief - Commercial"}, "MAVENS - DELIVERY": {"id": 3560, "name": "Mavens - Consulting"}, "MARKETING": {"id": 3100, "name": "Marketing"}, "PEOPLE OPERATIONS": {"id": 6300, "name": "People"}, "GTM OPERATIONS": {"id": 4160, "name": "GTM Operations"}, "LEGAL": {"id": 7100, "name": "Legal"}, "RETENTION": {"id": 4170, "name": "Retention"}, "ANALYTICS SERVICES": {"id": 4190, "name": "Analytics Services"}, "FAST": {"id": 4180, "name": "FAST"}, "FINANCIAL PLANNING & ANALYSIS": {"id": 5200, "name": "Financial Planning & Analysis"}, "MAVENS - ENGINEERING": {"id": 3510, "name": "Mavens - Engineering"}, "MAVENS - SALES": {"id": 3530, "name": "Mavens - Sales"}, "SALES ENGINEERING": {"id": 4120, "name": "Sales Engineering"}, "MAVENS - SOLUTIONS LEADS": {"id": 3570, "name": "Mavens - Solutions Leads"}, "OFFICE & EXPERIENCE": {"id": 6200, "name": "Office & Experience"}, "TALENT ACQUISITION": {"id": 6100, "name": "Talent Acquisition"}, "INFORMATION TECHNOLOGY": {"id": 9300, "name": "Information Technology"}, "SALES DEVELOPMENT": {"id": 3200, "name": "Sales Development"}};
let sbcSlots = new Array(8).fill(null); // each: {file, meta, raw, total, agg, missing, error}

function loadPersistedMapping(){
  try {
    const saved = JSON.parse(localStorage.getItem(SBC_STORAGE_KEY) || 'null');
    if(saved && typeof saved === 'object') {
      Object.keys(SBC_MAPPING).forEach(k => delete SBC_MAPPING[k]);
      Object.assign(SBC_MAPPING, saved);
    }
  } catch(e) { console.warn('Could not load saved SBC mapping', e); }
}
function persistMapping(){
  try { localStorage.setItem(SBC_STORAGE_KEY, JSON.stringify(SBC_MAPPING)); } catch(e) { console.warn('Could not persist SBC mapping', e); }
}

function sbcShowMessage(message, type='info'){
  const el = document.getElementById('sbc-mapping-message');
  if(!el) return;
  el.className = 'mapping-message show ' + type;
  el.textContent = message;
}

function sbcClearMessage(){
  const el = document.getElementById('sbc-mapping-message');
  if(!el) return;
  el.className = 'mapping-message';
  el.textContent = '';
}

async function sbcEnsureXLSX(){
  if(typeof XLSX !== 'undefined') return;
  await new Promise((res,rej)=>{
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function sbcNormalizeHeader(v){
  return String(v == null ? '' : v).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function sbcBuildMappingFromRows(rows){
  const cleaned = rows.filter(r => Array.isArray(r) && r.some(v => String(v ?? '').trim() !== ''));
  if(!cleaned.length) throw new Error('Mapping file is empty.');

  const header = cleaned[0].map(sbcNormalizeHeader);
  let originalIdx = header.findIndex(h => /^(original|source|cost center|cost centre|name)$/.test(h) || h.includes('original'));
  let idIdx = header.findIndex(h => h.includes('mapped cc') || h.includes('mapped id') || h === 'id' || h.includes('cost center id'));
  let nameIdx = header.findIndex(h => h.includes('mapped cc name') || h.includes('mapped name') || h === 'mapped name' || h === 'name mapped');
  let start = 1;

  if(originalIdx === -1 || idIdx === -1 || nameIdx === -1){
    start = 0;
    originalIdx = 0;
    idIdx = 1;
    nameIdx = 2;
  }

  const mapping = {};
  for(const row of cleaned.slice(start)){
    const original = String(row[originalIdx] ?? '').trim();
    const idRaw = String(row[idIdx] ?? '').trim();
    const name = String(row[nameIdx] ?? '').trim();
    const id = parseInt(idRaw.replace(/\.0$/, ''), 10);
    if(!original || !name || !Number.isFinite(id)) continue;
    mapping[original] = { id, name };
  }

  if(!Object.keys(mapping).length) throw new Error('Could not read any valid mapping rows from the uploaded file.');
  return mapping;
}

function sbcBuildMappingFromJson(payload){
  if(Array.isArray(payload)){
    return sbcBuildMappingFromRows(payload.map(item => [item.original || item.source || item.name || item['Original'], item.id || item['Mapped CC #'] || item['mappedId'], item.mappedName || item.nameMapped || item['Mapped CC Name'] || item['mappedName']]));
  }
  if(payload && typeof payload === 'object'){
    const mapping = {};
    for(const [original, value] of Object.entries(payload)){
      if(!value || typeof value !== 'object') continue;
      const id = parseInt(String(value.id ?? value['Mapped CC #'] ?? '').replace(/\.0$/, ''), 10);
      const name = String(value.name ?? value['Mapped CC Name'] ?? '').trim();
      if(!original || !name || !Number.isFinite(id)) continue;
      mapping[original] = { id, name };
    }
    if(!Object.keys(mapping).length) throw new Error('JSON mapping file did not contain valid mapping entries.');
    return mapping;
  }
  throw new Error('Unsupported JSON mapping structure.');
}

async function sbcParseUploadedMapping(file){
  const ext = file.name.toLowerCase().split('.').pop();
  if(ext === 'json'){
    const payload = JSON.parse(await file.text());
    return sbcBuildMappingFromJson(payload);
  }
  if(ext === 'csv'){
    const raw = await file.text();
    const rows = raw.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(v => v.trim().replace(/^"|"$/g, '')));
    return sbcBuildMappingFromRows(rows);
  }
  if(ext === 'xlsx' || ext === 'xls'){
    await sbcEnsureXLSX();
    const wb = XLSX.read(await file.arrayBuffer(), {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
    return sbcBuildMappingFromRows(rows);
  }
  throw new Error('Use a JSON, CSV, XLSX, or XLS file for Mapping upload.');
}

async function sbcMappingFileSelected(input){
  const file = input.files && input.files[0];
  if(!file) return;
  sbcShowMessage('Uploading mapping…', 'info');
  try {
    const nextMapping = await sbcParseUploadedMapping(file);
    Object.keys(SBC_MAPPING).forEach(k => delete SBC_MAPPING[k]);
    Object.assign(SBC_MAPPING, nextMapping);
    persistMapping();
    sbcRenderMappingTable();
    sbcRecomputeAll();
    sbcShowMessage(`Mapping updated from ${file.name}. ${Object.keys(nextMapping).length} rows loaded.`, 'success');
  } catch(err) {
    console.error(err);
    sbcShowMessage(err.message || 'Could not upload mapping file.', 'error');
  } finally {
    input.value = '';
  }
}
function sbcResetMapping(){
  if(!confirm('Reset the mapping back to the default version?')) return;
  Object.keys(SBC_MAPPING).forEach(k => delete SBC_MAPPING[k]);
  Object.assign(SBC_MAPPING, JSON.parse(JSON.stringify(SBC_DEFAULT_MAPPING)));
  persistMapping();
  sbcRenderMappingTable();
  sbcRecomputeAll();
  sbcShowMessage('Mapping reset back to the default version.', 'info');
}

function sbcShowTab(name){
  document.getElementById('sbc-tab-mapping').classList.toggle('active', name==='mapping');
  document.getElementById('sbc-tab-files').classList.toggle('active', name==='files');
  document.getElementById('sbc-tabcontent-mapping').classList.toggle('active', name==='mapping');
  document.getElementById('sbc-tabcontent-files').classList.toggle('active', name==='files');
}

// ── Mapping table (editable) ────────────────────────────────
function sbcMappingRowHTML(orig, m){
  return '<td style="padding:5px 8px;border:1px solid #d0d7df;"><input style="width:100%;border:1px solid #D3D1C7;border-radius:4px;padding:2px 4px;background:#F0F7FF;" class="sbc-map-orig" data-orig="'+esc(orig)+'" value="'+esc(orig)+'" placeholder="Original cost center name"></td>'
    + '<td style="padding:5px 8px;border:1px solid #d0d7df;"><input style="width:70px;text-align:center;border:1px solid #D3D1C7;border-radius:4px;padding:2px 4px;background:#F0F7FF;" class="sbc-map-id" data-orig="'+esc(orig)+'" value="'+(m.id||'')+'" placeholder="ID"></td>'
    + '<td style="padding:5px 8px;border:1px solid #d0d7df;"><input style="width:100%;border:1px solid #D3D1C7;border-radius:4px;padding:2px 4px;background:#F0F7FF;" class="sbc-map-name" data-orig="'+esc(orig)+'" value="'+esc(m.name||'')+'" placeholder="Mapped CC Name"></td>'
    + '<td style="padding:5px 8px;border:1px solid #d0d7df;text-align:center;"><i class="ti ti-trash" style="cursor:pointer;color:#A32D2D;" onclick="sbcRemoveMappingRow(this)"></i></td>';
}

function sbcRenderMappingTable(){
  const tbody = document.querySelector('#mappingTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  Object.keys(SBC_MAPPING).sort().forEach(orig => {
    const tr = document.createElement('tr');
    tr.innerHTML = sbcMappingRowHTML(orig, SBC_MAPPING[orig]);
    tbody.appendChild(tr);
  });
  sbcWireMappingRow(tbody);
}

function sbcWireMappingRow(scope){
  scope.querySelectorAll('.sbc-map-orig, .sbc-map-id, .sbc-map-name').forEach(inp => {
    inp.removeEventListener('change', sbcOnMappingFieldChange);
    inp.addEventListener('change', sbcOnMappingFieldChange);
  });
}

function sbcOnMappingFieldChange(e){
  const tr = e.target.closest('tr');
  const origInput = tr.querySelector('.sbc-map-orig');
  const idInput = tr.querySelector('.sbc-map-id');
  const nameInput = tr.querySelector('.sbc-map-name');
  const oldKey = origInput.dataset.orig;
  const newKey = origInput.value.trim();

  if(oldKey && oldKey !== newKey && SBC_MAPPING[oldKey]) delete SBC_MAPPING[oldKey];

  if(newKey){
    SBC_MAPPING[newKey] = {id: parseInt(idInput.value) || 0, name: nameInput.value.trim()};
  }
  // Update data-orig on all three inputs in this row to the new key
  [origInput, idInput, nameInput].forEach(el => el.dataset.orig = newKey);
  persistMapping();
  sbcRecomputeAll();
}

function sbcAddMappingRow(){
  const tbody = document.querySelector('#mappingTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = sbcMappingRowHTML('', {id:'', name:''});
  tbody.appendChild(tr);
  sbcWireMappingRow(tr);
  persistMapping();
  sbcClearMessage();
  tr.querySelector('.sbc-map-orig').focus();
}

function sbcRemoveMappingRow(trashIcon){
  const tr = trashIcon.closest('tr');
  const key = tr.querySelector('.sbc-map-orig').dataset.orig;
  if(key && SBC_MAPPING[key]) delete SBC_MAPPING[key];
  tr.remove();
  persistMapping();
  sbcRecomputeAll();
}


function sbcDownloadMapping(){
  const blob = new Blob([JSON.stringify(SBC_MAPPING, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='mapping.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── File slots ───────────────────────────────────────────────
function sbcSlotDragOver(e, idx){ e.preventDefault(); document.getElementById('sbc-slot-upload-'+idx).style.borderColor='#1D9E75'; }
function sbcSlotDragLeave(idx){ const el=document.getElementById('sbc-slot-upload-'+idx); if(!el.classList.contains('filled')&&!el.classList.contains('error')) el.style.borderColor='#D3D1C7'; }
function sbcSlotDrop(e, idx){
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if(file) sbcLoadSlot(idx, file);
}
function sbcSlotFileSelected(idx, input){
  if(input.files[0]) sbcLoadSlot(idx, input.files[0]);
}

async function sbcLoadSlot(idx, file){
  const upload = document.getElementById('sbc-slot-upload-'+idx);
  const label  = document.getElementById('sbc-slot-label-'+idx);
  const icon   = document.getElementById('sbc-slot-icon-'+idx);
  label.textContent = file.name + ' — processing…';
  upload.classList.remove('error'); upload.classList.add('filled');
  icon.className = 'ti ti-loader-2';

  try {
    if(typeof XLSX === 'undefined'){
      await new Promise((res,rej)=>{
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const meta = sbcParseFilename(file.name);
    const wb = await sbcReadXLSX(file);
    const cc = sbcParseCostCenter(wb, file.name);
    sbcSlots[idx] = {file, meta, raw: cc.raw, total: cc.total};
    icon.className = 'ti ti-file-check';
    label.textContent = file.name;
    upload.style.borderColor = '#1D9E75';
  } catch(err){
    sbcSlots[idx] = {file, error: err.message};
    icon.className = 'ti ti-alert-triangle';
    label.textContent = file.name + ' — error';
    upload.classList.remove('filled'); upload.classList.add('error');
    upload.style.borderColor = '#A32D2D';
  }
  sbcRenderSlot(idx);
  sbcUpdateConsolidatedButton();
}

function sbcRenderSlot(idx){
  const s = sbcSlots[idx];
  const qEl = document.getElementById('sbc-slot-quarter-'+idx);
  const aEl = document.getElementById('sbc-slot-amount-'+idx);
  const dEl = document.getElementById('sbc-slot-download-'+idx);
  const row = document.getElementById('sbc-slot-row-'+idx);

  // Clear any previous inline error line
  const prevErr = row.querySelector('.sbc-slot-error-text');
  if(prevErr) prevErr.remove();

  if(!s){ qEl.textContent='—'; aEl.textContent='—'; aEl.classList.remove('mismatch'); dEl.disabled=true; return; }
  if(s.error){
    qEl.textContent = '—'; aEl.textContent = 'Error'; aEl.classList.add('mismatch'); dEl.disabled = true;
    const errDiv = document.createElement('div');
    errDiv.className = 'sbc-slot-error-text';
    errDiv.textContent = s.error;
    row.appendChild(errDiv);
    return;
  }

  const result = sbcProcessSlotData(s);
  s.agg = result.agg; s.missing = result.missing;
  qEl.textContent = s.meta.label + ' (' + s.meta.period + ')';

  if(result.missing.length){
    aEl.textContent = 'Unmapped'; aEl.classList.add('mismatch'); dEl.disabled = true;
    const errDiv = document.createElement('div');
    errDiv.className = 'sbc-slot-error-text';
    errDiv.textContent = '⚠ Not in mapping — update Mapping.xlsx first: ' + result.missing.join(', ');
    row.appendChild(errDiv);
    return;
  }

  const sum = Object.values(result.agg).reduce((a,b)=>a+b,0);
  const diff = Math.abs(sum - s.total);
  aEl.textContent = sbcFmtMoney(sum);
  if(diff >= 1){
    aEl.classList.add('mismatch'); dEl.disabled = true;
    const errDiv = document.createElement('div');
    errDiv.className = 'sbc-slot-error-text';
    errDiv.textContent = '⚠ Mismatch vs source Total (' + sbcFmtMoney(s.total) + ')';
    row.appendChild(errDiv);
  } else {
    aEl.classList.remove('mismatch'); dEl.disabled = false;
  }
}

function sbcProcessSlotData(s){
  const missing = []; const agg = {};
  s.raw.forEach(r => {
    const m = SBC_MAPPING[r.name];
    if(!m){ missing.push(r.name); return; }
    agg[m.id] = (agg[m.id] || 0) + r.amount;
  });
  return {agg, missing: [...new Set(missing)]};
}

function sbcRecomputeAll(){
  for(let i=0;i<8;i++){ if(sbcSlots[i] && !sbcSlots[i].error) sbcRenderSlot(i); }
  sbcUpdateConsolidatedButton();
}

function sbcFmtMoney(n){
  const sign = n<0 ? '-' : '';
  return '$' + sign + Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function sbcSlotRows(s){
  // Period, Amount, Class — sorted by Amount ascending
  return Object.entries(s.agg)
    .map(([id,amt]) => [s.meta.period, Math.round(amt*100)/100, id])
    .sort((a,b) => a[1]-b[1]);
}

function sbcToCsv(rows){
  return ['Period,Amount,Class', ...rows.map(r => r[0]+','+r[1].toFixed(2)+','+r[2])].join('\n');
}
function sbcDownloadBlob(content, filename){
  const blob = new Blob([content], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function sbcDownloadSlot(idx){
  const s = sbcSlots[idx];
  if(!s || s.error || !s.agg || s.missing.length) return;
  const rows = sbcSlotRows(s);
  sbcDownloadBlob(sbcToCsv(rows), 'SBC_'+s.meta.label.replace(/\s+/g,'_')+'_Feed.csv');
}

function sbcUpdateConsolidatedButton(){
  const btn = document.getElementById('sbc-consolidated-btn');
  const ready = sbcSlots.some(s => s && !s.error && s.agg && !s.missing.length);
  btn.disabled = !ready;
  sbcUpdateGrandTotal();
}

function sbcUpdateGrandTotal(){
  const el = document.getElementById('sbc-grand-total-value');
  if(!el) return;
  let sum = 0;
  sbcSlots.forEach(s => {
    if(s && !s.error && s.agg && !s.missing.length) sum += Object.values(s.agg).reduce((a,b)=>a+b,0);
  });
  el.textContent = sbcFmtMoney(sum);
}

function sbcDownloadConsolidated(){
  const rows = [];
  sbcSlots.forEach(s => { if(s && !s.error && s.agg && !s.missing.length) rows.push(...sbcSlotRows(s)); });
  if(!rows.length) return;
  sbcDownloadBlob(sbcToCsv(rows), 'SBC_Consolidated_Feed.csv');
}

// ── Parsing helpers ──────────────────────────────────────────
async function sbcReadXLSX(file){
  return new Promise((res,rej)=>{
    const reader = new FileReader();
    reader.onload = e => {
      try { res(XLSX.read(new Uint8Array(e.target.result), {type:'array', sheets:['Cost center']})); }
      catch(err){ rej(err); }
    };
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });
}

const SBC_LAST_MONTH_OF_Q = {1:4, 2:7, 3:10, 4:1};
function sbcParseFilename(filename){
  const m = filename.match(/SBC_Q(\d)_(\d{4})_Forecast/i);
  if(!m) throw new Error('Filename "'+filename+'" doesn\'t match pattern SBC_QX_YYYY_Forecast.xlsx');
  const quarter = parseInt(m[1]), fy = parseInt(m[2]);
  const month = SBC_LAST_MONTH_OF_Q[quarter];
  const calYear = quarter === 4 ? fy : fy - 1;
  const period = String(month).padStart(2,'0') + '/01/' + calYear;
  return {quarter, fy, period, label: 'FY'+fy+' Q'+quarter};
}

function sbcParseCostCenter(wb, filename){
  const ws = wb.Sheets['Cost center'];
  if(!ws) throw new Error('"Cost center" tab not found in ' + filename);
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:0});
  const data = rows.slice(2); // skip 2 header rows
  const totalRow = data.find(r => String(r[0]).trim() === 'Total');
  if(!totalRow) throw new Error('"Total" row not found in Cost center tab of ' + filename);
  const nonzero = data.filter(r => String(r[0]).trim() !== 'Total' && r[1] !== 0);
  return {raw: nonzero.map(r => ({name:String(r[0]).trim(), amount:Math.round(r[1]*100)/100})), total: totalRow[1]};
}

// Called from showTool() right after the SBC panel HTML is inserted
function sbcInitPanel(){
  sbcRenderMappingTable();
  for(let i=0;i<8;i++){
    const s = sbcSlots[i];
    if(!s) continue;
    const upload = document.getElementById('sbc-slot-upload-'+i);
    const label  = document.getElementById('sbc-slot-label-'+i);
    const icon   = document.getElementById('sbc-slot-icon-'+i);
    label.textContent = s.file.name;
    icon.className = s.error ? 'ti ti-alert-triangle' : 'ti ti-file-check';
    upload.classList.add(s.error ? 'error' : 'filled');
    upload.style.borderColor = s.error ? '#A32D2D' : '#1D9E75';
    sbcRenderSlot(i);
  }
  sbcUpdateConsolidatedButton();
}

const _sbcOriginalMappingChange = sbcOnMappingFieldChange;
sbcOnMappingFieldChange = function(e){ _sbcOriginalMappingChange(e); persistMapping(); };
const _sbcOriginalRemoveRow = sbcRemoveMappingRow;
sbcRemoveMappingRow = function(icon){ _sbcOriginalRemoveRow(icon); persistMapping(); };
const _sbcOriginalAddRow = sbcAddMappingRow;
sbcAddMappingRow = function(){ _sbcOriginalAddRow(); persistMapping(); };
const _sbcOriginalDownloadMapping = sbcDownloadMapping;
sbcDownloadMapping = function(){ persistMapping(); _sbcOriginalDownloadMapping(); };

document.addEventListener('DOMContentLoaded', function(){
  loadPersistedMapping();
  sbcRenderMappingTable();
  sbcUpdateConsolidatedButton();
  sbcClearMessage();
});
