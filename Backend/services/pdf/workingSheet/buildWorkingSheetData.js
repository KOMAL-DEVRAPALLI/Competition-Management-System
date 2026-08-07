import CompetitionEntry from "../../../models/CompetitionEntry.js";

const buildWorkingSheetData = async (
    competitionId,
    gender,
    flat = false,
    selectedWeightCategories = []
) => {

    const entries = await CompetitionEntry.find({
        competitionId,
    }).populate("athleteId");

    const groupedRows = {};

    entries
        .filter((entry) => {

            const athlete = entry.athleteId;

            if (
                !entry.official?.finalWeightCategory ||
                entry.opening?.snatch == null ||
                entry.opening?.cleanJerk == null ||
                athlete.personalInfo.gender.toLowerCase() !==
                    gender.toLowerCase()
            ) {
                return false;
            }

            // Filter by selected session categories.
            // Empty array means ALL categories.
            if (
                selectedWeightCategories.length > 0 &&
                !selectedWeightCategories.includes(
                    entry.official.finalWeightCategory
                        .trim()
                )
            ) {
                return false;
            }

            return true;

        })
        .forEach((entry) => {

            const athlete = entry.athleteId;

            const rawWeight =
                entry.official.finalWeightCategory ?? "";

            const normalizedWeight = rawWeight
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");

            const key =
                `${athlete._id}-${normalizedWeight}`;

            if (!groupedRows[key]) {

                groupedRows[key] = {

                    athleteId: athlete._id,

                    entryId: entry._id,

                    lotNumber:
                        entry.official.lotNumber,

                    gender:
                        athlete.personalInfo.gender,

                    weightCategory:
                        normalizedWeight,

                    displayWeightCategory:
                        rawWeight.trim(),

                    name:
                        athlete.personalInfo.fullName,

                    bodyWeight:
                        entry.official.bodyWeight,

                    isYouth: false,

                    isJunior: false,

                    isSenior: false,

                    openingSnatch:
                        entry.opening.snatch,

                    openingCleanJerk:
                        entry.opening.cleanJerk,

                    bestSnatch:
                        entry.results.bestSnatch,

                    bestCleanJerk:
                        entry.results.bestCleanJerk,

                    total:
                        entry.results.total,

                    place:
                        entry.results.rank ?? "",

                    competitionEntry:
                        entry,

                };

            }

            const age =
                entry.competitionCategory
                    .ageCategory;

            if (age === "Youth")
                groupedRows[key].isYouth = true;

            if (age === "Junior")
                groupedRows[key].isJunior = true;

            if (age === "Senior")
                groupedRows[key].isSenior = true;

        });

    const rows = Object.values(groupedRows);

    console.table(
        rows.map((row) => ({
            entryId:
                row.entryId.toString(),
            lot:
                row.lotNumber,
            name:
                row.name,
            category:
                row.weightCategory,
        }))
    );

    rows.sort((a, b) => {

        const weightA =
            parseFloat(a.weightCategory);

        const weightB =
            parseFloat(b.weightCategory);

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        return (
            (a.lotNumber ?? 9999) -
            (b.lotNumber ?? 9999)
        );

    });

    if (flat) {
        return rows;
    }

    const grouped = {};

    rows.forEach((row) => {

        if (!grouped[row.weightCategory]) {
            grouped[row.weightCategory] = [];
        }

        grouped[row.weightCategory].push(
            row
        );

    });

    return Object.entries(grouped).map(
        ([weightCategory, athletes]) => ({

            class:
                athletes[0]
                    .displayWeightCategory,

            athletes: athletes.map(
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