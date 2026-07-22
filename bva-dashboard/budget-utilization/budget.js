/*
 * Budget Utilization — self-contained view opened from the parent BvA dashboard.
 *
 * Data contract:
 *   localStorage["bva:budget-utilization"] = JSON.stringify({
 *     meta: { dashboardCode, fyToken, monthToken, badgeLabel },
 *     opex: {
 *       meta: { businessUnit, monthToken, yearToken, monthRaw, label },
 *       rows: [[...], [...], ...]   // raw sheet_to_json(ws, { header: 1 }) output
 *     },
 *     savedAt: <epoch ms>
 *   })
 *
 * No globals or app.js hooks from the parent board are read — everything the view
 * needs comes from that single localStorage key.
 *
 * ---------------------------------------------------------------------------
 * Expected layout of opex.rows (0-indexed array of arrays, exactly what
 * XLSX.utils.sheet_to_json(ws, { header: 1 }) produces). This is what
 * IT_OPEXPLAN_Jun26.xlsx (and siblings such as ACCOUNTING_/FPA_OPEXPLAN_*.xlsx)
 * must match:
 *
 *   rows[0]  -> quarter header row   (col 0 blank, col 1 "Total", cols 3+ carry
 *                merged quarter labels like "Q1 27"; not parsed directly, only
 *                used implicitly via the fixed fiscal-month groupings below)
 *   rows[1]  -> month header row     (col 0 blank, col 1 "Total", cols 3+ carry
 *                merged month labels like "Feb 26" / "Jan 27"; forward-filled
 *                across merged cells)
 *   rows[2]  -> metric header row    (col 1 "<FY token> Plan", col 2 "Actual",
 *                then repeating "<FY token> Plan" / "Actual" per month column
 *                pair — future months may only have a "Plan" column)
 *   rows[3+] -> data rows:
 *     col 0  = row label (string)
 *       - "Expense"                → business-unit grand total row (may appear
 *                                     anywhere in the sheet, not just first/last)
 *       - "Total <Category Name>"  → an L2 category row. The category name is
 *                                     the label with the leading "Total" and any
 *                                     repeated whitespace stripped.
 *       - anything else            → an optional vendor-level row nested under
 *                                     the most recently seen category row (only
 *                                     present in feeds that break spend out by
 *                                     vendor; plain files like IT_OPEXPLAN_Jun26
 *                                     have none, so vendor drill-down is simply
 *                                     hidden for those categories)
 *     col 1  = Total <FY token> Plan (full fiscal-year plan) — NOT trusted
 *                                     directly; recomputed as the sum of the 12
 *                                     monthly Plan columns instead.
 *     col 2  = Total Actual          — NOT trusted directly either, since this
 *                                     raw cell has been observed to include
 *                                     stray actuals recorded for months after
 *                                     the cutoff. Recomputed from only the
 *                                     monthly Actual columns through the
 *                                     cutoff month (opex.meta.monthToken).
 *     col 3+ = one Plan column per fiscal month (Feb -> Jan, fiscal year
 *                                     starting in February), plus a matching
 *                                     Actual column for months that have
 *                                     actuals recorded (usually only through/
 *                                     near the cutoff month — any stray Actual
 *                                     values found in later months are ignored
 *                                     by design, not summed).
 *
 * Fiscal quarters used throughout: Q1 = Feb/Mar/Apr, Q2 = May/Jun/Jul,
 * Q3 = Aug/Sep/Oct, Q4 = Nov/Dec/Jan.
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  var STORAGE_KEY = "bva:budget-utilization";
  var GRAND_TOTAL_LABEL = "All categories (total expense)";
  var FISCAL_MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  var QUARTER_DEFS = [
    { key: "Q1", months: [0, 1, 2] },
    { key: "Q2", months: [3, 4, 5] },
    { key: "Q3", months: [6, 7, 8] },
    { key: "Q4", months: [9, 10, 11] }
  ];

  // ---------------------------------------------------------------------
  // Load + validate payload
  // ---------------------------------------------------------------------

  function loadPayload() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Budget Utilization: could not parse localStorage payload.", e);
      return null;
    }
    if (!parsed || !parsed.opex || !parsed.opex.rows || !parsed.opex.rows.length) return null;
    return parsed;
  }

  // ---------------------------------------------------------------------
  // Raw-row parsing
  // ---------------------------------------------------------------------

  function ffill(arr) {
    var out = [];
    var last = null;
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (v !== null && v !== undefined && v !== "") last = v;
      out.push(last);
    }
    return out;
  }

  function monthAbbrev(token) {
    if (token === null || token === undefined) return null;
    return String(token).trim().slice(0, 3);
  }

  function cleanVendorName(labelStr) {
    if (/^no vendor/i.test(labelStr)) return "No vendor assigned";
    var v = labelStr.replace(/^\d+\s*-\s*/, "").trim();
    if (v === "") return "No vendor assigned";
    return v;
  }

  function parseOpexRows(rows, cutoffMonthToken) {
    if (!rows || rows.length < 4) return null;

    var monthHeaderRow = ffill(rows[1] || []);
    var metricHeaderRow = rows[2] || [];
    var maxCol = Math.max(monthHeaderRow.length, metricHeaderRow.length);

    var colInfo = [];
    for (var c = 1; c < maxCol; c++) {
      var monthTok = monthAbbrev(monthHeaderRow[c]);
      var monthIdx = FISCAL_MONTHS.indexOf(monthTok);
      if (monthIdx < 0) continue;
      var metricTok = metricHeaderRow[c];
      var metric = null;
      if (typeof metricTok === "string") {
        var low = metricTok.toLowerCase();
        if (low.indexOf("plan") !== -1) metric = "plan";
        else if (low === "actual") metric = "actual";
      }
      if (!metric) continue;
      colInfo.push({ c: c, monthIdx: monthIdx, metric: metric });
    }

    var cutoffIdx = FISCAL_MONTHS.indexOf(cutoffMonthToken);
    if (cutoffIdx < 0) cutoffIdx = FISCAL_MONTHS.length - 1; // fail open: treat everything as elapsed

    var elapsedSet = {};
    for (var m = 0; m <= cutoffIdx; m++) elapsedSet[m] = true;

    function sumOrNull(rowVals, monthIdxSet, metric) {
      var any = false;
      var sum = 0;
      for (var i = 0; i < colInfo.length; i++) {
        var info = colInfo[i];
        if (info.metric !== metric) continue;
        if (!monthIdxSet[info.monthIdx]) continue;
        var v = rowVals[info.c];
        if (typeof v === "number" && !isNaN(v)) {
          sum += v;
          any = true;
        }
      }
      return any ? sum : null;
    }

    var allMonthsSet = {};
    for (var am = 0; am < FISCAL_MONTHS.length; am++) allMonthsSet[am] = true;

    function computePeriods(rowVals) {
      var periods = {};
      periods.total = {
        plan: sumOrNull(rowVals, allMonthsSet, "plan"),
        actual: sumOrNull(rowVals, elapsedSet, "actual"),
        expected: sumOrNull(rowVals, elapsedSet, "plan")
      };
      QUARTER_DEFS.forEach(function (q) {
        var qSet = {};
        var qElapsed = {};
        var hasElapsed = false;
        q.months.forEach(function (mi) {
          qSet[mi] = true;
          if (elapsedSet[mi]) { qElapsed[mi] = true; hasElapsed = true; }
        });
        periods[q.key] = {
          plan: sumOrNull(rowVals, qSet, "plan"),
          actual: hasElapsed ? sumOrNull(rowVals, qElapsed, "actual") : null,
          expected: hasElapsed ? sumOrNull(rowVals, qElapsed, "plan") : 0
        };
      });
      return periods;
    }

    var grand = null;
    var categories = {};
    var currentCat = null;

    for (var r = 3; r < rows.length; r++) {
      var rowVals = rows[r];
      if (!rowVals) continue;
      var label = rowVals[0];
      if (label === null || label === undefined || label === "") continue;
      var labelStr = String(label).trim();

      if (labelStr === "Expense") {
        grand = computePeriods(rowVals);
        continue;
      }
      if (/^Total\b/.test(labelStr)) {
        var name = labelStr.replace(/^Total\s+/, "").replace(/\s+/g, " ").trim();
        currentCat = name;
        categories[name] = computePeriods(rowVals);
        categories[name].vendors = {};
        continue;
      }
      if (currentCat) {
        var vname = cleanVendorName(labelStr);
        categories[currentCat].vendors[vname] = computePeriods(rowVals);
      }
    }

    if (!grand) {
      // Fallback: no explicit "Expense" row found — derive the grand total by
      // summing every category so the view still has a top-level number.
      grand = { total: { plan: null, actual: null, expected: null } };
      QUARTER_DEFS.forEach(function (q) { grand[q.key] = { plan: null, actual: null, expected: null }; });
      var periodKeys = ["total", "Q1", "Q2", "Q3", "Q4"];
      var catNames = Object.keys(categories);
      periodKeys.forEach(function (pk) {
        ["plan", "actual", "expected"].forEach(function (field) {
          var any = false, sum = 0;
          catNames.forEach(function (cn) {
            var v = categories[cn][pk][field];
            if (typeof v === "number") { sum += v; any = true; }
          });
          grand[pk][field] = any ? sum : null;
        });
      });
    }

    return { grandTotal: grand, categories: categories };
  }

  function fcstLabel(cutoffIdx) {
    var completed = cutoffIdx;
    var remaining = 12 - completed;
    return completed === 0 ? String(remaining) : (completed + "+" + remaining);
  }

  // ---------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------

  function fmtK(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return "$" + (v / 1000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "K";
  }

  function computeBarStats(d) {
    var actual = d.actual === null || d.actual === undefined ? 0 : d.actual;
    var pct = d.plan > 0 ? (actual / d.plan) * 100 : 0;
    var expPct = (d.expected !== null && d.expected !== undefined && d.plan > 0)
      ? Math.min(Math.max((d.expected / d.plan) * 100, 0), 100)
      : null;
    return { actual: actual, pct: pct, expPct: expPct };
  }

  // ---------------------------------------------------------------------
  // Bar rendering
  // ---------------------------------------------------------------------

  function paintTrack(track, d) {
    track.innerHTML = "";

    if (d.plan === null || d.plan === undefined) {
      var na = document.createElement("div");
      na.className = "bu-seg bu-seg-na";
      na.style.left = "0"; na.style.width = "100%";
      na.textContent = "No budget";
      track.appendChild(na);
      return;
    }

    var stats = computeBarStats(d);
    var actual = stats.actual, pct = stats.pct, expPct = stats.expPct;

    if (actual < 0) {
      var w = Math.max(Math.min(Math.abs(pct), 100), 8);
      var creditSeg = document.createElement("div");
      creditSeg.className = "bu-seg bu-seg-green";
      creditSeg.style.left = "0";
      creditSeg.style.width = w + "%";
      track.appendChild(creditSeg);
      return;
    }

    if (expPct !== null) {
      var band = document.createElement("div");
      band.className = "bu-bar-band";
      band.style.width = expPct + "%";
      track.appendChild(band);
      var marker = document.createElement("div");
      marker.className = "bu-bar-marker";
      marker.style.left = expPct + "%";
      track.appendChild(marker);
    }

    var actClamped = Math.max(pct, 0);
    var blue, purple;
    var red = Math.max(0, actClamped - 100);
    if (expPct === null) {
      blue = Math.min(actClamped, 100);
      purple = 0;
    } else {
      blue = Math.min(actClamped, expPct);
      purple = Math.max(0, Math.min(actClamped, 100) - expPct);
    }

    if (blue > 0) {
      var s1 = document.createElement("div");
      s1.className = "bu-seg bu-seg-blue";
      s1.style.left = "0%"; s1.style.width = blue + "%";
      track.appendChild(s1);
    }
    if (purple > 0) {
      var s2 = document.createElement("div");
      s2.className = "bu-seg bu-seg-purple";
      s2.style.left = blue + "%"; s2.style.width = purple + "%";
      track.appendChild(s2);
    }
    if (red > 0) {
      var s3 = document.createElement("div");
      s3.className = "bu-seg bu-seg-red";
      s3.style.left = (blue + purple) + "%"; s3.style.width = red + "%";
      track.appendChild(s3);
    }
  }

  function fillSubLabel(container, d) {
    container.innerHTML = "";
    if (d.plan === null || d.plan === undefined) return;

    var stats = computeBarStats(d);
    var actual = stats.actual, pct = stats.pct, expPct = stats.expPct;

    var mainSpan = document.createElement("span");
    mainSpan.textContent = pct.toFixed(1) + "%";
    container.appendChild(mainSpan);

    if (actual < 0) {
      mainSpan.style.color = "#16a34a";
      return;
    }

    if (pct > 100) {
      var overSpan = document.createElement("span");
      overSpan.textContent = "+" + (pct - 100).toFixed(1) + "% over budget";
      overSpan.style.color = "#e11d48";
      container.appendChild(overSpan);
    } else if (expPct !== null && pct > expPct + 0.05) {
      var paceSpan = document.createElement("span");
      paceSpan.textContent = "+" + (pct - expPct).toFixed(1) + "% ahead of pace";
      paceSpan.style.color = "#7c3aed";
      container.appendChild(paceSpan);
    }
  }

  // ---------------------------------------------------------------------
  // App bootstrap
  // ---------------------------------------------------------------------

  function initEmptyState() {
    document.getElementById("buEmpty").style.display = "flex";
    document.getElementById("buApp").style.display = "none";
  }

  function initApp(payload) {
    var meta = payload.meta || {};
    var opexMeta = (payload.opex && payload.opex.meta) || {};
    var rows = payload.opex.rows;

    var cutoffToken = opexMeta.monthToken || meta.monthToken;
    var parsed = parseOpexRows(rows, cutoffToken);
    if (!parsed || !Object.keys(parsed.categories).length) {
      initEmptyState();
      return;
    }

    document.getElementById("buEmpty").style.display = "none";
    document.getElementById("buApp").style.display = "block";

    var dashboardCode = meta.dashboardCode || opexMeta.businessUnit || "BU";
    var fyToken = meta.fyToken || "";
    var commentsKey = "bva:budget-utilization:comments:" + dashboardCode;

    document.getElementById("buTag").textContent = dashboardCode;
    var sourceBits = [];
    if (opexMeta.label) sourceBits.push(opexMeta.label);
    if (opexMeta.monthRaw) sourceBits.push(opexMeta.monthRaw);
    document.getElementById("buSource").textContent = sourceBits.join(" — ");

    var cutoffIdx = FISCAL_MONTHS.indexOf(cutoffToken);
    if (cutoffIdx < 0) cutoffIdx = FISCAL_MONTHS.length - 1;

    document.getElementById("asOfMonth").textContent =
      "Actuals through " + (opexMeta.monthToken || cutoffToken || "") + " " + (opexMeta.yearToken || "");
    var badgeLabel = meta.badgeLabel && meta.badgeLabel !== "..." ? meta.badgeLabel : ("FCST " + fcstLabel(cutoffIdx));
    document.getElementById("asOfFcst").textContent = badgeLabel;

    var data = parsed;
    var categoryKeys = Object.keys(data.categories);
    var periods = [
      ["total", fyToken ? ("Total " + fyToken) : "Total"],
      ["Q1", "Q1"],
      ["Q2", "Q2"],
      ["Q3", "Q3"],
      ["Q4", "Q4"]
    ];

    // ---- comments store ----
    var comments = {};
    try {
      comments = JSON.parse(localStorage.getItem(commentsKey) || "{}");
    } catch (e) { comments = {}; }

    var toastTimer = null;

    function persistComments() {
      try {
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        return true;
      } catch (e) {
        return false;
      }
    }

    function showToast(msg) {
      var toast = document.getElementById("saveToast");
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("show");
      }, 1800);
    }

    function getComment(key) { return comments[key] || ""; }

    function setComment(key, val) {
      if (val) comments[key] = val;
      else delete comments[key];
      persistComments();
    }

    function saveComments() {
      if (persistComments()) showToast("Comments saved");
      else showToast("Could not save comments");
    }

    function backToBoard() {
      saveComments();
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
          window.close();
          setTimeout(function () {
            if (!window.closed) window.location.href = "../index.html";
          }, 80);
          return;
        }
      } catch (e) {}
      window.location.href = "../index.html";
    }

    function getCatData(name, period) {
      return name === GRAND_TOTAL_LABEL ? data.grandTotal[period] : data.categories[name][period];
    }

    var catSelect = document.getElementById("catSelect");
    var periodSelect = document.getElementById("periodSelect");
    var periodSelectAll = document.getElementById("periodSelectAll");
    var allRows = document.getElementById("allRows");
    var toggleBtn = document.getElementById("toggleBtn");
    var singleView = document.getElementById("singleView");
    var allView = document.getElementById("allView");
    var vendorToggleBtn = document.getElementById("vendorToggleBtn");
    var singleVendorRows = document.getElementById("singleVendorRows");
    var singleComment = document.getElementById("singleComment");
    var saveBtn = document.getElementById("saveBtn");
    var backBtn = document.getElementById("backBtn");

    [GRAND_TOTAL_LABEL].concat(categoryKeys).forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      catSelect.appendChild(opt);
    });

    [periodSelect, periodSelectAll].forEach(function (sel) {
      periods.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p[0]; opt.textContent = p[1];
        sel.appendChild(opt);
      });
    });

    function hasVendors(catName) {
      return !!(data.categories[catName] && Object.keys(data.categories[catName].vendors).length);
    }

    function renderVendorRows(container, vendors, period, catName) {
      container.innerHTML = "";

      var searchWrap = document.createElement("div");
      searchWrap.className = "bu-vendor-search-wrap";
      var searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "bu-input bu-sm";
      searchInput.placeholder = "Search vendor...";
      searchWrap.appendChild(searchInput);
      container.appendChild(searchWrap);

      var rowsWrap = document.createElement("div");
      container.appendChild(rowsWrap);

      var entries = Object.keys(vendors).map(function (k) { return [k, vendors[k]]; });
      entries.sort(function (a, b) {
        var av = a[1][period].actual || 0;
        var bv = b[1][period].actual || 0;
        return bv - av;
      });

      var rowRefs = [];
      entries.forEach(function (entry) {
        var vname = entry[0];
        var d = entry[1][period];
        var key = "vendor::" + catName + "::" + vname + "::" + period;

        var row = document.createElement("div");
        row.className = "bu-vendor-row";

        var nameEl = document.createElement("span");
        nameEl.className = "bu-vendor-name";
        nameEl.textContent = vname;
        row.appendChild(nameEl);

        var trackWrap = document.createElement("div");
        trackWrap.className = "bu-track-wrap bu-track-wrap-vendor";
        var track = document.createElement("div");
        track.className = "bu-track bu-track-vendor";
        paintTrack(track, d);
        trackWrap.appendChild(track);
        var sub = document.createElement("div");
        sub.className = "bu-track-sub bu-sub-vendor";
        fillSubLabel(sub, d);
        trackWrap.appendChild(sub);
        row.appendChild(trackWrap);

        var valuesEl = document.createElement("span");
        valuesEl.className = "bu-vendor-values";
        valuesEl.textContent = fmtK(d.actual) + " / " + fmtK(d.plan);
        row.appendChild(valuesEl);

        var commentInput = document.createElement("input");
        commentInput.type = "text";
        commentInput.className = "bu-input bu-sm bu-vendor-comment";
        commentInput.placeholder = "Add a note...";
        commentInput.value = getComment(key);
        commentInput.addEventListener("input", function () { setComment(key, commentInput.value); });
        row.appendChild(commentInput);

        rowsWrap.appendChild(row);
        rowRefs.push({ vname: vname.toLowerCase(), row: row });
      });

      searchInput.addEventListener("input", function () {
        var q = searchInput.value.trim().toLowerCase();
        rowRefs.forEach(function (rr) {
          rr.row.style.display = (q === "" || rr.vname.indexOf(q) !== -1) ? "flex" : "none";
        });
      });
    }

    function render() {
      var name = catSelect.value;
      var period = periodSelect.value;
      var d = getCatData(name, period);
      var track = document.getElementById("gaugeTrack");
      var budgetCell = document.getElementById("cellBudget");
      var actualCell = document.getElementById("cellActual");
      var savingsCell = document.getElementById("cellSavings");
      var footnote = document.getElementById("footnote");

      budgetCell.textContent = fmtK(d.plan);
      actualCell.textContent = fmtK(d.actual);

      var isGrandTotal = name === GRAND_TOTAL_LABEL;
      var showVendorBtn = !isGrandTotal && hasVendors(name);
      vendorToggleBtn.style.display = showVendorBtn ? "inline-block" : "none";
      if (!showVendorBtn) {
        singleVendorRows.style.display = "none";
        vendorToggleBtn.textContent = "Show vendor detail";
      }
      if (singleVendorRows.style.display !== "none" && showVendorBtn) {
        renderVendorRows(singleVendorRows, data.categories[name].vendors, period, name);
      }

      var commentKey = (isGrandTotal ? "grand::" : "cat::" + name + "::") + period;
      singleComment.value = getComment(commentKey);
      singleComment.oninput = function () { setComment(commentKey, singleComment.value); };

      paintTrack(track, d);
      fillSubLabel(document.getElementById("gaugeSub"), d);

      if (d.plan === null || d.plan === undefined) {
        savingsCell.textContent = "—";
        savingsCell.className = "";
        footnote.textContent = "This category has no plan on file for this period.";
        return;
      }

      var actual = d.actual === null ? 0 : d.actual;
      var savings = d.plan - actual;
      var pct = d.plan > 0 ? (actual / d.plan) * 100 : 0;

      savingsCell.textContent = fmtK(savings);
      savingsCell.className = savings < 0 ? "bu-negative" : "bu-positive";

      if (d.actual === null) {
        footnote.textContent = "No actuals booked through the cutoff month for this period.";
      } else if (pct > 100) {
        footnote.textContent = "Actual spend has exceeded the plan for this period.";
      } else if (actual < 0) {
        footnote.textContent = "Net credit/refund recorded this period (actual is negative).";
      } else if (d.expected !== null && d.expected !== undefined && actual > d.expected) {
        footnote.textContent = "Spend is ahead of the expected pace for this period.";
      } else {
        footnote.textContent = "";
      }
    }

    function toggleSingleVendors() {
      var showing = singleVendorRows.style.display !== "none";
      if (showing) {
        singleVendorRows.style.display = "none";
        vendorToggleBtn.textContent = "Show vendor detail";
      } else {
        singleVendorRows.style.display = "block";
        vendorToggleBtn.textContent = "Hide vendor detail";
        renderVendorRows(singleVendorRows, data.categories[catSelect.value].vendors, periodSelect.value, catSelect.value);
      }
    }

    var expandedAllCats = {};

    function renderAll() {
      var period = periodSelectAll.value;
      var order = categoryKeys.concat([GRAND_TOTAL_LABEL]);
      allRows.innerHTML = "";

      order.forEach(function (name) {
        var d = getCatData(name, period);
        var isTotal = name === GRAND_TOTAL_LABEL;

        var row = document.createElement("div");
        row.className = "bu-cat-row" + (isTotal ? " bu-total" : "");

        if (!isTotal && hasVendors(name)) {
          var expandBtn = document.createElement("button");
          expandBtn.className = "bu-expand-btn";
          expandBtn.type = "button";
          expandBtn.textContent = expandedAllCats[name] ? "−" : "+";
          expandBtn.setAttribute("aria-label", "Toggle vendor detail for " + name);
          expandBtn.onclick = function () {
            expandedAllCats[name] = !expandedAllCats[name];
            renderAll();
          };
          row.appendChild(expandBtn);
        } else {
          var spacer = document.createElement("span");
          spacer.className = "bu-expand-spacer";
          row.appendChild(spacer);
        }

        var nameEl = document.createElement("span");
        nameEl.className = "bu-cat-name";
        nameEl.textContent = name;
        row.appendChild(nameEl);

        var trackWrap = document.createElement("div");
        trackWrap.className = "bu-track-wrap bu-track-wrap-cat";
        var track = document.createElement("div");
        track.className = "bu-track bu-track-cat";
        paintTrack(track, d);
        trackWrap.appendChild(track);
        var sub = document.createElement("div");
        sub.className = "bu-track-sub bu-sub-cat";
        fillSubLabel(sub, d);
        trackWrap.appendChild(sub);
        row.appendChild(trackWrap);

        var valuesEl = document.createElement("span");
        valuesEl.className = "bu-cat-values";
        valuesEl.textContent = fmtK(d.actual) + " / " + fmtK(d.plan);
        row.appendChild(valuesEl);

        var commentKey = (isTotal ? "grand::" : "cat::" + name + "::") + period;
        var commentInput = document.createElement("input");
        commentInput.type = "text";
        commentInput.className = "bu-input bu-cat-comment";
        commentInput.placeholder = "Add a note...";
        commentInput.value = getComment(commentKey);
        commentInput.addEventListener("input", function () { setComment(commentKey, commentInput.value); });
        row.appendChild(commentInput);

        allRows.appendChild(row);

        if (!isTotal && expandedAllCats[name] && hasVendors(name)) {
          var vendorWrap = document.createElement("div");
          vendorWrap.className = "bu-vendor-wrap";
          renderVendorRows(vendorWrap, data.categories[name].vendors, period, name);
          allRows.appendChild(vendorWrap);
        }
      });
    }

    function toggleView() {
      var showingAll = allView.style.display !== "none";
      if (showingAll) {
        allView.style.display = "none";
        singleView.style.display = "block";
        toggleBtn.textContent = "View all categories";
      } else {
        singleView.style.display = "none";
        allView.style.display = "block";
        toggleBtn.textContent = "Back to single view";
        renderAll();
      }
    }

    toggleBtn.addEventListener("click", toggleView);
    vendorToggleBtn.addEventListener("click", toggleSingleVendors);
    catSelect.addEventListener("change", render);
    periodSelect.addEventListener("change", render);
    periodSelectAll.addEventListener("change", renderAll);
    if (saveBtn) saveBtn.addEventListener("click", saveComments);
    if (backBtn) backBtn.addEventListener("click", backToBoard);

    render();
  }

  function boot() {
    var payload = loadPayload();
    if (!payload) {
      initEmptyState();
      return;
    }
    try {
      initApp(payload);
    } catch (e) {
      console.error("Budget Utilization: failed to render from payload.", e);
      initEmptyState();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
