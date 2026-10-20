# Recorded verification — 2026-10-21
Runtime commit: 09c11661e68a3cf9403172557602ae211a371e55.
Actual CI: https://github.com/LydiaTools/keep-every-cell/actions/runs/39512243293

GitHub-hosted Ubuntu, Node 22, Python 3.12, Playwright 1.62.1, openpyxl 3.1.5.
The job completed successfully. It ran 17 distinct core checks, generated two
original workbooks, read them with openpyxl, executed one pinned tablemd
comparison, and ran the actual browser workflow.

Observed browser results:
- Four cells remain visible against three headers; Excel export is disabled.
- Explicit joining retains Cedar, Oak, the literal pipe, 0017 and the quantity.
- Chosen numeric columns and literal text survive a real workbook download.
- Review JSON records source, types and the explicit before/after join.
- Save .md downloads the current source exactly.
- English/Chinese switching preserves source and chosen types.
- A keyboard-triggered file chooser imports UTF-8; invalid UTF-8 preserves input.
- Opening a new file resets column types to Text.
- No page errors or page-level mobile overflow in the tested workflow.
- Zero additional outbound requests after initial asset load.
- The offline file:// entry works with Chromium in offline mode.

A separate local ZIP/XML inspection of downloaded artifacts checked 0017 as an
inline string, =2+2 as text, the quantity as numeric, no formula nodes, and no
macro or external-link parts. These checks do not constitute native Excel,
Numbers, Safari or screen-reader acceptance, or proof of factual accuracy.

The three README captures are unedited images from this run, on original
synthetic data. There are no virtual arrows or annotation overlays. A yellow
focus ring is the real keyboard-focus style. The source copy, row issue and
post-repair state are actual UI states, not AI-generated product mockups.
Later changes limited to README, this document and PNG copies do not change
the tested app, parser, writer or test scripts.

The optional comparison is one ragged-row example, not a benchmark ranking:
tablemd 0.1.0 normalizes to the three-cell header as documented; this app retains
four and requires review. The inspected web converter retained four by adding
a column and allowed export. No general data-loss or vulnerability claim is made.

External adoption, attributable Stars and revenue are unverified. Test visits
and artifact downloads are not counted as external users.
