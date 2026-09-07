import CompetitionEntry from "../../models/CompetitionEntry.js";


// =====================================
// UPDATE CATEGORY RANKING
//
// Responsibility:
//
// 1. Read the authoritative CompetitionEntry.
// 2. Find all CompetitionEntry records in
//    the same competition, age category,
//    and weight category.
// 3. Rank using CompetitionEntry results.
// 4. Persist rank to CompetitionEntry.results.
//
// IMPORTANT:
//
// CompetitionEntry is the authoritative
// competition-entry record containing:
//
// - competitionId
// - competitionCategory.ageCategory
// - official.finalWeightCategory
// - official.bodyWeight
// - results.bestSnatch
// - results.bestCleanJerk
// - results.total
// - results.rank
//
// =====================================
//
// TRANSACTION SUPPORT
//
// Normal:
//
// updateCategoryRanking(
//     competitionEntry
// )
//
// Transactional:
//
// updateCategoryRanking(
//     competitionEntry,
//     session
// )
//
// =====================================


const updateCategoryRanking = async (
    competitionEntry,
    session = null
) => {

    // =====================================
    // VALIDATE CURRENT COMPETITION ENTRY
    // =====================================

    if (!competitionEntry) {

        throw new Error(
            "Competition entry not found."
        );

    }


    if (!competitionEntry._id) {

        throw new Error(
            "Competition entry ID is missing."
        );

    }


    // =====================================
    // READ CATEGORY INFORMATION
    // =====================================

    const competitionId =
        competitionEntry.competitionId;


    const finalWeightCategory =
        competitionEntry
            .official
            ?.finalWeightCategory;


    const ageCategory =
        competitionEntry
            .competitionCategory
            ?.ageCategory;


    // =====================================
    // VALIDATE COMPETITION
    // =====================================

    if (!competitionId) {

        throw new Error(
            "Competition ID is missing from competition entry."
        );

    }


    // =====================================
    // VALIDATE WEIGHT CATEGORY
    // =====================================

    if (!finalWeightCategory) {

        throw new Error(
            "Final weight category is missing from competition entry."
        );

    }


    // =====================================
    // VALIDATE AGE CATEGORY
    // =====================================

    if (!ageCategory) {

        throw new Error(
            "Age category is missing from competition entry."
        );

    }


    // =====================================
    // LOAD ALL ENTRIES
    //
    // IMPORTANT:
    //
    // Ranking is independently calculated
    // for:
    //
    // Competition
    // +
    // Age Category
    // +
    // Weight Category
    //
    // Therefore U17 and U19 never share
    // the same ranking sequence.
    // =====================================

    let entriesQuery =
        CompetitionEntry.find({

            competitionId,

            "competitionCategory.ageCategory":
                ageCategory,

            "official.finalWeightCategory":
                finalWeightCategory,

        });


    if (session) {

        entriesQuery =
            entriesQuery.session(
                session
            );

    }


    const categoryEntries =
        await entriesQuery;


    // =====================================
    // SORT BY RESULTS
    //
    // Existing ranking priority:
    //
    // 1. Total DESC
    // 2. Best Clean & Jerk DESC
    // 3. Best Snatch DESC
    // 4. Body Weight ASC
    //
    // Only the ranking scope has changed.
    // =====================================

    categoryEntries.sort(
        (a, b) => {

            const aResults =
                a.results ?? {};


            const bResults =
                b.results ?? {};


            // ---------------------------------
            // 1. TOTAL — HIGHER IS BETTER
            // ---------------------------------

            const aTotal =
                Number(
                    aResults.total ?? 0
                );


            const bTotal =
                Number(
                    bResults.total ?? 0
                );


            if (
                aTotal !==
                bTotal
            ) {

                return (
                    bTotal -
                    aTotal
                );

            }


            // ---------------------------------
            // 2. BEST CLEAN & JERK
            // ---------------------------------

            const aBestCleanJerk =
                Number(
                    aResults.bestCleanJerk ?? 0
                );


            const bBestCleanJerk =
                Number(
                    bResults.bestCleanJerk ?? 0
                );


            if (
                aBestCleanJerk !==
                bBestCleanJerk
            ) {

                return (
                    bBestCleanJerk -
                    aBestCleanJerk
                );

            }


            // ---------------------------------
            // 3. BEST SNATCH
            // ---------------------------------

            const aBestSnatch =
                Number(
                    aResults.bestSnatch ?? 0
                );


            const bBestSnatch =
                Number(
                    bResults.bestSnatch ?? 0
                );


            if (
                aBestSnatch !==
                bBestSnatch
            ) {

                return (
                    bBestSnatch -
                    aBestSnatch
                );

            }


            // ---------------------------------
            // 4. BODY WEIGHT — LOWER IS BETTER
            // ---------------------------------

            const aBodyWeight =
                Number(
                    a
                        .official
                        ?.bodyWeight ?? 999
                );


            const bBodyWeight =
                Number(
                    b
                        .official
                        ?.bodyWeight ?? 999
                );


            if (
                aBodyWeight !==
                bBodyWeight
            ) {

                return (
                    aBodyWeight -
                    bBodyWeight
                );

            }


            // ---------------------------------
            // DETERMINISTIC FALLBACK
            //
            // This is NOT a competition
            // ranking rule.
            //
            // It only guarantees deterministic
            // ordering when all ranking fields
            // are identical.
            // ---------------------------------

            return String(
                a._id
            ).localeCompare(
                String(
                    b._id
                )
            );

        }
    );


    // =====================================
    // ASSIGN RANK
    //
    // Only athletes with total > 0
    // receive a rank.
    //
    // Non-ranked athletes receive null.
    //
    // Rank increments only for valid
    // competition results.
    // =====================================

    let currentRank = 1;


    const bulkOperations = [];


    for (
        const entry
        of categoryEntries
    ) {

        const total =
            Number(
                entry
                    .results
                    ?.total ??
                0
            );


        let rank = null;


        if (
            total > 0
        ) {

            rank =
                currentRank;

            currentRank++;

        }


        // =================================
        // KEEP IN-MEMORY RESULT IN SYNC
        //
        // The returned ranking state must
        // contain the same rank that is being
        // persisted to MongoDB.
        // =================================

        entry.results.rank =
            rank;


        bulkOperations.push({

            updateOne: {

                filter: {

                    _id:
                        entry._id,

                },

                update: {

                    $set: {

                        "results.rank":
                            rank,

                    },

                },

            },

        });

    }


    // =====================================
    // SAVE RANKS
    // =====================================

    if (
        bulkOperations.length > 0
    ) {

        await CompetitionEntry.bulkWrite(
            bulkOperations,
            session
                ? { session }
                : undefined
        );

    }


    // =====================================
    // RETURN RANKING STATE
    //
    // IMPORTANT:
    //
    // Return the exact rank assigned above.
    //
    // Do NOT use array index because
    // non-ranked athletes may exist between
    // ranked athletes.
    // =====================================

    return categoryEntries.map(
        (entry) => ({

            competitionEntryId:
                entry._id,

            rank:
                entry.results
                    ?.rank ??
                null,

            bestSnatch:
                Number(
                    entry.results
                        ?.bestSnatch ??
                    0
                ),

            bestCleanJerk:
                Number(
                    entry.results
                        ?.bestCleanJerk ??
                    0
                ),

            total:
                Number(
                    entry.results
                        ?.total ??
                    0
                ),

        })
    );

};


export default updateCategoryRanking;