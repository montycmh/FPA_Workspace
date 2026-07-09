# Validation Notes

These counts were validated from the current Python OPEX Review Board generator using the uploaded sample files.

## Accounting — `[Tbl]_5100 - Accounting_OPEX Input MAY.xlsx`

* Last actual month: `May 26`
* Total actionable rows: `18`
* New-side rows: `16`
* Review rows (`No match`): `10`
* Missing rows: `2`
* Vendors without ID: `6`
* Lookup not found: `6`

## FP&A — `[Tbl]_5200 - FPA_OPEX Input MAY.xlsx`

* Last actual month: `May 26`
* Total actionable rows: `4`
* New-side rows: `4`
* Review rows (`No match`): `2`
* Missing rows: `0`
* Vendors without ID: `2`
* Lookup not found: `6`

## Information Technology — `[Tbl]_9300 - Information Technology_OPEX Input MAY.xlsx`

* Last actual month: `May 26`
* Total actionable rows: `10`
* New-side rows: `6`
* Review rows (`No match`): `1`
* Missing rows: `4`
* Vendors without ID: `5`
* Lookup not found: `1`

## Validation scope

This validates the source workflow outputs and counts from the existing Python implementation. The browser app was built to mirror the same detection, tagging, modal recommendation, and export logic in JavaScript.
