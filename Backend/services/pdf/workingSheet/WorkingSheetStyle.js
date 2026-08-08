export const workingSheetStyles = () => `

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
}


/* ===========================
   A4 PAGE
=========================== */

@page {
    size: A4 portrait;
    margin: 10mm;
}


html,
body {
    width: 100%;
    margin: 0;
    padding: 0;
}


body {
    font-size: 11px;
    color: #000;
}


/* ===========================
   CATEGORY PAGE
=========================== */

.category-page {
    width: 100%;

    page-break-inside: avoid;
    break-inside: avoid;

    /*
     * Each category starts on a
     * separate physical page.
     */
    page-break-after: always;
    break-after: page;
}


/*
 * Do not create a page break
 * after the final category.
 */

.category-page:last-child {
    page-break-after: auto;
    break-after: auto;
}


/* ===========================
   HEADER
=========================== */

.header {
    width: 100%;
    text-align: center;
    margin-bottom: 12px;
}


.header h2 {
    font-size: 18px;
    margin-bottom: 4px;
}


.header h3 {
    font-size: 15px;
    margin-bottom: 6px;
}


.header p {
    font-size: 11px;
    line-height: 1.4;
}


/* ===========================
   CLASS TITLE
=========================== */

.class-title {
    width: 100%;

    border: 1.5px solid #000;

    padding: 6px 10px;

    font-weight: bold;
    font-size: 12px;

    margin-bottom: 6px;
}


/* ===========================
   WORKING SHEET TABLE
=========================== */

.working-sheet-table {
    width: 100%;

    border-collapse: collapse;

    /*
     * Allow the browser to use the
     * defined column widths naturally.
     */
    table-layout: auto;

    page-break-inside: avoid;
    break-inside: avoid;
}


.working-sheet-table th,
.working-sheet-table td {
    border: 1px solid #000;

    text-align: center;
    vertical-align: middle;

    padding: 4px;
}


.working-sheet-table th {
    font-weight: bold;
    line-height: 1.1;
}


/*
 * Writing space for officials.
 */

.working-sheet-table tbody td {
    height: 32px;
}


/* ===========================
   COLUMN WIDTHS
=========================== */


/*
 * Lot number
 */

.lot-col {
    width: 42px;
    min-width: 42px;

    text-align: center;
    font-weight: bold;
}


/*
 * Serial number
 */

.sr-col {
    width: 42px;
    min-width: 42px;
}


/*
 * Competitor name
 */

.name-col {
    width: 225px;
    min-width: 225px;

    text-align: left;

    padding-left: 8px;

    white-space: normal;
}


/*
 * YTH / JR / SR
 */

.event-col {
    width: 34px;
    min-width: 34px;
}


/*
 * Snatch and Clean & Jerk attempts
 */

.attempt-col {
    width: 42px;
    min-width: 42px;
}


/*
 * Maximum S / C&J
 */

.maximum-col {
    width: 50px;
    min-width: 50px;
}


/*
 * Total
 */

.total-col {
    width: 58px;
    min-width: 58px;
}


/*
 * Place
 */

.place-col {
    width: 58px;
    min-width: 58px;
}


/* ===========================
   HEADER GROUPS
=========================== */

.event-group,
.snatch-group,
.cj-group,
.maximum-group {
    font-weight: bold;
    text-align: center;
}


/* ===========================
   CHECK MARK
=========================== */

.checkmark {
    font-weight: bold;
    font-size: 12px;
}


/* ===========================
   SIGNATURE SECTION
=========================== */

.signature-row {
    width: 100%;

    display: flex;

    justify-content: space-between;

    align-items: flex-end;

    margin-top: 40px;

    page-break-inside: avoid;
    break-inside: avoid;
}


.signature {
    width: 18%;

    text-align: center;

    font-size: 11px;
}


.signature-line {
    width: 100%;

    border-top: 1px solid #000;

    margin-bottom: 6px;
}


/* ===========================
   PRINT SAFETY
=========================== */

@media print {

    .category-page {
        page-break-inside: avoid;
    }

    .working-sheet-table {
        page-break-inside: avoid;
    }

    .signature-row {
        page-break-inside: avoid;
    }

}
`;