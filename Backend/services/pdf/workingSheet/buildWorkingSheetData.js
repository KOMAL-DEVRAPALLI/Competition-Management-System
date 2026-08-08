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
        gender?.toLowerCase();

    const normalizedCategories =
        Array.isArray(selectedWeightCategories)
            ? selectedWeightCategories
                .map((category) =>
                    String(category).trim()
                )
                .filter(Boolean)
            : [];

    // =====================================
    // BUILD MONGODB QUERY
    //
    // Filter as early as possible instead
    // of loading every competition entry
    // and filtering everything in JavaScript.
    // =====================================

    const query = {
        competitionId,

        "official.finalWeightCategory": {
            $exists: true,
            $nin: ["", null],
        },

        "opening.snatch": {
            $ne: null,
        },

        "opening.cleanJerk": {
            $ne: null,
        },
    };

    // =====================================
    // FETCH ONLY REQUIRED DATA
    //
    // We do not need the complete Athlete
    // document or every CompetitionEntry
    // field for the working sheet.
    // =====================================

    const entries =
        await CompetitionEntry
            .find(query)
            .select(
                [
                    "_id",
                    "competitionId",
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
    // BUILD ROWS
    // =====================================

    const groupedRows = {};

    for (const entry of entries) {

        const athlete =
            entry.athleteId;

        // ---------------------------------
        // Safety checks
        // ---------------------------------

        if (!athlete) {
            continue;
        }

        const athleteGender =
            athlete.personalInfo?.gender;

        const rawWeightCategory =
            entry.official
                ?.finalWeightCategory;

        if (
            !athleteGender ||
            !rawWeightCategory
        ) {
            continue;
        }

        // ---------------------------------
        // Gender filter
        // ---------------------------------

        if (
            athleteGender.toLowerCase() !==
            normalizedGender
        ) {
            continue;
        }

        // ---------------------------------
        // Session category filter
        // ---------------------------------

        const displayWeightCategory =
            rawWeightCategory.trim();

        if (
            normalizedCategories.length > 0 &&
            !normalizedCategories.includes(
                displayWeightCategory
            )
        ) {
            continue;
        }

        // ---------------------------------
        // Normalize category
        // ---------------------------------

        const normalizedWeight =
            displayWeightCategory
                .toLowerCase()
                .replace(/\s+/g, "");

        // ---------------------------------
        // Unique athlete/category key
        // ---------------------------------

        const key =
            `${athlete._id}-${normalizedWeight}`;

        // ---------------------------------
        // Create row
        // ---------------------------------

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

                // Keep the same structure
                // expected by the live-scoring
                // services.
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
            groupedRows[key].isYouth = true;
        }

        if (age === "Junior") {
            groupedRows[key].isJunior = true;
        }

        if (age === "Senior") {
            groupedRows[key].isSenior = true;
        }
    }

    // =====================================
    // CONVERT OBJECT → ARRAY
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

        if (weightA !== weightB) {
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
    // Live competition uses flat=true.
    // Return immediately so we don't perform
    // unnecessary grouping work.
    // =====================================

    if (flat) {
        return rows;
    }

    // =====================================
    // GROUPED MODE
    //
    // Used by working-sheet generation.
    // =====================================

    const grouped = {};

    for (const row of rows) {

        if (
            !grouped[
                row.weightCategory
            ]
        ) {
            grouped[
                row.weightCategory
            ] = [];
        }

        grouped[
            row.weightCategory
        ].push(row);
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