import { workingSheetStyles } from "./WorkingSheetStyle.js";

export const workingSheetTemplate = (
    competition,
    workingSheetData,
    gender,
    ageCategory
) => {

    const competitionName =
        competition?.competitionName ||
        competition?.name ||
        "Competition";


    const genderLabel =
        String(gender).toLowerCase() === "female"
            ? "WOMEN'S"
            : "MEN'S";


    const ageLabel =
        ageCategory
            ? String(ageCategory).toUpperCase()
            : "";


    const sessionTitle =
        ageLabel
            ? `${ageLabel} ${genderLabel} WORKING SHEET`
            : `${genderLabel} WORKING SHEET`;


    return `

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <style>
        ${workingSheetStyles()}
    </style>

</head>

<body>

${workingSheetData.map(section => `

    <div class="category-page">

        <div class="header">

            <h2>
                ${competitionName}
            </h2>
<h3>
    WEIGHTLIFTING
</h3>

            <h3>
                ${sessionTitle}
            </h3>

            <p>
                Venue : ${competition?.venue ?? ""}
                <br>
                Date : ${new Date().toLocaleDateString("en-IN")}
            </p>

        </div>


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

                  

                    <th class="snatch-group" colspan="3">
                        Snatch
                    </th>

                    <th class="cj-group" colspan="3">
                        Clean &amp; Jerk
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

                    <th class="attempt-col">
                        1
                    </th>

                    <th class="attempt-col">
                        2
                    </th>

                    <th class="attempt-col">
                        3
                    </th>

                    <th class="attempt-col">
                        1
                    </th>

                    <th class="attempt-col">
                        2
                    </th>

                    <th class="attempt-col">
                        3
                    </th>

                    <th class="maximum-col">
                        S
                    </th>

                    <th class="maximum-col">
                        C&amp;J
                    </th>

                </tr>

            </thead>

            <tbody>

                ${section.athletes.map(athlete => `

                    <tr>

                        <td class="lot-col">
                            ${athlete.lotNumber ?? ""}
                        </td>

                        <td class="sr-col">
                            ${athlete.serialNo ?? ""}
                        </td>

                        <td class="name-col">
                            ${athlete.name ?? ""}
                        </td>

                     
                        <td class="attempt-col">
                            ${athlete.openingSnatch ?? ""}
                        </td>

                        <td class="attempt-col">
                        </td>

                        <td class="attempt-col">
                        </td>

                        <td class="attempt-col">
                            ${athlete.openingCleanJerk ?? ""}
                        </td>

                        <td class="attempt-col">
                        </td>

                        <td class="attempt-col">
                        </td>

                        <td class="maximum-col">
                        </td>

                        <td class="maximum-col">
                        </td>

                        <td class="total-col">
                        </td>

                        <td class="place-col">
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>


        <div class="signature-row">

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

`).join("")}

</body>

</html>

    `;

};