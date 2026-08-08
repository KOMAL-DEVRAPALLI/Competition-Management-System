import CompetitionEntry from "../../../models/CompetitionEntry.js";

const buildWorkingSheetData = async (
    competitionId,
    gender,
    flat = false,
    selectedWeightCategories = []
) => {

    // =====================================
    // NORMALIZE INPUT
    // =====================================

    const normalizedGender =
        String(gender ?? "").trim().toLowerCase();

    const normalizedCategories =
        Array.isArray(selectedWeightCategories)
            ? selectedWeightCategories
                .map((category) =>
                    String(category).trim()
                )
                .filter(Boolean)
            : [];


    // =====================================
    // LOAD COMPETITION ENTRIES
    //
    // IMPORTANT:
    //
    // Only filter by competitionId here.
    //
    // Do NOT add opening/final-category
    // filters to MongoDB because that changes
    // the previous working behavior.
    // =====================================

    const entries =
        await CompetitionEntry
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
            })
            .lean();


    // =====================================
    // GROUP ROWS
    // =====================================

    const groupedRows = {};


    for (const entry of entries) {

        const athlete =
            entry.athleteId;


        // =================================
        // SAFETY CHECK
        // =================================

        if (!athlete) {
            continue;
        }


        const athleteGender =
            athlete.personalInfo?.gender;


        const rawWeightCategory =
            entry.official?.finalWeightCategory;


        // =================================
        // REQUIRED EXISTING DATA
        //
        // Same business rules as before.
        // =================================

        if (
            !entry.opening?.snatch ||
            !entry.opening?.cleanJerk ||
            !athleteGender ||
            !rawWeightCategory
        ) {
            continue;
        }


        // =================================
        // GENDER FILTER
        // =================================

        if (
            athleteGender
                .toLowerCase() !==
            normalizedGender
        ) {
            continue;
        }


        // =================================
        // WEIGHT CATEGORY
        // =================================

        const displayWeightCategory =
            rawWeightCategory.trim();


        // =================================
        // SESSION CATEGORY FILTER
        //
        // Empty array = ALL categories.
        // =================================

        if (
            normalizedCategories.length > 0 &&
            !normalizedCategories.includes(
                displayWeightCategory
            )
        ) {
            continue;
        }


        // =================================
        // NORMALIZE WEIGHT CATEGORY
        // =================================

        const normalizedWeight =
            displayWeightCategory
                .toLowerCase()
                .replace(/\s+/g, "");


        // =================================
        // UNIQUE ATHLETE/CATEGORY KEY
        // =================================

        const key =
            `${athlete._id}-${normalizedWeight}`;


        // =================================
        // CREATE ROW
        // =================================

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
                    athleteGender,

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
                    false,

                isJunior:
                    false,

                isSenior:
                    false,

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


        // =================================
        // AGE CATEGORY FLAGS
        // =================================

        const age =
            entry.competitionCategory
                ?.ageCategory;


        if (age === "Youth") {

            groupedRows[key]
                .isYouth = true;

        }


        if (age === "Junior") {

            groupedRows[key]
                .isJunior = true;

        }


        if (age === "Senior") {

            groupedRows[key]
                .isSenior = true;

        }

    }


    // =====================================
    // OBJECT → ARRAY
    // =====================================

    const rows =
        Object.values(
            groupedRows
        );


    // =====================================
    // SORT
    // =====================================

    rows.sort((a, b) => {

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

    });


    // =====================================
    // FLAT MODE
    //
    // Used by live scoring.
    // =====================================

    if (flat) {

        return rows;

    }


    // =====================================
    // GROUPED MODE
    //
    // Used by working-sheet PDF.
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
    // FINAL WORKING SHEET STRUCTURE
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