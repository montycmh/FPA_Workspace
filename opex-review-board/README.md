# OPEX Review Board — GitHub Pages Standalone

This repo contains a browser-only version of the OPEX Review Board designed for GitHub Pages.

## Recommended repo structure

```
opex-review-board/
├── index.html
├── README.md
├── VALIDATION.md
└── .nojekyll
```

This is the simplest GitHub Pages layout because you can publish directly from the repository root without a build step or backend.

## What the app does

* Runs entirely in the browser
* Accepts one OPEX workbook upload and one GL Transaction Summary workbook upload
* Preserves the current review workflow:
  * new-entry detection
  * reclass / review tagging
  * missing actual detection
  * modal recommendation flow
  * searchable manual Department and GL Account overrides
  * two-section export
* Uses merge-aware reads for workbook parsing
* Always excludes rows where `L2` contains `Comp and Benefits`
* Always renders the board in English

## Supported filename patterns

### OPEX

* `[Tbl]_<class>_OPEX Input <month>.xlsx`
* `Tbl_OPEX_Input_*.xlsx`

### GL

* `GLTransactionSummaryEN*.xlsx`
* Also accepts `GLTransactionSummary*.xlsx` so the current sample file `GLTransactionSummaryMay.xlsx` works during validation

## Publish to GitHub Pages

1. Create a new GitHub repo.
2. Upload the contents of this folder to the repo root.
3. In GitHub, open Settings → Pages.
4. Set the source to Deploy from a branch.
5. Choose the main branch and the root folder.
6. Save.

Your app will publish as a static site with no backend.

## Dependency note

The page uses the SheetJS browser bundle from jsDelivr for client-side `.xlsx` parsing:

* `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js`

If you want a zero-CDN deployment, replace that script tag with a vendored local copy of the same file.

## Business rules preserved

* English-only output
* Exclude `Comp and Benefits`
* Row 1 month headers, row 2 type labels, data starting on row 4
* Merge-aware reads
* `hv(x)` = present only when not null and not zero
* `new_entries` = last actual populated and no prior actual activity
* `missing_actuals` = last actual blank, prior actual activity present, forecast activity present
* Vendor ID numeric-prefix logic
* Related-entity alias matching
* Filter mapping:
  * `Prior`, `New GL`, `Related` → `reclass`
  * `No match` → `review`
  * `Missing` → `missing`
* GL lookup order:
  * `Entity: Name`
  * `Entity (Line)`
* Recommendation logic excludes balance-sheet / clearing-style rows using the source exclusion list
* Department recommendation = most frequent valid department
* GL recommendation = most frequent full GL string
* Tie-breaker preference = last actual month
* Export includes `RECLASSES` first and `MISSING ACCRUALS` second

## Known compromises vs the Python version

1. Browser parsing uses SheetJS instead of `openpyxl` / `pandas`.
2. The page references SheetJS from a CDN by default because this environment cannot vendor the minified library directly.
3. The browser version improves one export detail to align with your stated business rule: missing accrual `Amount TCV` uses the nearest prior actual-month value, not only the immediately previous actual month.
4. The modal disables Apply unless both vendor ID and a full recommendation exist, which is slightly stricter than the current Python HTML behavior and matches your requested rule.

## Suggested next enhancement

If you want this to become fully offline and CDN-free, vendor the SheetJS bundle locally and change the script tag to `./vendor/xlsx.full.min.js`.
