const escapeHtml = (value) => {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

};


// =====================================
// GET ATTEMPT BY NUMBER
//
// IMPORTANT:
// Do not rely on array position.
// =====================================

const getAttempt = (
    attempts = [],
    attemptNo
) => {

    if (
        !Array.isArray(
            attempts
        )
    ) {

        return null;

    }


    return (
        attempts.find(
            (attempt) =>
                Number(
                    attempt?.attemptNo
                ) ===
                Number(attemptNo)
        ) ??
        null
    );

};


// =====================================
// FORMAT ATTEMPT
//
// Attempt 1 uses opening weight as a
// fallback when declaredWeight is empty.
//
// GOOD:
//     70
//
// NO_LIFT:
//     70 X
//
// PENDING:
//     70
// =====================================

const formatAttempt = (
    attempts,
    attemptNo,
    openingWeight = null
) => {

    const attempt =
        getAttempt(
            attempts,
            attemptNo
        );


    if (!attempt) {

        return "";

    }


    let weight =
        attempt.declaredWeight;


    // =====================================
    // ATTEMPT 1 OPENING-WEIGHT FALLBACK
    // =====================================

    if (
        Number(attemptNo) === 1 &&
        (
            weight === 0 ||
            weight == null
        )
    ) {

        weight =
            openingWeight;

    }


    if (
        weight == null ||
        Number(weight) <= 0
    ) {

        return "";

    }


    const result =
        attempt.result;


    // =====================================
    // GOOD LIFT
    // =====================================

    if (
        result === "GOOD"
    ) {

        return `${escapeHtml(weight)}`;

    }


    // =====================================
    // NO LIFT
    // =====================================

    if (
        result === "NO_LIFT"
    ) {

        return `
            ${escapeHtml(weight)}
            <span class="no-lift">X</span>
        `;

    }


    // =====================================
    // PENDING
    // =====================================

    return `${escapeHtml(weight)}`;

};


// =====================================
// CATEGORY SORT
//
// Examples:
//
// 45
// 49
// 53
// 58
// 86
// +87
//
// Numeric categories are sorted first.
// + categories are placed after their
// corresponding numeric value.
// =====================================

const sortCategories = (
    entries
) => {

    return entries.sort(
        ([a], [b]) => {

            const categoryA =
                String(
                    a ?? ""
                ).trim();


            const categoryB =
                String(
                    b ?? ""
                ).trim();


            const weightA =
                parseFloat(
                    categoryA
                        .replace(
                            "+",
                            ""
                        )
                );


            const weightB =
                parseFloat(
                    categoryB
                        .replace(
                            "+",
                            ""
                        )
                );


            const validA =
                Number.isFinite(
                    weightA
                );


            const validB =
                Number.isFinite(
                    weightB
                );


            // =================================
            // NORMAL NUMERIC CATEGORIES
            // =================================

            if (
                validA &&
                validB &&
                weightA !== weightB
            ) {

                return (
                    weightA -
                    weightB
                );

            }


            // =================================
            // SAME NUMERIC VALUE
            //
            // Example:
            // 87 before +87
            // =================================

            if (
                validA &&
                validB &&
                weightA === weightB
            ) {

                const plusA =
                    categoryA.startsWith(
                        "+"
                    );


                const plusB =
                    categoryB.startsWith(
                        "+"
                    );


                if (
                    plusA &&
                    !plusB
                ) {

                    return 1;

                }


                if (
                    !plusA &&
                    plusB
                ) {

                    return -1;

                }


                return 0;

            }


            // =================================
            // FALLBACK
            // =================================

            return categoryA.localeCompare(
                categoryB
            );

        }
    );

};


// =====================================
// FINAL RESULT TEMPLATE
// =====================================

export const finalResultTemplate = (
    competition,
    resultRows,
    gender
) => {

    const competitionName =
        competition?.competitionName ||
        competition?.name ||
        "Competition";


    const genderLabel =
        String(gender).toLowerCase() ===
        "female"
            ? "WOMEN'S"
            : "MEN'S";


    const venue =
        competition?.venue ||
        "—";


    const competitionDate =
        competition?.startDate
            ? new Date(
                competition.startDate
            ).toLocaleDateString(
                "en-IN"
            )
            : new Date()
                .toLocaleDateString(
                    "en-IN"
                );


    // =====================================
    // NORMALIZE RESULT ROWS
    // =====================================

    const safeResultRows =
        Array.isArray(
            resultRows
        )
            ? resultRows
            : [];


    // =====================================
    // GROUP RESULTS BY WEIGHT CATEGORY
    //
    // IMPORTANT:
    //
    // This only groups existing result
    // rows. It does NOT calculate:
    //
    // - ranking
    // - total
    // - best lift
    // - calling order
    // =====================================

    const groupedResults =
        safeResultRows.reduce(
            (
                groups,
                athlete
            ) => {

                const category =
                    String(
                        athlete.displayWeightCategory ||
                        athlete.weightCategory ||
                        "—"
                    ).trim();


                if (
                    !groups[category]
                ) {

                    groups[category] =
                        [];

                }


                groups[category].push(
                    athlete
                );


                return groups;

            },
            {}
        );


    // =====================================
    // SORT CATEGORIES
    // =====================================

    const sortedCategories =
        sortCategories(
            Object.entries(
                groupedResults
            )
        );


    return `

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <style>

        * {
            box-sizing: border-box;
        }


        body {

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            margin: 0;

            color: #111827;

            font-size: 9px;

        }


        .header {

            text-align: center;

            margin-bottom: 16px;

        }


        .header h1 {

            margin: 0 0 5px;

            font-size: 20px;

            font-weight: 800;

        }


        .header h2 {

            margin: 0 0 8px;

            font-size: 14px;

            font-weight: 700;

        }


        .header p {

            margin: 2px 0;

            font-size: 9px;

        }


        .completion-badge {

            display: inline-block;

            margin-top: 8px;

            padding: 4px 10px;

            border: 1px solid #166534;

            color: #166534;

            font-weight: 800;

            border-radius: 4px;

        }


        table {

            width: 100%;

            border-collapse: collapse;

            table-layout: fixed;

        }


        thead th {

            background: #1e3a8a;

            color: white;

            border: 1px solid #172554;

            padding: 5px 3px;

            font-weight: 800;

            text-align: center;

        }


        tbody td {

            border: 1px solid #9ca3af;

            padding: 5px 3px;

            text-align: center;

            vertical-align: middle;

        }


        tbody tr:nth-child(even) td {

            background: #f8fafc;

        }


        /* =====================================
           CATEGORY HEADER
           ===================================== */

        .category-row td {

            background: #dbeafe !important;

            color: #1e3a8a;

            font-size: 10px;

            font-weight: 800;

            text-align: left;

            padding: 6px;

        }


        .category-title {

            font-size: 10px;

            font-weight: 800;

        }


        .name {

            text-align: left;

            font-weight: 700;

        }


        .lot {

            width: 5%;

        }


        .name-col {

            width: 18%;

        }


        .age {

            width: 7%;

            font-weight: 700;

        }


        .category {

            width: 9%;

        }


        .attempt {

            width: 6%;

        }


        .best {

            width: 7%;

            font-weight: 700;

        }


        .total {

            width: 7%;

            font-weight: 900;

        }


        .place {

            width: 7%;

            font-weight: 900;

        }


        .good {

            color: #15803d;

            font-weight: 800;

        }


        .no-lift {

            color: #dc2626;

            font-weight: 900;

        }


        .eliminated td {

            background: #fee2e2 !important;

            color: #991b1b;

        }


        .eliminated .name {

            text-decoration:
                line-through;

        }


        .footer {

            margin-top: 24px;

            display: flex;

            justify-content:
                space-between;

            gap: 20px;

        }


        .signature {

            width: 30%;

            text-align: center;

        }


        .signature-line {

            border-top:
                1px solid #374151;

            margin-bottom: 5px;

        }


        @media print {

            .category-row {

                break-after:
                    avoid;

                page-break-after:
                    avoid;

            }


            .category-row td {

                break-after:
                    avoid;

                page-break-after:
                    avoid;

            }

        }

    </style>

</head>


<body>


<div class="header">

    <h1>
        ${escapeHtml(
            competitionName
        )}
    </h1>


    <h2>
        ${genderLabel} FINAL RESULT
    </h2>


    <p>
        Venue:
        ${escapeHtml(
            venue
        )}
    </p>


    <p>
        Date:
        ${escapeHtml(
            competitionDate
        )}
    </p>


    <div class="completion-badge">
        COMPETITION COMPLETED
    </div>

</div>


<table>

    <thead>

        <tr>

            <th class="lot">
                Lot
            </th>

            <th class="name-col">
                Athlete
            </th>

            <th class="age">
                Age
            </th>

            <th class="category">
                Weight Category
            </th>

            <th class="attempt">
                S1
            </th>

            <th class="attempt">
                S2
            </th>

            <th class="attempt">
                S3
            </th>

            <th class="best">
                Best Snatch
            </th>

            <th class="attempt">
                C1
            </th>

            <th class="attempt">
                C2
            </th>

            <th class="attempt">
                C3
            </th>

            <th class="best">
                Best C&J
            </th>

            <th class="total">
                Total
            </th>

            <th class="place">
                Place
            </th>

        </tr>

    </thead>


    <tbody>

        ${
            sortedCategories
                .map(
                    (
                        [
                            category,
                            athletes,
                        ]
                    ) => {

                        // =================================
                        // SORT ATHLETES BY LOT NUMBER
                        //
                        // Existing result/rank values
                        // are NOT changed.
                        // =================================

                        const sortedAthletes =
                            [...athletes].sort(
                                (a, b) =>
                                    (
                                        a.lotNumber ??
                                        9999
                                    ) -
                                    (
                                        b.lotNumber ??
                                        9999
                                    )
                            );


                        return `

                        <!-- =============================
                             CATEGORY
                        ============================== -->

                        <tr class="category-row">

                            <td
                                colspan="14"
                            >

                                <span class="category-title">

                                    Weight Category:
                                    ${escapeHtml(
                                        category
                                    )}
                                    kg

                                </span>

                            </td>

                        </tr>


                        <!-- =============================
                             ATHLETES
                        ============================== -->

                        ${
                            sortedAthletes
                                .map(
                                    (
                                        athlete
                                    ) => {

                                        const snatchAttempts =
                                            athlete
                                                .competitionEntry
                                                ?.snatchAttempts ??
                                            [];


                                        const cleanJerkAttempts =
                                            athlete
                                                .competitionEntry
                                                ?.cleanJerkAttempts ??
                                            [];


                                        const eliminated =
                                            athlete.eliminated === true ||
                                            athlete.status ===
                                                "ELIMINATED";


                                        const bestSnatch =
                                            Number(
                                                athlete.bestSnatch
                                            ) > 0
                                                ? athlete.bestSnatch
                                                : "-";


                                        const bestCleanJerk =
                                            Number(
                                                athlete.bestCleanJerk
                                            ) > 0
                                                ? athlete.bestCleanJerk
                                                : "-";


                                        const total =
                                            Number(
                                                athlete.total
                                            ) > 0
                                                ? athlete.total
                                                : "-";


                                        const place =
                                            athlete.place ||
                                            "-";


                                        return `

                                        <tr
                                            class="${
                                                eliminated
                                                    ? "eliminated"
                                                    : ""
                                            }"
                                        >

                                            <!-- LOT -->

                                            <td>

                                                ${escapeHtml(
                                                    athlete.lotNumber
                                                )}

                                            </td>


                                            <!-- ATHLETE -->

                                            <td class="name">

                                                ${escapeHtml(
                                                    athlete.name
                                                )}

                                            </td>


                                            <!-- AGE CATEGORY -->

                                            <td class="age">

                                                ${escapeHtml(
                                                    athlete.ageCategory ||
                                                    "-"
                                                )}

                                            </td>


                                            <!-- WEIGHT CATEGORY -->

                                            <td>

                                                ${escapeHtml(
                                                    athlete.displayWeightCategory ||
                                                    athlete.weightCategory ||
                                                    "-"
                                                )}

                                            </td>


                                            <!-- SNATCH 1 -->

                                            <td>

                                                ${formatAttempt(
                                                    snatchAttempts,
                                                    1,
                                                    athlete.openingSnatch
                                                )}

                                            </td>


                                            <!-- SNATCH 2 -->

                                            <td>

                                                ${formatAttempt(
                                                    snatchAttempts,
                                                    2
                                                )}

                                            </td>


                                            <!-- SNATCH 3 -->

                                            <td>

                                                ${formatAttempt(
                                                    snatchAttempts,
                                                    3
                                                )}

                                            </td>


                                            <!-- BEST SNATCH -->

                                            <td class="best">

                                                ${escapeHtml(
                                                    bestSnatch
                                                )}

                                            </td>


                                            <!-- CLEAN & JERK 1 -->

                                            <td>

                                                ${formatAttempt(
                                                    cleanJerkAttempts,
                                                    1,
                                                    athlete.openingCleanJerk
                                                )}

                                            </td>


                                            <!-- CLEAN & JERK 2 -->

                                            <td>

                                                ${formatAttempt(
                                                    cleanJerkAttempts,
                                                    2
                                                )}

                                            </td>


                                            <!-- CLEAN & JERK 3 -->

                                            <td>

                                                ${formatAttempt(
                                                    cleanJerkAttempts,
                                                    3
                                                )}

                                            </td>


                                            <!-- BEST CLEAN & JERK -->

                                            <td class="best">

                                                ${escapeHtml(
                                                    bestCleanJerk
                                                )}

                                            </td>


                                            <!-- TOTAL -->

                                            <td class="total">

                                                ${escapeHtml(
                                                    total
                                                )}

                                            </td>


                                            <!-- PLACE -->

                                            <td class="place">

                                                ${escapeHtml(
                                                    place
                                                )}

                                            </td>

                                        </tr>

                                        `;

                                    }
                                )
                                .join("")
                        }

                        `;

                    }
                )
                .join("")
        }

    </tbody>

</table>


<div class="footer">

    <div class="signature">

        <div class="signature-line"></div>

        <strong>
            Scorer
        </strong>

    </div>


    <div class="signature">

        <div class="signature-line"></div>

        <strong>
            Chief Referee
        </strong>

    </div>


    <div class="signature">

        <div class="signature-line"></div>

        <strong>
            Organizer
        </strong>

    </div>

</div>


</body>

</html>

    `;

};


export default finalResultTemplate;