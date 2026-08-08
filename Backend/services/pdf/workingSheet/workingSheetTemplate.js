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
    margin: 12mm;
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

    page-break-after: always;
    break-after: page;
}


/*
 * Do not create an unnecessary
 * blank page after the last category.
 */

.category-page:last-child {
    page-break-after: auto;
    break-after: auto;
}


/* ===========================
   HEADER
=========================== */

.header {
    text-align: center;
    margin-bottom: 15px;
}


.header h2 {
    font-size: 18px;
    margin-bottom: 5px;
}


.header h3 {
    font-size: 15px;
    margin-bottom: 8px;
}


.header p {
    font-size: 12px;
    line-height: 1.5;
}


/* ===========================
   CLASS TITLE
=========================== */

.class-title {
    border: 1.5px solid #000;

    padding: 6px 10px;

    font-weight: bold;

    margin-bottom: 6px;
}


/* ===========================
   WORKING SHEET TABLE
=========================== */

table {
    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;

    page-break-inside: avoid;
    break-inside: avoid;
}


th,
td {
    border: 1px solid #000;

    text-align: center;
    vertical-align: middle;

    padding: 4px;
}


th {
    font-weight: bold;
}


tbody td {
    height: 32px;
}


/* ===========================
   COLUMN WIDTHS
=========================== */

.lot-col {
    width: 40px;

    text-align: center;

    font-weight: bold;
}


.sr-col {
    width: 40px;
}


.name-col {
    width: 220px;

    text-align: left;

    padding-left: 8px;
}


.event-col {
    width: 28px;
}


.attempt-col {
    width: 38px;
}


.maximum-col {
    width: 45px;
}


.total-col {
    width: 55px;
}


.place-col {
    width: 55px;
}


/* ===========================
   HEADER GROUPS
=========================== */

.event-group,
.snatch-group,
.cj-group,
.maximum-group {
    font-weight: bold;
}


/* ===========================
   CHECK MARK
=========================== */

.checkmark {
    font-weight: bold;
}


/* ===========================
   SIGNATURE SECTION
=========================== */

.signature-row {
    width: 100%;

    display: flex;

    justify-content: space-between;

    align-items: flex-end;

    margin-top: 45px;

    page-break-inside: avoid;
    break-inside: avoid;
}


.signature {
    width: 18%;

    text-align: center;

    font-size: 11px;
}


.signature-line {
    border-top: 1px solid #000;

    margin-bottom: 6px;
}


/* ===========================
   EXPLICIT PAGE BREAK
=========================== */

.page-break {
    page-break-after: always;
    break-after: page;
}
`;