
(function(){
  Chart.register(ChartDataLabels);

  const state = {
    files: { quarter:null, year:null, hc:null, te:null },
    model: null,
    edits: {}
  };
  const chartRefs = {};

  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fiscalOrder = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
  const dom = {
    quarterFile: document.getElementById('quarter-file'),
    yearFile: document.getElementById('year-file'),
    hcFile: document.getElementById('hc-file'),
    teFile: document.getElementById('te-file'),
    buildBtn: document.getElementById('build-btn'),
    resetBtn: document.getElementById('reset-btn'),
    errors: document.getElementById('build-errors'),
    root: document.getElementById('dashboard-root'),
    sidebarFooter: document.getElementById('sidebar-footer')
  };

  const uploadMap = [
    ['quarter', dom.quarterFile, 'quarter-name'],
    ['year', dom.yearFile, 'year-name'],
    ['hc', dom.hcFile, 'hc-name'],
    ['te', dom.teFile, 'te-name']
  ];

  uploadMap.forEach(([key, input, labelId]) => {
    input.addEventListener('change', e => {
      const file = e.target.files[0] || null;
      state.files[key] = file;
      const label = document.getElementById(labelId);
      label.textContent = file ? file.name : 'Choose file';
      input.closest('.upload-card').classList.toggle('loaded', !!file);
      updateBuildButton();
    });
  });

  document.getElementById('save-nav').addEventListener('click', saveState);
  document.getElementById('download-nav').addEventListener('click', downloadHtml);
  dom.resetBtn.addEventListener('click', resetAll);
  dom.buildBtn.addEventListener('click', buildDashboard);
  document.querySelectorAll('aside nav ul li[data-nav]').forEach(li => {
    li.addEventListener('click', () => navTo(li.dataset.nav, li));
  });

  function updateBuildButton(){
    const ready = Object.values(state.files).every(Boolean);
    dom.buildBtn.disabled = !ready;
  }

  function showError(msg){ dom.errors.textContent = msg || ''; }
  function toast(msg){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  function resetAll(){
    state.model = null;
    state.edits = {};
    dom.root.innerHTML = '';
    showError('');
    document.getElementById('upload-shell').classList.remove('hidden');
    dom.sidebarFooter.textContent = 'Upload the 4 feeds to generate a board.';
    document.querySelectorAll('aside nav ul li').forEach((li, idx) => li.classList.toggle('active', idx===0));
  }

  async function buildDashboard(){
    try{
      showError('');
      dom.buildBtn.disabled = true;
      dom.buildBtn.innerHTML = '<i class="ti ti-loader-2"></i> Building...';
      const parsed = await parseFiles(state.files);
      const model = deriveModel(parsed);
      state.model = model;
      renderDashboard(model);
      restoreSavedState();
      document.getElementById('upload-shell').classList.add('hidden');
      dom.sidebarFooter.textContent = model.meta.badgeLabel;
    }catch(err){
      console.error(err);
      showError(err.message || 'Could not build the dashboard from the uploaded feeds.');
    }finally{
      dom.buildBtn.disabled = false;
      dom.buildBtn.innerHTML = '<i class="ti ti-wand"></i> Generate Board';
    }
  }

  async function parseFiles(files){
    const [quarterWb, yearWb, hcWb, teWb] = await Promise.all([
      readWorkbook(files.quarter), readWorkbook(files.year), readWorkbook(files.hc), readWorkbook(files.te)
    ]);
    const meta = parseMeta(files.quarter.name);
    return {
      meta,
      quarter: parseQuarterFeed(quarterWb),
      year: parseYearFeed(yearWb, meta),
      hc: parseHcFeed(hcWb),
      te: parseTeFeed(teWb)
    };
  }

  function readWorkbook(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try{
          const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
          resolve({ workbook: wb, sheet: ws, rows });
        }catch(err){ reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function parseMeta(filename){
    const cleaned = filename.replace(/\.xlsx?$/i,'');
    const fyMatch = cleaned.match(/(FY\d{2})/i);
    const monthMatch = cleaned.match(/(?:FY\d{2}[_ -]?)([A-Za-z]{3,9})/i);
    const beforeFeed = cleaned.match(/(?:QUARTER|YEAR|HC|TE)[_ -]+(.+?)[_ -]*Feed/i);
    let dashboardCode = beforeFeed ? beforeFeed[1].replace(/[_]+/g,' ').replace(/\s+/g,' ').trim() : 'BvA';
    if(/^\d+\s*-\s*.+$/.test(dashboardCode)){
      dashboardCode = dashboardCode.replace(/^\d+\s*-\s*/, '').trim();
    }
    dashboardCode = dashboardCode.replace(/\s*Feed$/i,'').trim();
    return {
      dashboardCode,
      fyToken: fyMatch ? fyMatch[1].toUpperCase() : 'FY',
      monthToken: monthMatch ? normalizeMonth(monthMatch[1]) : 'Month',
      preparedBy: 'Monty'
    };
  }

  function normalizeMonth(str){
    const short = String(str||'').slice(0,3).toLowerCase();
    const match = monthOrder.find(m => m.toLowerCase() === short);
    return match || str;
  }

  function v(x){
    if(x === null || x === undefined || x === '') return 0;
    if(typeof x === 'number') return x;
    const s = String(x).replace(/[$,]/g,'').trim();
    if(!s) return 0;
    if(/^\((.*)\)$/.test(s)) return -Number(RegExp.$1);
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function fmtK(n){
    if(!Number.isFinite(n) || n === 0) return '—';
    const rounded = Math.round(n / 1000);
    const abs = Math.abs(rounded).toLocaleString('en-US');
    if(rounded > 0) return '+$' + abs + 'K';
    return '-$' + abs + 'K';
  }

  function varClass(n){
    if(!n) return 'var-neu';
    return n < 0 ? 'var-fav' : 'var-unfav';
  }

  function varianceBadge(n){
    if(!n) return '<span class="badge b-plan">PLAN</span>';
    return n < 0 ? '<span class="badge b-fav">↓ FAVORABLE</span>' : '<span class="badge b-unfav">↑ UNFAVORABLE</span>';
  }

  function classifyRow(label){
    const txt = String(label||'').trim();
    if(!txt) return 'blank';
    if(/^Expense$/i.test(txt)) return 'expense';
    if(/^Total\s+/i.test(txt)) return 'l2';
    if(/^[67]\d{5}\s*-/.test(txt)) return 'gl';
    if(/^\d+\s*-/.test(txt)) return 'vendor';
    if(/^No Vendor\s*-/i.test(txt)) return 'novendor';
    return 'other';
  }

  function parseQuarterFeed(wb){
    const rows = wb.rows;
    const quarterHeader = String(rows[0][5] || rows[0][9] || rows[0][13] || '').trim();
    const monthLabels = [String(rows[1][5]||'').trim(), String(rows[1][9]||'').trim(), String(rows[1][13]||'').trim()];
    const fcstRaw = [rows[2][3], rows[2][7], rows[2][11], rows[2][15]].map(x => String(x||'')).find(x => /forecast|fcst/i.test(x)) || 'Forecast';
    const forecastLabel = fcstRaw.replace(/Forecast/i,'FCST').replace(/\s+/g,' ').trim();

    const dataRows = [];
    for(let i=3;i<rows.length;i++){
      const label = String(rows[i][0] || '').trim();
      if(!label) continue;
      dataRows.push({
        index: i,
        label,
        rowType: classifyRow(label),
        __raw: rows[i],
        total: { w:v(rows[i][1]), p:v(rows[i][2]), f:v(rows[i][3]) },
        months: [
          { label: monthLabels[0], w:v(rows[i][5]), p:v(rows[i][6]), f:v(rows[i][7]) },
          { label: monthLabels[1], w:v(rows[i][9]), p:v(rows[i][10]), f:v(rows[i][11]) },
          { label: monthLabels[2], w:v(rows[i][13]), p:v(rows[i][14]), f:v(rows[i][15]) }
        ]
      });
    }
    return { quarterHeader, monthLabels, forecastLabel, dataRows };
  }

  function parseYearFeed(wb, meta){
    const rows = wb.rows;
    const headerRows = rows.slice(0,4);
    const dataRows = [];
    for(let i=4;i<rows.length;i++){
      const label = String(rows[i][0] || '').trim();
      if(!label) continue;
      dataRows.push({
        index: i,
        label,
        rowType: classifyRow(label),
        __raw: rows[i],
        total: { w:v(rows[i][1]), p:v(rows[i][2]), f:v(rows[i][3]) },
        quarters: [
          { label: String(rows[1][5]||'Q1').trim(), w:v(rows[i][5]), p:v(rows[i][6]), f:v(rows[i][7]) },
          { label: String(rows[1][9]||'Q2').trim(), w:v(rows[i][9]), p:v(rows[i][10]), f:v(rows[i][11]) },
          { label: String(rows[1][13]||'Q3').trim(), w:v(rows[i][13]), p:v(rows[i][14]), f:v(rows[i][15]) },
          { label: String(rows[1][17]||'Q4').trim(), w:v(rows[i][17]), p:v(rows[i][18]), f:v(rows[i][19]) }
        ]
      });
    }

    const monthCols = detectYearMonthlyColumns(headerRows);
    return { headerRows, dataRows, monthCols };
  }

  function detectYearMonthlyColumns(headerRows){
    const monthRow = headerRows[3] || [];
    const metricRow = headerRows[2] || [];
    const out = [];
    let currentMetric = '';
    for(let c=0;c<monthRow.length;c++){
      const monthLabel = String(monthRow[c] || '').trim();
      const rawMetric = String(metricRow[c] || '').trim();
      if(rawMetric) currentMetric = rawMetric;
      const metric = currentMetric;
      if(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(monthLabel) && /working|plan/i.test(metric)){
        out.push({ col:c, monthLabel, metric });
      }
    }
    return out;
  }

  function parseHcFeed(wb){
    const rows = wb.rows;
    const salaryIdx = rows.findIndex(r => String(r[0]||r[1]||'').toLowerCase().includes('salary accrued'));
    if(salaryIdx < 0) throw new Error('Could not find Salary Accrued row in HC feed.');
    const salaryRow = rows[salaryIdx];
    const employeeRows = rows.slice(salaryIdx+1).filter(r => String(r[0]||'').trim());
    return {
      salary: {
        planTotal: v(salaryRow[1]), q: [v(salaryRow[2]), v(salaryRow[3]), v(salaryRow[4]), v(salaryRow[5])],
        workTotal: v(salaryRow[6]), qWork: [v(salaryRow[7]), v(salaryRow[8]), v(salaryRow[9]), v(salaryRow[10])]
      },
      employeeRows: employeeRows.map(r => ({
        name: String(r[0]||'').trim(),
        planTotal: v(r[1]), workTotal: v(r[6]), variance: v(r[6]) - v(r[1]),
        isTbh: /^TBH\b/i.test(String(r[0]||'').trim())
      }))
    };
  }

  function parseTeFeed(wb){
    const rows = wb.rows;
    const headerIdx = rows.findIndex(r => String(r[0]||'').trim().toLowerCase() === 'employee' && String(r[1]||'').trim().toLowerCase() === 'vendor');
    if(headerIdx < 0) throw new Error('Could not find Employee/Vendor header row in T&E feed.');
    const header = rows[headerIdx].map(x => String(x||'').trim());
    const monthHeaders = header.slice(2).filter(Boolean);
    const body = rows.slice(headerIdx+1).filter(r => String(r[0]||'').trim());
    const totalIdx = body.findIndex(r => String(r[0]||'').trim().toLowerCase() === 'total');
    const detailRows = (totalIdx >= 0 ? body.slice(0,totalIdx) : body).map(r => ({ employee:String(r[0]||'').trim(), vendor:String(r[1]||'').trim(), values: monthHeaders.map((_,i) => v(r[i+2])) }));
    const totalRow = totalIdx >= 0 ? { employee:'Total', vendor:'', values: monthHeaders.map((_,i) => v(body[totalIdx][i+2])) } : { employee:'Total', vendor:'', values: monthHeaders.map((_,i) => detailRows.reduce((s,row)=>s+row.values[i],0)) };
    return { monthHeaders, detailRows, totalRow };
  }

  function deriveModel(parsed){
    const quarterExpense = parsed.quarter.dataRows.find(r => r.rowType === 'expense');
    const yearExpense = parsed.year.dataRows.find(r => r.rowType === 'expense');
    if(!quarterExpense || !yearExpense) throw new Error('Could not find Expense row in Quarter or Year feed.');

    const monthIdx = parsed.quarter.monthLabels.findIndex(m => normalizeMonth(m) === parsed.meta.monthToken);
    const effectiveMonthIdx = monthIdx >= 0 ? monthIdx : 0;
    const monthLabel = parsed.quarter.monthLabels[effectiveMonthIdx] || parsed.meta.monthToken;

    const badgeLabel = `${parsed.meta.dashboardCode} · ${parsed.meta.monthToken} ${parsed.meta.fyToken} · ${parsed.quarter.quarterHeader}`;

    const l2QuarterRows = parsed.quarter.dataRows.filter(r => r.rowType === 'l2');
    const l2YearRows = parsed.year.dataRows.filter(r => r.rowType === 'l2');

    const quarterPlanVar = l2QuarterRows.map(r => ({ ...r, variance: r.total.w - r.total.p }));
    const quarterFcstVar = l2QuarterRows.map(r => ({ ...r, variance: r.total.w - r.total.f }));
    const yearPlanVar = l2YearRows.map(r => ({ ...r, variance: r.total.w - r.total.p }));
    const yearFcstVar = l2YearRows.map(r => ({ ...r, variance: r.total.w - r.total.f }));

    const quarterTopPlan = rankTop(quarterPlanVar, 3);
    const quarterTopFcst = rankTop(quarterFcstVar, 3);
    const yearTopPlan = rankTop(yearPlanVar, 3);
    const yearTopFcst = rankTop(yearFcstVar, 3);

    const quarterDriverBlocksPlan = deriveQuarterDriverBlocks(parsed.quarter, quarterPlanVar, 'p', 35000);
    const quarterDriverBlocksFcst = deriveQuarterDriverBlocks(parsed.quarter, quarterFcstVar, 'f', 35000);
    const yearDriverBlocksPlan = deriveYearDriverBlocks(parsed.year, yearPlanVar, 'p', 75000);
    const yearDriverBlocksFcst = deriveYearDriverBlocks(parsed.year, yearFcstVar, 'f', 75000);

    const hc = deriveHc(parsed.hc);
    const trend = deriveTrend(parsed.year, parsed.meta.monthToken, yearExpense.label);
    const te = deriveTe(parsed.te);
    const actions = deriveActions(parsed, quarterTopPlan, yearTopPlan, quarterDriverBlocksPlan, hc, te);

    return {
      meta: {
        dashboardCode: parsed.meta.dashboardCode,
        fyToken: parsed.meta.fyToken,
        monthToken: parsed.meta.monthToken,
        currentQuarterLabel: parsed.quarter.quarterHeader,
        forecastLabel: parsed.quarter.forecastLabel,
        badgeLabel,
        preparedBy: parsed.meta.preparedBy
      },
      quarter: {
        monthLabels: parsed.quarter.monthLabels,
        expense: quarterExpense,
        l2Rows: l2QuarterRows,
        kpis: {
          kpi1: quarterExpense.months[effectiveMonthIdx].w - quarterExpense.months[effectiveMonthIdx].p,
          kpi2: quarterExpense.months[effectiveMonthIdx].w - quarterExpense.months[effectiveMonthIdx].f,
          kpi3: quarterExpense.total.w - quarterExpense.total.p,
          kpi4: quarterExpense.total.w - quarterExpense.total.f
        },
        topPlan: quarterTopPlan,
        topFcst: quarterTopFcst,
        driverBlocksPlan: quarterDriverBlocksPlan,
        driverBlocksFcst: quarterDriverBlocksFcst,
        currentMonthLabel: monthLabel
      },
      year: {
        elapsedMonths: trend.labels,
        expense: yearExpense,
        l2Rows: l2YearRows,
        kpis: { kpi5: yearExpense.total.w - yearExpense.total.p, kpi6: yearExpense.total.w - yearExpense.total.f },
        trend,
        topPlan: yearTopPlan,
        topFcst: yearTopFcst,
        driverBlocksPlan: yearDriverBlocksPlan,
        driverBlocksFcst: yearDriverBlocksFcst
      },
      hc,
      te,
      actions
    };
  }

  function rankTop(rows, n){
    const sorted = rows.slice().sort((a,b) => Math.abs(b.variance) - Math.abs(a.variance));
    const top = sorted.slice(0,n);
    const totalVar = rows.reduce((s,r)=>s+r.variance,0);
    const others = totalVar - top.reduce((s,r)=>s+r.variance,0);
    return { rows: top, others, totalVar };
  }

  function deriveQuarterDriverBlocks(q, rows, benchmarkKey, threshold){
    const qualified = rows.filter(r => Math.abs(r.variance) > threshold);
    return qualified.map(r => ({
      id: slug(r.label + benchmarkKey),
      label: r.label,
      variance: r.variance,
      benchmarkKey,
      vendors: extractQuarterVendors(q.dataRows, r, benchmarkKey),
      comments: []
    }));
  }

  function deriveYearDriverBlocks(y, rows, benchmarkKey, threshold){
    return rows.filter(r => Math.abs(r.variance) > threshold).map(r => ({
      id: slug(r.label + benchmarkKey),
      label: r.label,
      variance: r.variance,
      benchmarkKey,
      vendors: [{ name:'No Vendor -', variance:r.variance, comment: summarizeVariance(r.label, r.variance, 'full-year') }],
      comments: []
    }));
  }

  function extractQuarterVendors(dataRows, targetRow, benchmarkKey){
    const idx = dataRows.findIndex(r => r.index === targetRow.index);
    const vendors = [];
    for(let i = idx - 1; i >= 0; i--){
      const row = dataRows[i];
      if(row.rowType === 'l2' || row.rowType === 'expense') break;
      if(row.rowType === 'vendor' || row.rowType === 'novendor'){
        const bench = row.total[benchmarkKey] || 0;
        const variance = row.total.w - bench;
        vendors.push({
          name: row.label,
          variance,
          comment: summarizeVariance(row.label, variance, 'quarter')
        });
      }
    }
    const picked = vendors.sort((a,b)=>Math.abs(b.variance)-Math.abs(a.variance)).slice(0,4);
    if(!picked.length){
      return [{ name:'No Vendor -', variance:targetRow.variance, comment:'Variance appears pooled inside unattributed detail rows. Review timing and spread within this L2 block.' }];
    }
    return picked;
  }

  function summarizeVariance(name, variance, scope){
    const direction = variance < 0 ? 'below benchmark / favorable' : 'above benchmark / unfavorable';
    const cleaned = String(name||'').replace(/^\d+\s*-\s*/,'').replace(/^Total\s+/,'');
    return `${cleaned} is ${direction} at ${fmtK(variance)} on a ${scope} basis. Validate timing, scope, and whether the run-rate should persist into the remaining periods.`;
  }

  function deriveTrend(yearFeed, monthToken, expenseLabel){
    const expenseRow = yearFeed.dataRows.find(r => r.label === expenseLabel) || yearFeed.dataRows.find(r => r.rowType === 'expense');
    const cutoff = fiscalOrder.indexOf(monthToken);
    const allowed = cutoff >= 0 ? fiscalOrder.slice(0, cutoff + 1) : fiscalOrder.slice(0, 1);
    const workingCols = yearFeed.monthCols.filter(c => /working/i.test(c.metric));
    const planCols = yearFeed.monthCols.filter(c => /plan/i.test(c.metric));
    const labels = [];
    const working = [];
    const plan = [];
    allowed.forEach(mon => {
      const wCol = workingCols.find(c => normalizeMonth(c.monthLabel) === mon);
      const pCol = planCols.find(c => normalizeMonth(c.monthLabel) === mon);
      if(wCol && pCol && expenseRow && expenseRow.__raw){
        labels.push(mon);
        working.push(v(expenseRow.__raw[wCol.col]));
        plan.push(v(expenseRow.__raw[pCol.col]));
      }
    });
    if(!labels.length){
      return { labels: allowed, working: allowed.map(()=>0), plan: allowed.map(()=>0) };
    }
    return { labels, working, plan };
  }

  function deriveHc(hc){
    const rows = hc.employeeRows;
    const activePlan = rows.filter(r => !r.isTbh && r.planTotal > 0).length;
    const activeWork = rows.filter(r => !r.isTbh && r.planTotal > 0 && r.workTotal > 0).length;
    const tbhPlan = rows.filter(r => r.isTbh && r.planTotal > 0).length;
    const tbhWork = rows.filter(r => r.isTbh && r.workTotal > 0).length;
    const newHires = rows.filter(r => r.planTotal === 0 && r.workTotal > 0).length;
    const endingPlan = rows.filter(r => r.planTotal > 0).length;
    const endingWork = rows.filter(r => r.workTotal > 0).length;
    const topVarianceEmployees = rows.slice().sort((a,b)=>Math.abs(b.variance)-Math.abs(a.variance)).slice(0,4).map(r => ({
      ...r,
      comment: hcComment(r)
    }));
    return {
      salaryAccrued: hc.salary,
      employeeRows: rows,
      movementCounts: { activePlan, activeWork, tbhPlan, tbhWork, newHires, endingPlan, endingWork },
      topVarianceEmployees
    };
  }

  function hcComment(r){
    if(r.isTbh && r.workTotal === 0) return 'Open req not filled yet; plan remains in place while working has not started.';
    if(r.isTbh && r.workTotal > 0) return 'TBH line is now flowing through working, consistent with an in-year hire against an open req.';
    if(r.planTotal === 0 && r.workTotal > 0) return 'Working cost is showing without plan budget, consistent with a new hire or transfer not included in plan.';
    if(r.variance < 0) return 'Working is below plan, likely driven by delayed fill, lower run rate, or partial-year employment.';
    if(r.variance > 0) return 'Working is above plan, likely driven by earlier start timing, higher comp, or accrual timing.';
    return 'No material variance versus plan.';
  }

  function deriveTe(te){
    const rows = te.detailRows.map(r => ({ ...r, grandTotal: r.values.reduce((s,n)=>s+n,0) }));
    const totalRow = { ...te.totalRow, grandTotal: te.totalRow.values.reduce((s,n)=>s+n,0) };
    return { headers: ['Employee','Vendor',...te.monthHeaders,'Grand Total'], rows, totalRow };
  }

  function deriveActions(parsed, quarterTopPlan, yearTopPlan, qBlocks, hc, te){
    const actions = [];
    quarterTopPlan.rows.slice(0,2).forEach(r => actions.push(`Review ${r.label} at ${fmtK(r.variance)} versus plan and confirm whether the quarter run-rate should persist.`));
    yearTopPlan.rows.slice(0,2).forEach(r => actions.push(`Confirm the full-year outlook for ${r.label}; current variance is ${fmtK(r.variance)} versus plan.`));
    if(qBlocks[0] && qBlocks[0].vendors[0]) actions.push(`Validate the vendor driver for ${qBlocks[0].label}, especially ${qBlocks[0].vendors[0].name}.`);
    if(hc.topVarianceEmployees[0]) actions.push(`Confirm HC variance driver for ${hc.topVarianceEmployees[0].name} and whether it reflects start timing, transfer, or comp variance.`);
    while(actions.length < 6) actions.push('Review any remaining variance outside the top drivers and confirm whether follow-up is needed before close.');
    return actions.slice(0,6);
  }

  function renderDashboard(model){
    document.getElementById('upload-shell').classList.add('hidden');
    const html = `
      ${renderOverview(model)}
      ${renderVarianceSection('sec-qplan', `${model.meta.currentQuarterLabel} vs ${model.meta.fyToken} Plan`, model.quarter.topPlan, model.quarter.driverBlocksPlan, model.quarter.l2Rows, 'p', model.quarter.monthLabels, model.quarter.expense.total.w, model.quarter.expense.total.p, `${model.meta.fyToken} Plan`, model.quarter.expense)}
      ${renderVarianceSection('sec-qfcst', `${model.meta.currentQuarterLabel} vs ${model.meta.forecastLabel}`, model.quarter.topFcst, model.quarter.driverBlocksFcst, model.quarter.l2Rows, 'f', model.quarter.monthLabels, model.quarter.expense.total.w, model.quarter.expense.total.f, model.meta.forecastLabel, model.quarter.expense)}
      ${renderYearSection('sec-fyplan', `Full Year vs ${model.meta.fyToken} Plan`, model.year.topPlan, model.year.driverBlocksPlan, model.year.l2Rows, 'p', model.year.expense.total.w, model.year.expense.total.p, `${model.meta.fyToken} Plan`, model.year.expense)}
      ${renderYearSection('sec-fyfcst', `Full Year vs ${model.meta.forecastLabel}`, model.year.topFcst, model.year.driverBlocksFcst, model.year.l2Rows, 'f', model.year.expense.total.w, model.year.expense.total.f, model.meta.forecastLabel, model.year.expense)}
      ${renderTE(model)}
      ${renderHC(model)}
      ${renderActions(model)}
    `;
    dom.root.innerHTML = html;
    bindInteractive(model);
    renderCharts(model);
  }

  function renderOverview(model){
    const k = model.quarter.kpis;
    const y = model.year.kpis;
    return `<section class="sec" id="sec-overview">
      <div class="sec-hdr"><span>Performance Overview</span><span class="sec-tag">Prepared by ${escapeHtml(model.meta.preparedBy)} · ${escapeHtml(model.meta.badgeLabel)}</span></div>
      <div class="kpi-grid">
        ${kpiCard(model.quarter.currentMonthLabel, k.kpi1, 'Current Month vs Plan')}
        ${kpiCard(model.quarter.currentMonthLabel, k.kpi2, `Current Month vs ${model.meta.forecastLabel}`)}
        ${kpiCard(model.meta.currentQuarterLabel, k.kpi3, 'Quarter vs Plan')}
        ${kpiCard(model.meta.currentQuarterLabel, k.kpi4, `Quarter vs ${model.meta.forecastLabel}`)}
        ${kpiCard(model.meta.fyToken, y.kpi5, 'Full Year vs Plan')}
      </div>
      <div class="sec-hdr"><span>Trend</span><span class="sec-tag">Working vs Plan · elapsed fiscal months</span></div>
      <div class="chart-legend"><div class="legend-key"><span class="legend-swatch work"></span> Working</div><div class="legend-key"><span class="legend-swatch plan dashed"></span> Plan</div></div>
      <div class="trend-wrap"><canvas id="trendC"></canvas></div>
    </section>`;
  }

  function kpiCard(label, val, sub){
    const cls = val < 0 ? 'kpi-fav' : val > 0 ? 'kpi-unfav' : 'kpi-neu';
    return `<div class="kpi-card"><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-val ${cls}">${fmtK(val)}</div><div class="kpi-sub">${escapeHtml(sub)}</div>${varianceBadge(val)}</div>`;
  }

  function renderVarianceSection(id, title, topBundle, blocks, rows, benchmarkKey, monthLabels, workingEnd, baseStart, benchmarkLabel, totalRow){
    const labels = [benchmarkLabel, ...topBundle.rows.map(r => cleanLabel(r.label)), 'Others', 'Working'];
    const vars = [...topBundle.rows.map(r=>r.variance), topBundle.others];
    return `<section class="sec" id="${id}">
      <div class="sec-hdr"><span>${escapeHtml(title)}</span><span class="sec-tag">${escapeHtml(benchmarkLabel)}</span></div>
      <div class="sublbl">Waterfall</div>
      <div class="wf-wrap"><canvas id="${id}-wf"></canvas></div>
      <div class="sublbl">L2 detail</div>
      <div class="tbl-wrap">${renderQuarterTable(rows, benchmarkKey, monthLabels, totalRow)}</div>
      <div class="sublbl">Drivers</div>
      ${blocks.map(b => renderDriverBlock(b)).join('') || '<div class="comment-block">No driver block crossed the materiality threshold for this section.</div>'}
      <div class="sublbl">Additional Comments</div>
      <div class="comment-block" data-comment-block="${id}-comments">${renderAdditionalComments(`${id}-comments`)}</div>
      <script type="application/json" id="${id}-wf-data">${JSON.stringify({labels, baseStart, vars, workingEnd})}</script>
    </section>`;
  }

  function renderYearSection(id, title, topBundle, blocks, rows, benchmarkKey, workingEnd, baseStart, benchmarkLabel, totalRow){
    const labels = [benchmarkLabel, ...topBundle.rows.map(r => cleanLabel(r.label)), 'Others', 'Working'];
    const vars = [...topBundle.rows.map(r=>r.variance), topBundle.others];
    return `<section class="sec" id="${id}">
      <div class="sec-hdr"><span>${escapeHtml(title)}</span><span class="sec-tag">${escapeHtml(benchmarkLabel)}</span></div>
      <div class="sublbl">Waterfall</div>
      <div class="wf-wrap"><canvas id="${id}-wf"></canvas></div>
      <div class="sublbl">L2 detail</div>
      <div class="tbl-outer"><div class="tbl-inner">${renderYearTable(rows, benchmarkKey, totalRow)}</div></div>
      <div class="sublbl">Drivers</div>
      ${blocks.map(b => renderDriverBlock(b)).join('') || '<div class="comment-block">No driver block crossed the materiality threshold for this section.</div>'}
      <div class="sublbl">Additional Comments</div>
      <div class="comment-block" data-comment-block="${id}-comments">${renderAdditionalComments(`${id}-comments`)}</div>
      <script type="application/json" id="${id}-wf-data">${JSON.stringify({labels, baseStart, vars, workingEnd})}</script>
    </section>`;
  }

  function renderQuarterTable(rows, benchmarkKey, monthLabels, totalRow){
    let h = '<table><thead><tr><th>Category</th><th class="yw">Q Working</th><th>' + (benchmarkKey==='p'?'Q Plan':'Q FCST') + '</th><th class="yv">Q Var</th>';
    monthLabels.forEach((m, idx) => { h += `<th class="yw">${escapeHtml(m)} W</th><th>${escapeHtml(m)} ${benchmarkKey==='p'?'P':'F'}</th><th class="mv">Var</th>`; });
    h += '</tr></thead><tbody>';
    const totalRows = totalRow ? [{ ...totalRow, label: totalRow.label || 'Expense', rowType: 'expense' }] : [];
    const orderedRows = rows.filter(r => r.rowType !== 'expense').concat(totalRows);
    orderedRows.forEach(r => {
      const qVar = r.total.w - r.total[benchmarkKey];
      const trCls = r.rowType === 'expense' ? 'tr-exp' : '';
      h += `<tr class="${trCls}"><td>${escapeHtml(cleanLabel(r.label))}</td><td class="yw">${fmtK(r.total.w)}</td><td>${fmtK(r.total[benchmarkKey])}</td><td class="yv ${varClass(qVar)}">${fmtK(qVar)}</td>`;
      r.months.forEach(m => {
        const mv = m.w - m[benchmarkKey];
        h += `<td class="yw">${fmtK(m.w)}</td><td>${fmtK(m[benchmarkKey])}</td><td class="mv ${varClass(mv)}">${fmtK(mv)}</td>`;
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function renderYearTable(rows, benchmarkKey, totalRow){
    let h = '<table><thead><tr><th>Category</th><th class="yw">FY Working</th><th>' + (benchmarkKey==='p'?'FY Plan':'FY FCST') + '</th><th class="yv">FY Var</th>';
    ['Q1','Q2','Q3','Q4'].forEach(q => { h += `<th class="yw">${q} W</th><th>${q} ${benchmarkKey==='p'?'P':'F'}</th><th class="mv">Var</th>`; });
    h += '</tr></thead><tbody>';
    const totalRows = totalRow ? [{ ...totalRow, label: totalRow.label || 'Expense', rowType: 'expense' }] : [];
    const orderedRows = rows.filter(r => r.rowType !== 'expense').concat(totalRows);
    orderedRows.forEach(r => {
      const fyVar = r.total.w - r.total[benchmarkKey];
      const trCls = r.rowType === 'expense' ? 'tr-exp' : '';
      h += `<tr class="${trCls}"><td>${escapeHtml(cleanLabel(r.label))}</td><td class="yw">${fmtK(r.total.w)}</td><td>${fmtK(r.total[benchmarkKey])}</td><td class="yv ${varClass(fyVar)}">${fmtK(fyVar)}</td>`;
      r.quarters.forEach(q => {
        const qVar = q.w - q[benchmarkKey];
        h += `<td class="yw">${fmtK(q.w)}</td><td>${fmtK(q[benchmarkKey])}</td><td class="mv ${varClass(qVar)}">${fmtK(qVar)}</td>`;
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function renderDriverBlock(block){
    return `<div class="drv-block ${block.variance < 0 ? 'fav-block':'unfav-block'}" id="blk-${block.id}-wrap">
      <div class="drv-block-inner">
        <div class="drv-left">
          <button class="del-block" data-del-block="blk-${block.id}"><i class="ti ti-trash"></i></button>
          <div class="drv-label">${escapeHtml(cleanLabel(block.label))}</div>
          <div class="drv-amt ${block.variance<0?'drv-fav':'drv-unfav'}">${fmtK(block.variance)}</div>
          <div class="drv-benchmark">Working vs ${block.benchmarkKey==='p'?'Plan':'FCST'}</div>
          <div class="drv-badge-wrap">${varianceBadge(block.variance)}</div>
        </div>
        <div class="drv-right">
          <div class="drv-vendors-hdr">Vendor Drivers</div>
          ${block.vendors.map((v,i) => renderVendorRow(block.id, i, v)).join('')}
          <div class="inline-add">
            <input class="add-comment-input" data-add-input="${block.id}" placeholder="Add comment row..." />
            <button class="mini-btn" data-add-comment="${block.id}"><i class="ti ti-plus"></i></button>
          </div>
          <div class="drv-footer">Review the underlying service, timing, and whether the current run-rate should carry through the rest of the period.</div>
        </div>
      </div>
    </div>`;
  }

  function renderVendorRow(blockId, idx, vendor){
    const rowId = `${blockId}-${idx}`;
    return `<div class="vrow" id="${rowId}-row">
      <span style="width:8px;height:8px;border-radius:50%;background:${vendor.variance<0?'#10b981':'#ef4444'};flex-shrink:0;margin-top:3px"></span>
      <div style="flex:1;min-width:0">
        <p style="font-size:11.5px;font-weight:600;color:#0f172a;margin-bottom:3px">${escapeHtml(vendor.name)}</p>
        <textarea class="vedit" rows="2" data-persist="comment:${rowId}">${escapeHtml(vendor.comment || '')}</textarea>
      </div>
      <span style="font-size:12px;font-weight:600;color:${vendor.variance<0?'#10b981':'#ef4444'};flex-shrink:0;margin-top:2px;min-width:48px;text-align:right">${fmtK(vendor.variance)}</span>
      <button class="del-btn" data-del-row="${rowId}"><i class="ti ti-trash"></i></button>
    </div>`;
  }

  function renderAdditionalComments(id){
    return [0,1,2].map(i => `<div class="comment-row" id="${id}-${i}-row"><textarea class="vedit" rows="2" data-persist="comment:${id}-${i}" placeholder="Additional comment..."></textarea><button class="del-btn" data-del-row="${id}-${i}"><i class="ti ti-trash"></i></button></div>`).join('') +
      `<div class="inline-add"><input class="add-comment-input" data-add-input="${id}" placeholder="Add comment row..." /><button class="mini-btn" data-add-comment="${id}"><i class="ti ti-plus"></i></button></div>`;
  }

  function renderTE(model){
    const headers = model.te.headers;
    const firstMonthIdx = 2;
    const lastMonthIdx = headers.length - 2;
    let h = `<section class="sec" id="sec-te"><div class="sec-hdr"><span>Travel & Expense</span><span class="sec-tag">Employee and vendor detail</span></div><div class="tbl-outer"><table><thead><tr>`;
    headers.forEach((hdr, idx) => h += `<th class="${idx===firstMonthIdx?'te-q1':''} ${idx===lastMonthIdx?'te-q2':''} ${idx>=1?'te-center':''}">${escapeHtml(hdr)}</th>`);
    h += '</tr></thead><tbody>';
    model.te.rows.forEach(row => {
      h += `<tr><td>${escapeHtml(row.employee)}</td><td class="te-center">${escapeHtml(row.vendor)}</td>`;
      row.values.forEach((n, idx) => h += `<td class="te-center ${idx===0?'te-q1':''} ${idx===row.values.length-1?'te-q2':''}">${fmtK(n)}</td>`);
      h += `<td class="te-center">${fmtK(row.grandTotal)}</td></tr>`;
    });
    h += `<tr class="tr-exp"><td>${escapeHtml(model.te.totalRow.employee)}</td><td></td>`;
    model.te.totalRow.values.forEach((n, idx) => h += `<td class="te-center ${idx===0?'te-qt1':''} ${idx===model.te.totalRow.values.length-1?'te-qt2':''}">${fmtK(n)}</td>`);
    h += `<td class="te-center te-grand">${fmtK(model.te.totalRow.grandTotal)}</td></tr></tbody></table></div></section>`;
    return h;
  }

  function renderHC(model){
    const m = model.hc.movementCounts;
    const variance = model.hc.salaryAccrued.workTotal - model.hc.salaryAccrued.planTotal;
    return `<section class="sec" id="sec-hc">
      <div class="sec-hdr"><span>Headcount Cost</span><span class="sec-tag">Salary Accrued + movement</span></div>
      <div class="hc-grid">
        <div class="hc-card hc-card-wide">
          <div class="hc-summary-grid">
            <div class="hc-stat"><div class="kpi-label">Plan Total</div><div class="kpi-val kpi-neu">${fmtK(model.hc.salaryAccrued.planTotal)}</div></div>
            <div class="hc-stat"><div class="kpi-label">Working Total</div><div class="kpi-val ${variance<0?'kpi-fav':'kpi-unfav'}">${fmtK(model.hc.salaryAccrued.workTotal)}</div></div>
            <div class="hc-stat"><div class="kpi-label">Variance</div><div class="kpi-val ${variance<0?'kpi-fav':variance>0?'kpi-unfav':'kpi-neu'}">${fmtK(variance)}</div><div class="hc-badge-wrap">${varianceBadge(variance)}</div></div>
          </div>
          <div class="mini-kpi hc-quarter-grid">${model.hc.salaryAccrued.q.map((n,i)=>`<div><div class="k">Q${i+1}</div><div class="v">Plan ${fmtK(n)}</div><div class="v2">Working ${fmtK(model.hc.salaryAccrued.qWork[i])}</div></div>`).join('')}</div>
        </div>
      </div>
      <div class="sublbl">HC movement</div>
      <div class="tbl-wrap hc-move-wrap"><table class="hc-move-table"><thead><tr><th>Metric</th><th class="yw">Plan</th><th class="te-q2">Working</th><th class="yv">Var</th></tr></thead><tbody>
        ${hcRow('Active Employees', m.activePlan, m.activeWork)}
        ${hcRow('TBH Roles', m.tbhPlan, m.tbhWork)}
        ${hcRow('New Hires (not in plan)', 0, m.newHires)}
        ${hcRow('Ending HC', m.endingPlan, m.endingWork, true)}
      </tbody></table></div>
      <div class="sublbl">Employee commentary</div>
      <div>${model.hc.topVarianceEmployees.map((r,i)=>`<div class="hcrow" id="hc-${i}-row"><span style="width:8px;height:8px;border-radius:50%;background:${r.variance<0?'#10b981':'#ef4444'};flex-shrink:0;margin-top:3px"></span><div style="flex:1"><p style="font-size:11.5px;font-weight:600;color:#0f172a;margin-bottom:3px">${escapeHtml(r.name)}</p><textarea class="hc-edit" rows="2" data-persist="comment:hc-${i}">${escapeHtml(r.comment)}</textarea></div><span style="font-size:12px;font-weight:600;color:${r.variance<0?'#10b981':'#ef4444'};min-width:48px;text-align:right">${fmtK(r.variance)}</span><button class="del-btn" data-del-row="hc-${i}"><i class="ti ti-trash"></i></button></div>`).join('')}</div>
    </section>`;
  }

  function hcRow(label, plan, work, highlight){
    const variance = work - plan;
    return `<tr class="${highlight?'tr-exp':''}"><td>${escapeHtml(label)}</td><td class="yw">${plan}</td><td class="te-q2">${work}</td><td class="yv ${varClass(variance)}">${variance}</td></tr>`;
  }

  function renderActions(model){
    return `<section class="sec" id="sec-actions"><div class="sec-hdr"><span>Follow-up Actions</span><span id="actCtr" class="sec-tag">0 of 6 completed</span></div><div class="act-box" id="actList">${model.actions.map((a,i)=>`<div class="act-item" id="act-${i}"><input type="checkbox" class="act-cb" data-act-cb="act-${i}"><textarea class="act-text" rows="1" data-persist="action:act-${i}">${escapeHtml(a)}</textarea><button class="del-btn" data-del-row="act-${i}"><i class="ti ti-trash"></i></button></div>`).join('')}</div><button class="add-act" id="add-act"><i class="ti ti-plus"></i> Add action</button></section>`;
  }

  function bindInteractive(model){
    document.querySelectorAll('[data-del-row]').forEach(btn => btn.addEventListener('click', () => { const id = btn.dataset.delRow; const row = document.getElementById(id + '-row') || document.getElementById(id); if(row) row.classList.add('hidden'); saveState(); }));
    document.querySelectorAll('[data-del-block]').forEach(btn => btn.addEventListener('click', () => { const id = btn.dataset.delBlock; const row = document.getElementById(id + '-wrap') || document.getElementById(id + '-wrap'.replace('blk-','')); if(row) row.classList.add('hidden'); saveState(); }));
    document.querySelectorAll('[data-add-comment]').forEach(btn => btn.addEventListener('click', () => addCommentRow(btn.dataset.addComment)));
    document.getElementById('add-act').addEventListener('click', addAction);
    document.querySelectorAll('[data-act-cb]').forEach(cb => cb.addEventListener('change', saveState));
    document.querySelectorAll('[data-persist]').forEach(el => el.addEventListener('input', () => { autoResize(el); saveState(); }));
    updateActionCounter();
    document.querySelectorAll('textarea').forEach(autoResize);
    window.addEventListener('scroll', scrollSpy, { passive:true });
  }

  function addCommentRow(blockId){
    const input = document.querySelector(`[data-add-input="${blockId}"]`);
    const text = input ? input.value.trim() : '';
    const rowId = slug(blockId + '-' + Date.now());
    const row = document.createElement('div');
    row.className = 'comment-row';
    row.id = rowId + '-row';
    row.innerHTML = `<textarea class="vedit" rows="2" data-persist="comment:${rowId}">${escapeHtml(text)}</textarea><button class="del-btn" data-del-row="${rowId}"><i class="ti ti-trash"></i></button>`;
    const addWrap = input.closest('.inline-add');
    addWrap.parentNode.insertBefore(row, addWrap);
    row.querySelector('[data-del-row]').addEventListener('click', () => { row.classList.add('hidden'); saveState(); });
    row.querySelector('[data-persist]').addEventListener('input', e => { autoResize(e.target); saveState(); });
    autoResize(row.querySelector('textarea'));
    if(input) input.value = '';
    saveState();
  }

  function addAction(){
    const list = document.getElementById('actList');
    const id = 'act-' + Date.now();
    const div = document.createElement('div');
    div.className = 'act-item';
    div.id = id;
    div.innerHTML = `<input type="checkbox" class="act-cb" data-act-cb="${id}"><textarea class="act-text" rows="1" data-persist="action:${id}" placeholder="New action item..."></textarea><button class="del-btn" data-del-row="${id}"><i class="ti ti-trash"></i></button>`;
    list.appendChild(div);
    div.querySelector('[data-act-cb]').addEventListener('change', saveState);
    div.querySelector('[data-del-row]').addEventListener('click', () => { div.classList.add('hidden'); saveState(); updateActionCounter(); });
    div.querySelector('[data-persist]').addEventListener('input', e => { autoResize(e.target); saveState(); });
    autoResize(div.querySelector('textarea'));
    updateActionCounter();
    saveState();
  }

  function updateActionCounter(){
    const items = Array.from(document.querySelectorAll('.act-item')).filter(el => !el.classList.contains('hidden'));
    const done = items.filter(el => el.querySelector('.act-cb').checked).length;
    const ctr = document.getElementById('actCtr');
    if(ctr) ctr.textContent = `${done} of ${items.length} completed`;
  }

  function autoResize(el){ if(!el || el.tagName !== 'TEXTAREA') return; el.style.height='auto'; el.style.height = el.scrollHeight + 'px'; }

  function saveState(){
    if(!state.model) return;
    const key = storageKey();
    const payload = {
      comments: {},
      actions: {},
      hidden: []
    };
    document.querySelectorAll('[data-persist]').forEach(el => payload.comments[el.dataset.persist] = el.value);
    document.querySelectorAll('[data-act-cb]').forEach(cb => payload.actions[cb.dataset.actCb] = cb.checked);
    document.querySelectorAll('.hidden[id]').forEach(el => payload.hidden.push(el.id));
    localStorage.setItem(key, JSON.stringify(payload));
    updateActionCounter();
    toast('Board saved');
  }

  function restoreSavedState(){
    const raw = localStorage.getItem(storageKey());
    if(!raw) return;
    try{
      const payload = JSON.parse(raw);
      Object.entries(payload.comments || {}).forEach(([k,v]) => {
        const el = document.querySelector(`[data-persist="${cssEscape(k)}"]`);
        if(el){ el.value = v; autoResize(el); }
      });
      Object.entries(payload.actions || {}).forEach(([k,v]) => {
        const cb = document.querySelector(`[data-act-cb="${cssEscape(k)}"]`);
        if(cb) cb.checked = !!v;
      });
      (payload.hidden || []).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
      });
      updateActionCounter();
    }catch(err){ console.warn(err); }
  }

  function storageKey(){
    return 'bva:' + slug(state.model.meta.badgeLabel);
  }

  function downloadHtml(){
    if(!state.model){ toast('Build a dashboard first'); return; }
    saveState();
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.hidden, .del-btn, .del-block, .add-act, .mini-btn, .ghost-btn, .topbar-actions, #save-nav, #download-nav').forEach(el => el.remove());
    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type:'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bva_${slug(state.model.meta.dashboardCode)}_${slug(state.model.meta.fyToken)}_${slug(state.model.meta.monthToken)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function navTo(sectionId, el){
    const target = document.getElementById(sectionId);
    if(!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top, behavior:'smooth' });
    document.querySelectorAll('aside nav ul li[data-nav]').forEach(li => li.classList.remove('active'));
    if(el) el.classList.add('active');
  }

  function scrollSpy(){
    const sections = ['sec-overview','sec-qplan','sec-qfcst','sec-fyplan','sec-fyfcst','sec-te','sec-hc','sec-actions'];
    const navItems = document.querySelectorAll('aside nav ul li[data-nav]');
    const scrollY = window.scrollY + 80;
    let current = 0;
    sections.forEach((id, i) => { const el = document.getElementById(id); if(el && el.offsetTop <= scrollY) current = i; });
    navItems.forEach(li => li.classList.remove('active'));
    if(navItems[current]) navItems[current].classList.add('active');
  }

  function decodeHtmlEntities(str){
    const ta = document.createElement('textarea');
    ta.innerHTML = str;
    return ta.value;
  }

  function parseEmbeddedJson(node){
    const raw = node ? String(node.textContent || '').trim() : '';
    if(!raw) return null;
    try{ return JSON.parse(raw); }catch(e){}
    try{ return JSON.parse(decodeHtmlEntities(raw)); }catch(e){}
    return null;
  }

  function destroyChart(id){
    if(chartRefs[id]){
      try{ chartRefs[id].destroy(); }catch(e){}
      delete chartRefs[id];
    }
  }

  function renderCharts(model){
    renderTrendChart(model.year.trend);
    ['sec-qplan','sec-qfcst','sec-fyplan','sec-fyfcst'].forEach(id => {
      const node = document.getElementById(id + '-wf-data');
      const data = parseEmbeddedJson(node);
      if(!data) return;
      const padded = waterfallBounds(data.baseStart, data.vars, data.workingEnd);
      buildWF(id + '-wf', data.labels, data.baseStart, data.vars, data.workingEnd, padded.min, padded.max);
    });
  }

  function waterfallBounds(base, vars, end){
    let run = base;
    let min = Math.min(base, end), max = Math.max(base, end);
    vars.forEach(v => { run += v; min = Math.min(min, run); max = Math.max(max, run); });
    const pad = Math.max(50000, Math.ceil((max - min) * 0.1 / 50000) * 50000 || 50000);
    return { min: Math.floor((min - pad) / 50000) * 50000, max: Math.ceil((max + pad) / 50000) * 50000 };
  }

  function buildWF(canvasId, labels, baseVal, varsArr, endVal, yMin, yMax) {
    var bases=[], bars=[], bgs=[], run=baseVal;
    bases.push(0); bars.push(baseVal); bgs.push('#3b82f6');
    varsArr.forEach(function(v) {
      bases.push(v < 0 ? run + v : run);
      bars.push(Math.abs(v));
      bgs.push(v < 0 ? '#10b981' : '#ef4444');
      run += v;
    });
    bases.push(0); bars.push(endVal); bgs.push('#3b82f6');
    var canvas = document.getElementById(canvasId); if (!canvas) return;
    destroyChart(canvasId);
    chartRefs[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { data: bases, backgroundColor: 'rgba(0,0,0,0)', borderWidth: 0, datalabels: { display: false } },
          { data: bars, backgroundColor: bgs, borderWidth: 0, borderRadius: 3,
            datalabels: {
              display: true, anchor: 'end', align: 'end', offset: 2,
              color: '#475569', font: { size: 9.5, weight: '600' },
              formatter: function(v, ctx) {
                var i = ctx.dataIndex;
                if (i === 0 || i === bars.length - 1) return '$' + Math.round((bases[i] + v) / 1000) + 'K';
                var o = varsArr[i - 1];
                return (o > 0 ? '+' : '-') + '$' + Math.round(Math.abs(o) / 1000) + 'K';
              }
            }
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, layout: { padding: { top: 32 } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9.5 }, color: '#64748b', autoSkip: false, maxRotation: 20 } },
          y: { stacked: true, min: yMin, max: yMax, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#64748b', callback: function(v) { return '$' + (v/1000).toFixed(0) + 'K'; } } }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

  function renderTrendChart(trend){
    const canvas = document.getElementById('trendC');
    if(!canvas) return;
    const allVals = [...trend.working, ...trend.plan].filter(n => Number.isFinite(n));
    const min = allVals.length ? Math.floor((Math.min(...allVals) - 50000)/50000)*50000 : 0;
    const max = allVals.length ? Math.ceil((Math.max(...allVals) + 50000)/50000)*50000 : 100000;
    destroyChart('trendC');
    chartRefs['trendC'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          { label: 'Working', data: trend.working, borderColor: '#10b981', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#10b981', tension: 0.3, datalabels: { display: false } },
          { label: 'Plan', data: trend.plan, borderColor: '#3b82f6', borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#3b82f6', borderDash: [5,4], tension: 0.3, datalabels: { display: false } }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b' } },
          y: { min, max, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#64748b', callback: function(v) { return '$' + (v/1000).toFixed(0) + 'K'; } } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': $' + Math.round(c.raw/1000) + 'K'; } } } }
      }
    });
  }

  function cleanLabel(label){ return String(label||'').replace(/^Total\s+/,''); }
  function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function escapeHtml(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function cssEscape(str){ return String(str).replace(/"/g,'\\"'); }
})();
