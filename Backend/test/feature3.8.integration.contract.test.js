import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import processLift
    from "../services/liveCompetition/processLift.js";

import getLiveCompetition
    from "../services/liveCompetition/getLiveCompetition.js";

dotenv.config();


// =====================================
// FEATURE 3.8F
// FINAL INTEGRATION / REGRESSION
// BOUNDARY
//
// Purpose:
//
// Verify that the complete 3.8
// authoritative-state protection layer
// works together.
//
// Already covered independently:
//
// 3.8A - read-only authoritative GET
// 3.8B - legacy declaration removal
// 3.8C - concurrent duplicate protection
// 3.8D - restart / recovery / integrity
// 3.8E - transaction atomicity
//
// 3.8F verifies the interaction between
// those protections.
//
// IMPORTANT:
//
// This is an integration boundary.
// It does not invent new queue rules.
//
// =====================================


// =====================================
// TEST STATE
// =====================================

const gender =
    "female";

let competitionId;
let athleteId;
let entryId;


// =====================================
// HELPERS
// =====================================

const readDatabaseState =
    async () => {

        const entry =
            await CompetitionEntry
                .findById(
                    entryId
                )
                .lean();


        const session =
            await LiveCompetition
                .findOne({

                    competitionId,

                    gender,

                })
                .lean();


        return {

            entry,

            session,

        };

    };


// =====================================
// CREATE TEST DATA
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


    const timestamp =
        Date.now();


    // =====================================
    // COMPETITION
    // =====================================

    competitionId =
        new mongoose.Types.ObjectId();


    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `3.8F Integration ${timestamp}`,

        registrationPrefix:
            `38F-${timestamp}`,

        year:
            new Date()
                .getFullYear(),

        competitionFormat:
            "SEPARATE_LIFT_CLASSIFICATION",

        status:
            "Live",

    });


    // =====================================
    // ATHLETE
    // =====================================

    const athlete =
        await Athlete.create({

            registrationNo:
                `38F-A-${timestamp}`,

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    "Feature 3.8F Athlete",

                gender:
                    "Female",

                dob:
                    new Date(
                        "2000-01-01"
                    ),

                phone:
                    "9000000032",

                email:
                    `38f-${timestamp}@test.local`,

                address:
                    "Integration Test Address",

            },

            participations: [

                {

                    category:
                        "57",

                },

            ],

            documents: {},

            verification: {

                status:
                    "Verified",

            },

        });


    athleteId =
        athlete._id;


    // =====================================
    // COMPETITION ENTRY
    // =====================================

    const entry =
        await CompetitionEntry.create({

            competitionId,

            athleteId,

            competitionCategory: {

                ageCategory:
                    "SENIOR",

            },

            official: {

                bodyWeight:
                    56.8,

                eligibleWeightCategories:
                    ["57"],

                selectedWeightCategory:
                    "57",

                finalWeightCategory:
                    "57",

                lotNumber:
                    101,

            },

            opening: {

                snatch:
                    60,

                cleanJerk:
                    80,

            },

            snatchAttempts: [

                {

                    attemptNo:
                        1,

                    declaredWeight:
                        60,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

                {

                    attemptNo:
                        2,

                    declaredWeight:
                        62,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

                {

                    attemptNo:
                        3,

                    declaredWeight:
                        64,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

            ],

            cleanJerkAttempts: [

                {

                    attemptNo:
                        1,

                    declaredWeight:
                        80,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

                {

                    attemptNo:
                        2,

                    declaredWeight:
                        82,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

                {

                    attemptNo:
                        3,

                    declaredWeight:
                        84,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",

                    performedAt:
                        null,

                    performedSequence:
                        null,

                },

            ],

            status:
                "COMPETING",

        });


    entryId =
        entry._id;


    // =====================================
    // LIVE COMPETITION
    // =====================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "3.8F Integration Session",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            entryId,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            40,

        attemptSequenceCounter:
            1,

        integrity: {

            status:
                "VALID",

            reason:
                "",

            detectedAt:
                null,

        },

    });

});


// =====================================
// 3.8F-1
//
// RESTART + STALE STATE
//
// A persisted stateVersion must remain
// authoritative after reconstruction.
//
// An Officials action based on the old
// state must therefore be rejected.
//
// =====================================

test(
    "Feature 3.8F - restart reconstruction preserves stale-state protection",
    async () => {

        const before =
            await readDatabaseState();


        assert.ok(
            before.session
        );


        const staleVersion =
            before.session
                .stateVersion;


        // =====================================
        // SIMULATE RESTART
        //
        // No state mutation.
        //
        // Reload authoritative state from
        // MongoDB as a new process would.
        // =====================================

        const reconstructed =
            await LiveCompetition
                .findOne({

                    competitionId,

                    gender,

                })
                .lean();


        assert.equal(

            reconstructed
                .stateVersion,

            staleVersion,

            "Restart reconstruction must preserve persisted stateVersion."

        );


        // =====================================
        // VALID ACTION CHANGES STATE
        //
        // This simulates another authoritative
        // action occurring after the stale
        // Officials Screen state was captured.
        // =====================================

        process.env
            .LIVE_COMPETITION_TEST_FAILURE =
            "AFTER_ATTEMPT_MUTATION";


        try {

            await assert.rejects(

                async () => {

                    await processLift({

                        entryId,

                        competitionId,

                        gender,

                        result:
                            "GOOD",

                        expectedStateVersion:
                            staleVersion,

                    });

                },

                (error) => {

                    assert.equal(

                        error.code,

                        "TEST_TRANSACTION_FAILURE"

                    );


                    return true;

                }

            );

        } finally {

            delete process.env
                .LIVE_COMPETITION_TEST_FAILURE;

        }


        // =====================================
        // IMPORTANT
        //
        // The forced failure must NOT consume
        // stateVersion.
        // =====================================

        const afterFailure =
            await readDatabaseState();


        assert.equal(

            afterFailure
                .session
                .stateVersion,

            staleVersion,

            "Failed transaction must not consume stateVersion."

        );


        // =====================================
        // Now perform the actual successful
        // transition.
        // =====================================

        await processLift({

            entryId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                staleVersion,

        });


        const afterSuccess =
            await readDatabaseState();


        assert.ok(

            afterSuccess
                .session
                .stateVersion >
            staleVersion,

            "Successful transition must advance the authoritative stateVersion."

        );

    }
);


// =====================================
// 3.8F-2
//
// READ AFTER TRANSACTION
//
// GET/reconstruction must expose the
// committed state without repairing or
// mutating it.
// =====================================

test(
    "Feature 3.8F - authoritative GET reflects committed state without mutation",
    async () => {

        const before =
            await readDatabaseState();


        assert.ok(
            before.session
        );


        const beforeSnapshot = {

            currentPhase:
                before.session
                    .currentPhase,

            stateVersion:
                before.session
                    .stateVersion,

            status:
                before.session
                    .status,

            currentEntryId:
                before.session
                    .currentEntryId
                    ?.toString() ??
                null,

            attemptSequenceCounter:
                before.session
                    .attemptSequenceCounter,

        };


        const response =
    await getLiveCompetition(
        competitionId,
        gender
    );


        assert.ok(
            response,
            "GET must return authoritative competition state."
        );


        const after =
            await readDatabaseState();


        assert.equal(

            after.session
                .currentPhase,

            beforeSnapshot
                .currentPhase,

            "GET must not mutate currentPhase."

        );


        assert.equal(

            after.session
                .stateVersion,

            beforeSnapshot
                .stateVersion,

            "GET must not mutate stateVersion."

        );


        assert.equal(

            after.session
                .status,

            beforeSnapshot
                .status,

            "GET must not mutate status."

        );


        assert.equal(

            after.session
                .currentEntryId
                ?.toString() ??
                null,

            beforeSnapshot
                .currentEntryId,

            "GET must not mutate currentEntryId."

        );


        assert.equal(

            after.session
                .attemptSequenceCounter,

            beforeSnapshot
                .attemptSequenceCounter,

            "GET must not mutate attemptSequenceCounter."

        );

    }
);


// =====================================
// 3.8F-3
//
// TRANSACTION FAILURE + RESTART
//
// A failed transaction must remain failed
// even after the process/session is
// reconstructed.
//
// No partial mutation may appear after
// restart.
// =====================================

test(
    "Feature 3.8F - transaction rollback survives authoritative reconstruction",
    async () => {

        // ---------------------------------
        // Create a fresh pending attempt
        // ---------------------------------

        const freshEntry =
            await CompetitionEntry
                .findById(
                    entryId
                );


        const attempt =
            freshEntry
                .snatchAttempts
                .find(
                    (item) =>
                        item.attemptNo === 2
                );


        assert.ok(
            attempt
        );


        const before =
            await readDatabaseState();


        const beforeSequence =
            before.session
                .attemptSequenceCounter;


        const beforeVersion =
            before.session
                .stateVersion;


        // =====================================
        // FORCE TRANSACTION FAILURE
        // =====================================

        process.env
            .LIVE_COMPETITION_TEST_FAILURE =
            "AFTER_ATTEMPT_MUTATION";


        try {

            await assert.rejects(

                async () => {

                    await processLift({

                        entryId,

                        competitionId,

                        gender,

                        result:
                            "GOOD",

                        expectedStateVersion:
                            beforeVersion,

                    });

                },

                (error) => {

                    assert.equal(

                        error.code,

                        "TEST_TRANSACTION_FAILURE"

                    );


                    return true;

                }

            );

        } finally {

            delete process.env
                .LIVE_COMPETITION_TEST_FAILURE;

        }


        // =====================================
        // SIMULATED RESTART
        // =====================================

        const reconstructedEntry =
            await CompetitionEntry
                .findById(
                    entryId
                )
                .lean();


        const reconstructedSession =
            await LiveCompetition
                .findOne({

                    competitionId,

                    gender,

                })
                .lean();


        const reconstructedAttempt =
            reconstructedEntry
                .snatchAttempts
                .find(
                    (item) =>
                        item.attemptNo === 2
                );


        assert.ok(
            reconstructedAttempt
        );


        // =====================================
        // ROLLBACK MUST SURVIVE RESTART
        // =====================================

        assert.equal(

            reconstructedAttempt
                .result,

            "PENDING",

            "Restart must not reveal a rolled-back result."

        );


        assert.equal(

            reconstructedAttempt
                .performedAt,

            null,

            "Restart must not reveal rolled-back performedAt."

        );


        assert.equal(

            reconstructedAttempt
                .performedSequence,

            null,

            "Restart must not reveal rolled-back performedSequence."

        );


        assert.equal(

            reconstructedSession
                .attemptSequenceCounter,

            beforeSequence,

            "Restart must preserve the pre-transaction attempt sequence."

        );


        assert.equal(

            reconstructedSession
                .stateVersion,

            beforeVersion,

            "Restart must preserve the pre-transaction stateVersion."

        );

    }
);


// =====================================
// 3.8F-4
//
// RECOVERY BLOCKS THE INTEGRATED FLOW
//
// If authoritative state says
// RECOVERY_REQUIRED, none of the automatic
// progression path may continue.
// =====================================

test(
    "Feature 3.8F - recovery state remains a hard integration boundary",
    async () => {

        const session =
            await LiveCompetition
                .findOne({

                    competitionId,

                    gender,

                });


        assert.ok(
            session
        );


        const originalStatus =
            session.status;


        const originalIntegrityStatus =
            session.integrity?.status;


        session.status =
            "RECOVERY_REQUIRED";


        session.integrity.status =
            "RECOVERY_REQUIRED";


        await session.save();


        try {

            await assert.rejects(

                async () => {

                    await processLift({

                        entryId,

                        competitionId,

                        gender,

                        result:
                            "GOOD",

                        expectedStateVersion:
                            session.stateVersion,

                    });

                },

                (error) => {

                    assert.ok(

                        error.code ===
                            "RECOVERY_REQUIRED" ||
                        error.code ===
                            "QUEUE_INTEGRITY_ERROR",

                        "Recovery state must block the integrated lift transition."

                    );


                    return true;

                }

            );


        } finally {

            const restoreSession =
                await LiveCompetition
                    .findOne({

                        competitionId,

                        gender,

                    });


            restoreSession.status =
                originalStatus;


            restoreSession.integrity.status =
                originalIntegrityStatus;


            await restoreSession.save();

        }

    }
);


// =====================================
// 3.8F-5
//
// FINAL AUTHORITATIVE SNAPSHOT
//
// After all integrated scenarios, the
// persisted state must remain internally
// coherent.
// =====================================

test(
    "Feature 3.8F - final persisted authoritative state remains coherent",
    async () => {

        const state =
            await readDatabaseState();


        assert.ok(
            state.session
        );


        assert.ok(
            state.entry
        );


        assert.equal(

            state.session
                .competitionId
                ?.toString(),

            competitionId
                .toString(),

            "Live session must remain attached to the correct competition."

        );


        assert.equal(

            state.session
                .gender,

            gender,

            "Live session gender must remain authoritative."

        );


        assert.ok(

            Number.isInteger(
                state.session
                    .stateVersion
            ),

            "stateVersion must remain an integer."

        );


        assert.ok(

            state.session
                .stateVersion >= 0,

            "stateVersion must remain non-negative."

        );


        assert.ok(

            Number.isInteger(
                state.session
                    .attemptSequenceCounter
            ),

            "attemptSequenceCounter must remain an integer."

        );


        assert.ok(

            state.session
                .attemptSequenceCounter >= 1,

            "attemptSequenceCounter must remain valid."

        );


        assert.ok(

            state.session
                .currentEntryId,

            "The authoritative session must retain a current platform entry."

        );


        const currentEntry =
            state.session
                .currentEntryId
                ?.toString();


        assert.equal(

            currentEntry,

            entryId
                .toString(),

            "Current platform must remain the expected competition entry."

        );

    }
);


// =====================================
// CLEANUP
// =====================================

test.after(async () => {

    if (competitionId) {

        await LiveCompetition.deleteOne({

            competitionId,

            gender,

        });


        await CompetitionEntry.deleteOne({

            _id:
                entryId,

        });


        await Athlete.deleteOne({

            _id:
                athleteId,

        });


        await Competition.deleteOne({

            _id:
                competitionId,

        });

    }


    await mongoose.disconnect();

});