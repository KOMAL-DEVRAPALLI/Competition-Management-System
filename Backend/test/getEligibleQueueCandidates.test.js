import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "../models/Athlete.js";
import LiveCompetition from "../models/LiveCompetition.js";

import getEligibleQueueCandidates
    from "../services/liveCompetition/getEligibleQueueCandidates.js";

import getCurrentAttempt
    from "../services/liveCompetition/getCurrentAttempt.js";

dotenv.config();


// =====================================
// CONFIGURATION
// =====================================

const competitionId =
    "6a6b8799cc18f655c8c486e9";

const gender =
    "female";


// =====================================
// DATABASE SETUP
// =====================================

test.before(async () => {

    if (!process.env.MONGO_URI) {

        throw new Error(
            "MONGO_URI is not configured."
        );

    }

    if (
        mongoose.connection.readyState === 0
    ) {

        await mongoose.connect(
            process.env.MONGO_URI
        );

    }

});


// =====================================
// DATABASE CLEANUP
// =====================================

test.after(async () => {

    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.disconnect();

    }

});


// =====================================
// HELPER
// =====================================

const getSession = async () => {

    const session =
        await LiveCompetition.findOne({
            competitionId,
            gender,
        }).lean();


    assert.ok(
        session,
        "Expected live competition session."
    );


    return session;
};


// =====================================
// TEST 1
//
// Feature 3.1
//
// Returns only eligible queue candidates.
// =====================================

test(
    "Feature 3.1 - returns only eligible queue candidates",
    async () => {

        const session =
            await getSession();


        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        // ---------------------------------
        // Result contract
        // ---------------------------------

        assert.ok(
            result,
            "Expected Feature 3.1 result."
        );


        assert.ok(
            Array.isArray(
                result.candidates
            ),
            "Candidates must be an array."
        );


        // ---------------------------------
        // Candidate count
        // ---------------------------------

        assert.equal(

            result.totalCandidates,

            result.candidates.length,

            "totalCandidates must match the returned candidate count."

        );


        // ---------------------------------
        // Current platform athlete must not
        // appear in candidates.
        // ---------------------------------

        if (
            session.currentEntryId
        ) {

            assert.equal(

                result.candidates.some(
                    (candidate) =>
                        candidate.entryId
                            ?.toString() ===
                        session.currentEntryId
                            .toString()
                ),

                false,

                "Current platform athlete must not be an eligible queue candidate."

            );

        }

    }
);


// =====================================
// TEST 2
//
// Current platform athlete is excluded.
// =====================================

test(
    "Feature 3.1 - excludes current platform athlete",
    async () => {

        const session =
            await getSession();


        if (
            !session.currentEntryId
        ) {

            console.log(
                "Skipping current-platform exclusion assertion: fixture has no current athlete."
            );

            return;

        }


        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        const containsCurrent =
            result.candidates.some(
                (candidate) =>
                    candidate.entryId
                        ?.toString() ===
                    session.currentEntryId
                        .toString()
            );


        assert.equal(

            containsCurrent,

            false,

            "Current platform athlete must be excluded."

        );

    }
);


// =====================================
// TEST 3
//
// Athlete outside selected category scope
// must be excluded.
// =====================================

test(
    "Feature 3.1 - excludes athlete outside category scope",
    async () => {

        const session =
            await getSession();


        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        const selectedCategories =
            Array.isArray(
                session.selectedWeightCategories
            )
                ? session.selectedWeightCategories
                : [];


        if (
            selectedCategories.length === 0
        ) {

            console.log(
                "Skipping category-scope assertion: session has no selected category scope."
            );

            return;

        }


        for (
            const candidate
            of result.candidates
        ) {

            assert.ok(

                selectedCategories.includes(
                    candidate.weightCategory
                ),

                `Candidate ${candidate.name} is outside the selected weight-category scope.`

            );

        }

    }
);


// =====================================
// TEST 4
//
// Candidate's authoritative current
// attempt must belong to the current phase.
// =====================================

test(
    "Feature 3.1 - excludes athlete whose next attempt belongs to another phase",
    async () => {

        const session =
            await getSession();


        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        const currentPhase =
            session.currentPhase;


        if (
            currentPhase !== "SNATCH" &&
            currentPhase !== "CLEAN_JERK"
        ) {

            console.log(
                `Skipping phase assertion: session phase is ${currentPhase}.`
            );

            return;

        }


        for (
            const candidate
            of result.candidates
        ) {

            assert.ok(

                candidate.competitionEntry,

                `Candidate ${candidate.name} must contain competitionEntry state.`

            );


            const attempt =
                getCurrentAttempt(
                    candidate.competitionEntry
                );


            assert.ok(

                attempt,

                `Could not determine current attempt for ${candidate.name}.`

            );


            assert.equal(

                attempt.phase,

                currentPhase,

                `Candidate ${candidate.name} has an attempt outside the current competition phase.`

            );

        }

    }
);


// =====================================
// TEST 5
//
// Completed athletes must be excluded.
// =====================================

test(
    "Feature 3.1 - excludes completed athlete",
    async () => {

        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        for (
            const candidate
            of result.candidates
        ) {

            assert.notEqual(

                candidate.result,

                "COMPLETED",

                `Completed athlete ${candidate.name} must not enter the queue.`

            );

        }

    }
);


// =====================================
// TEST 6
//
// A valid eligible athlete is accepted.
// =====================================

test(
    "Feature 3.1 - accepts valid eligible athlete",
    async () => {

        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        assert.ok(
            Array.isArray(
                result.candidates
            )
        );


        const validCandidate =
            result.candidates.find(
                (candidate) => {

                    if (
                        !candidate.entryId ||
                        !candidate.name ||
                        candidate.lotNumber == null
                    ) {

                        return false;

                    }


                    if (
                        !candidate.competitionEntry
                    ) {

                        return false;

                    }


                    const attempt =
                        getCurrentAttempt(
                            candidate.competitionEntry
                        );


                    if (!attempt) {

                        return false;

                    }


                    if (
                        attempt.attemptNo < 1 ||
                        attempt.attemptNo > 3
                    ) {

                        return false;

                    }


                    if (
                        attempt.declaredWeight == null ||
                        Number(
                            attempt.declaredWeight
                        ) <= 0
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        assert.ok(

            validCandidate,

            "Expected at least one valid eligible queue candidate."

        );

    }
);


// =====================================
// TEST 7
//
// Candidate attempt state agrees with
// authoritative CompetitionEntry state.
// =====================================

test(
    "Feature 3.1 - candidate attempt matches authoritative current attempt",
    async () => {

        const session =
            await getSession();


        const result =
            await getEligibleQueueCandidates({
                competitionId,
                gender,
            });


        for (
            const candidate
            of result.candidates
        ) {

            assert.ok(

                candidate.competitionEntry,

                `Candidate ${candidate.name} must contain authoritative competition entry data.`

            );


            const authoritativeAttempt =
                getCurrentAttempt(
                    candidate.competitionEntry
                );


            assert.ok(

                authoritativeAttempt,

                `Could not determine authoritative current attempt for ${candidate.name}.`

            );


            assert.equal(

                authoritativeAttempt.phase,

                session.currentPhase,

                `Candidate ${candidate.name} current attempt phase does not match the live competition phase.`

            );


            assert.ok(

                Number.isInteger(
                    authoritativeAttempt.attemptNo
                ),

                `Candidate ${candidate.name} must have an authoritative attempt number.`

            );


            assert.ok(

                authoritativeAttempt.attemptNo >= 1 &&
                authoritativeAttempt.attemptNo <= 3,

                `Candidate ${candidate.name} has an invalid authoritative attempt number.`

            );

        }

    }
);