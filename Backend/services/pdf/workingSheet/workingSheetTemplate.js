import { workingSheetStyles } from "./WorkingSheetStyle.js";

export const workingSheetTemplate = (
    competition,
    workingSheetData,
    gender,
    ageCategory
) => {

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


        <!-- =========================
             HEADER
        ========================== -->

        <div class="header">

            <h2>
                ${competition.competitionName}
            </h2>


            <h3>
                ${
                    ageCategory
                        ? `${ageCategory.toUpperCase()} ${
                            gender === "female"
                                ? "WOMEN'S"
                                : "MEN'S"
                        } WORKING SHEET`
                        : gender === "female"
                            ? "WOMEN'S WORKING SHEET"
                            : "MEN'S WORKING SHEET"
                }
            </h3>


            <p>
                Venue : ${competition.venue}
                <br>
                Date : ${new Date().toLocaleDateString("en-IN")}
            </p>

        </div>


        <!-- =========================
             CATEGORY
        ========================== -->

        <div class="class-title">
            Class : ${section.class}
        </div>


        <!-- =========================
             WORKING SHEET TABLE
        ========================== -->

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


                <tr>

                    <th class="event-col">
                        YTH
                    </th>


                    <th class="event-col">
                        JR
                    </th>


                    <th class="event-col">
                        SR
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


                        <!-- LOT -->

                        <td class="lot-col">
                            ${athlete.lotNumber ?? ""}
                        </td>


                        <!-- SERIAL -->

                        <td class="sr-col">
                            ${athlete.serialNo ?? ""}
                        </td>


                        <!-- NAME -->

                        <td class="name-col">
                            ${athlete.name ?? ""}
                        </td>


                        <!-- =====================
                             EVENT
                        ====================== -->

                        <td class="event-col checkmark">
                            ${athlete.isYouth ? "✓" : ""}
                        </td>


                        <td class="event-col checkmark">
                            ${athlete.isJunior ? "✓" : ""}
                        </td>


                        <td class="event-col checkmark">
                            ${athlete.isSenior ? "✓" : ""}
                        </td>


                        <!-- =====================
                             SNATCH
                        ====================== -->

                        <td class="attempt-col">
                            ${athlete.openingSnatch ?? ""}
                        </td>


                        <td class="attempt-col">
                        </td>


                        <td class="attempt-col">
                        </td>


                        <!-- =====================
                             CLEAN & JERK
                        ====================== -->

                        <td class="attempt-col">
                            ${athlete.openingCleanJerk ?? ""}
                        </td>


                        <td class="attempt-col">
                        </td>


                        <td class="attempt-col">
                        </td>


                        <!-- =====================
                             MAXIMUM
                        ====================== -->

                        <td class="maximum-col">
                        </td>


                        <td class="maximum-col">
                        </td>


                        <!-- =====================
                             RESULT
                        ====================== -->

                        <td class="total-col">
                        </td>


                        <td class="place-col">
                        </td>


                    </tr>

                `).join("")}

            </tbody>

        </table>


        <!-- =========================
             SIGNATURE SECTION
        ========================== -->

        <div class="signature-row">


            <div class="signature">

                <div class="signature-line"></div>

                <p>
                    Scorer
                </p>

            </div>


            <div class="signature">

                <div class="signature-line"></div>

                <p>
                    Organizer
                </p>

            </div>


            <div class="signature">

                <div class="signature-line"></div>

                <p>
                    Side Referee
                </p>

            </div>


            <div class="signature">

                <div class="signature-line"></div>

                <p>
                    Side Referee
                </p>

            </div>


            <div class="signature">

                <div class="signature-line"></div>

                <p>
                    Chief Referee
                </p>

            </div>


        </div>


    </div>

`).join("")}


</body>

</html>

    `;

};