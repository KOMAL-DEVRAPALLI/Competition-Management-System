import { workingSheetStyles } from "./WorkingSheetStyle.js";

export const workingSheetTemplate = (competition, workingSheetData ,gender) => {
    
    return `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<title>
${gender.toLowerCase() === "female"
    ? "Women's Working Sheet"
    : "Men's Working Sheet"}
</title>

<style>

${workingSheetStyles()}

</style>

</head>

<body>

<div class="page">

    <div class="header">

        <h2>SURAT DISTRICT WEIGHTLIFTING ASSOCIATION</h2>

        <h3>
    ${gender === "female"
        ? "WOMEN'S WORKING SHEET"
        : "MEN'S WORKING SHEET"}
</h3>

<h4>${competition.competitionName}</h4>

        <p>

            Venue : ${competition.venue}
            <br>
            Date : ${new Date(competition.startDate).toLocaleDateString("en-IN")}

        </p>

    </div>

 ${workingSheetData.map(section => `

<div class="weight-section">

    <div class="class-title">
        Class : ${section.class}
    </div>

    <table class="working-sheet-table">

       <thead>



                    <tr>



                        <th class="lot-col" rowspan="2">

    Lot

</th>



<th class="sr-col" rowspan="2">

    Sr.

</th>



                        <th class="name-col" rowspan="2">

                            Name of Competitor

                        </th>



                        <th class="event-group" colspan="3">

                            Event

                        </th>



                        <th class="snatch-group" colspan="3">

                            Snatch

                        </th>



                        <th class="cj-group" colspan="3">

                            Clean & Jerk

                        </th>



                        <th class="maximum-group" colspan="2">

                            Maximum

                        </th>



                        <th class="total-col" rowspan="2">

                            Total

                        </th>



                        <th class="place-col" rowspan="2">

                            Place

                        </th>



                    </tr>



                    <tr>



                        <th class="event-col">YTH</th>

                        <th class="event-col">JR</th>

                        <th class="event-col">SR</th>



                        <th class="attempt-col">1</th>

                        <th class="attempt-col">2</th>

                        <th class="attempt-col">3</th>



                        <th class="attempt-col">1</th>

                        <th class="attempt-col">2</th>

                        <th class="attempt-col">3</th>



                        <th class="maximum-col">S</th>

                        <th class="maximum-col">C&amp;J</th>



                    </tr>



                </thead>

        <tbody>

            ${section.athletes.map(athlete => `

            <tr>

                <td class="lot-col">
                    ${athlete.lotNumber ?? ""}
                </td>

                <td class="sr-col">
                    ${athlete.serialNo}
                </td>

                <td class="name-col">
                    ${athlete.name}
                </td>

                <td class="event-col">
                    ${athlete.isYouth ? "&#10003;" : ""}
                </td>

                <td class="event-col">
                    ${athlete.isJunior ? "&#10003;" : ""}
                </td>

                <td class="event-col">
                    ${athlete.isSenior ? "&#10003;" : ""}
                </td>

                <td class="attempt-col">
                    ${athlete.openingSnatch ?? ""}
                </td>

                <td class="attempt-col"></td>
                <td class="attempt-col"></td>

                <td class="attempt-col">
                    ${athlete.openingCleanJerk ?? ""}
                </td>

                <td class="attempt-col"></td>
                <td class="attempt-col"></td>

                <td class="maximum-col"></td>
                <td class="maximum-col"></td>

                <td class="total-col"></td>
                <td class="place-col"></td>

            </tr>

            `).join("")}

        </tbody>

    </table>

</div>

`).join("")}
  <div class="footer">

    <div class="signature">
        <div class="signature-line"></div>
        <p>Scorer</p>
    </div>

    <div class="signature">
        <div class="signature-line"></div>
        <p>Organizer</p>
    </div>

    <div class="signature">
        <div class="signature-line"></div>
        <p>Side Referee</p>
    </div>

    <div class="signature">
        <div class="signature-line"></div>
        <p>Side Referee</p>
    </div>

    <div class="signature">
        <div class="signature-line"></div>
        <p>Chief Referee</p>
    </div>

</div>

   </div>                   
</body>

</html>
`;
};