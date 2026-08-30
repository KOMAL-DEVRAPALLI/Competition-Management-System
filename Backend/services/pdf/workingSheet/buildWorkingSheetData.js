import CompetitionEntry
    from "../../../models/CompetitionEntry.js";


const normalizeAgeCategory = (value) => {

    const normalized =
        String(value ?? "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace("-", "");


    if (
        normalized === "U17"
    ) {

        return "U17";

    }


    if (
        normalized === "U19"
    ) {

        return "U19";

    }


    if (
        normalized === "YOUTH"
    ) {

        return "U17";

    }


    if (
        normalized === "JUNIOR"
    ) {

        return "U19";

    }


    return normalized;

};


const buildWorkingSheetData = async (
    competitionId,
    gender,
    flat = false,
    selectedWeightCategories = [],
    dbSession = null,
    ageCategory = null
) => {

    const normalizedGender =
        String(gender ?? "")
            .trim()
            .toLowerCase();


    const normalizedAgeCategory =
        ageCategory
            ? normalizeAgeCategory(
                ageCategory
            )
            : null;


    const normalizedCategories =
        Array.isArray(
            selectedWeightCategories
        )
            ? selectedWeightCategories
                .map(
                    (category) =>
                        String(category).trim()
                )
                .filter(Boolean)
            : [];


    // =====================================
    // LOAD ENTRIES
    // =====================================

    let query =
        CompetitionEntry
            .find({
                competitionId,
            })
            .select(
                [
                    "_id",
                    "athleteId",
                    "competitionCategory.ageCategory",
                    "official.bodyWeight",
                    "official.finalWeightCategory",
                    "official.lotNumber",
                    "opening.snatch",
                    "opening.cleanJerk",
                    "results.bestSnatch",
                    "results.bestCleanJerk",
                    "results.total",
                    "results.rank",
                    "snatchAttempts",
                    "cleanJerkAttempts",
                ].join(" ")
            )
            .populate({
                path: "athleteId",
                select:
                    "_id personalInfo.fullName personalInfo.gender",
            });


    if (dbSession) {

        query =
            query.session(
                dbSession
            );

    }


    const entries =
        await query.lean();


    console.log(
        "WORKING SHEET REQUEST:",
        {
            competitionId,
            gender: normalizedGender,
            ageCategory:
                normalizedAgeCategory,
            totalEntries:
                entries.length,
        }
    );


    // =====================================
    // GROUP
    // =====================================

    const groupedRows = {};


    for (const entry of entries) {

        const athlete =
            entry.athleteId;


        if (!athlete) {
            continue;
        }


        const athleteGender =
            String(
                athlete.personalInfo?.gender ?? ""
            )
                .trim()
                .toLowerCase();


        const entryAgeCategory =
            normalizeAgeCategory(
                entry.competitionCategory
                    ?.ageCategory
            );


        const rawWeightCategory =
            entry.official
                ?.finalWeightCategory;


        console.log(
            "ENTRY CHECK:",
            {
                name:
                    athlete.personalInfo
                        ?.fullName,

                gender:
                    athleteGender,

                ageCategory:
                    entryAgeCategory,

                requestedGender:
                    normalizedGender,

                requestedAge:
                    normalizedAgeCategory,
            }
        );


        // =================================
        // REQUIRED DATA
        // =================================

        if (
            entry.opening?.snatch == null ||
            entry.opening?.cleanJerk == null ||
            !athleteGender ||
            !rawWeightCategory
        ) {

            continue;

        }


        // =================================
        // GENDER
        // =================================

        if (
            athleteGender !==
            normalizedGender
        ) {

            continue;

        }


        // =================================
        // AGE
        // =================================

        if (
            normalizedAgeCategory &&
            entryAgeCategory !==
                normalizedAgeCategory
        ) {

            continue;

        }


        // =================================
        // WEIGHT CATEGORY
        // =================================

        const displayWeightCategory =
            String(
                rawWeightCategory
            ).trim();


        if (
            normalizedCategories.length > 0 &&
            !normalizedCategories.includes(
                displayWeightCategory
            )
        ) {

            continue;

        }


        const normalizedWeight =
            displayWeightCategory
                .toLowerCase()
                .replace(/\s+/g, "");


        // IMPORTANT:
        // Include age in key so U17/U19
        // entries can never merge.

        const key =
            `${athlete._id}-` +
            `${entryAgeCategory}-` +
            `${normalizedWeight}`;


        if (!groupedRows[key]) {

            groupedRows[key] = {

                athleteId:
                    athlete._id,

                entryId:
                    entry._id,

                lotNumber:
                    entry.official
                        ?.lotNumber,

                gender:
                    athlete.personalInfo
                        ?.gender,

                ageCategory:
                    entryAgeCategory,

                weightCategory:
                    normalizedWeight,

                displayWeightCategory:
                    displayWeightCategory,

                name:
                    athlete.personalInfo
                        ?.fullName,

                bodyWeight:
                    entry.official
                        ?.bodyWeight,

                isYouth:
                    entryAgeCategory ===
                    "U17",

                isJunior:
                    entryAgeCategory ===
                    "U19",

                isSenior:
                    entryAgeCategory ===
                    "SENIOR",

                openingSnatch:
                    entry.opening
                        ?.snatch,

                openingCleanJerk:
                    entry.opening
                        ?.cleanJerk,

                bestSnatch:
                    entry.results
                        ?.bestSnatch ?? 0,

                bestCleanJerk:
                    entry.results
                        ?.bestCleanJerk ?? 0,

                total:
                    entry.results
                        ?.total ?? 0,

                place:
                    entry.results
                        ?.rank ?? "",

                competitionEntry:
                    entry,

            };

        }

    }


    // =====================================
    // ARRAY
    // =====================================

    const rows =
        Object.values(
            groupedRows
        );


    // =====================================
    // SORT
    // =====================================

    rows.sort(
        (a, b) => {

            const weightA =
                parseFloat(
                    a.weightCategory
                );


            const weightB =
                parseFloat(
                    b.weightCategory
                );


            if (
                weightA !==
                weightB
            ) {

                return (
                    weightA -
                    weightB
                );

            }


            return (
                (a.lotNumber ?? 9999) -
                (b.lotNumber ?? 9999)
            );

        }
    );


    // =====================================
    // FLAT
    // =====================================

    if (flat) {

        return rows;

    }


    // =====================================
    // GROUP BY WEIGHT
    // =====================================

    const grouped = {};


    for (const row of rows) {

        const category =
            row.weightCategory;


        if (!grouped[category]) {

            grouped[category] = [];

        }


        grouped[category].push(
            row
        );

    }


    // =====================================
    // FINAL
    // =====================================

    return Object.entries(
        grouped
    ).map(
        (
            [
                weightCategory,
                athletes,
            ]
        ) => ({

            class:
                athletes[0]
                    ?.displayWeightCategory,

            athletes:
                athletes.map(
                    (
                        athlete,
                        index
                    ) => ({

                        serialNo:
                            index + 1,

                        ...athlete,

                    })
                ),

        })
    );

};


export default buildWorkingSheetData;