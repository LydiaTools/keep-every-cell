# Method and provenance

The implementation is original and AI-assisted. The job is **explicit structural
review**, not automatic recovery of an author's intent.

Discovery on 2026-10-21 used bounded public Reddit searches and current converter
documentation. A post about PDF-to-Excel failure is not proof this Markdown tool
solves PDF extraction. A public spreadsheet question contains ragged Markdown,
but does not establish that its author wants this product. These are problem
signals, not adoption evidence.

- [Public PDF/Excel question](https://www.reddit.com/r/AIToolBench/comments/1skxg8t/help_me_convert_30_page_pdf_to_excel_sheet_it_is/)
- [Public spreadsheet question with a Markdown table](https://www.reddit.com/r/excel/comments/1qvmz1v/most_effective_way_to_summarise_days_travelled_in/)
- [Inspected web converter](https://thattoolsite.com/markdown-table-to-excel)
- [tablemd source and MIT notice](https://github.com/Aaron-lab-c/tablemd)

The original comparison fixture has three headers but four first-row cells:
`0017`, `Cedar`, `Oak`, `12`. The inspected web converter expanded it to four
columns, retained all four values, and enabled download. This is not described
as data loss or a vulnerability. Keep Every Cell reports the mismatch and blocks
Excel export until a deliberate repair. One possible repair joins Cedar and Oak;
the app does not infer that decision.

The optional CI script pins tablemd 0.1.0's wheel to SHA-256
`bc145b6b0d6182e20b71ee4db5f957e7bae059d18db7a3e177ca2c6f99512ff2`.
Its documented row normalization is compared on that one fixture. No third-party
implementation or interface asset is vendored. Production users need not install
it. No comparison establishes general parser accuracy or a competitor bug.

The workbook writer emits a small uncompressed Office Open XML package: one
worksheet, inline text strings, explicit numeric cells and a frozen header.
There are no formula cells, macros or external links. The test reads actual
generated files with pinned openpyxl; native spreadsheet application behavior
still needs its own acceptance. Numeric conversion is explicit and conservative,
not a claim that decimal values are mathematically exact in a spreadsheet.

Privacy checks observe the synthetic browser workflow after initial asset load
and the offline file entry. No customer data, existing profile or provider key is
used. Website-host request metadata and user-initiated links are separate from
processing file contents. The app has no automatic data persistence or telemetry.
