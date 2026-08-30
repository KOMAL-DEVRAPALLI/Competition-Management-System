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

dotenv.config();


// =====================================
// FEATURE 3.8E
// TRANSACTION / ATOMICITY PROTECTION
//
// CONTRACT:
//
// An accepted lift is one authoritative
// state transition.
//
// Either:
//
//     ALL changes commit
//
// or:
//
//     NONE of the authoritative changes
//     remain persisted.
//
// A failed transition must not leave:
//
// - attempt result changed
// - performedAt changed
// - performedSequence changed
// - attemptSequenceCounter advanced
// - stateVersion advanced
// - currentEntryId changed
// - partial competition results persisted
//
// =====================================


const gender = "female";

let competitionId;
let athleteId;
let entryId;


// =====================================
// SETUP
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
            `Transaction Atomicity ${timestamp}`,

        registrationPrefix:
            `TX-${timestamp}`,

        year:
            new Date().getFullYear(),

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
                `TX-A-${timestamp}`,

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    "Transaction Test Athlete",

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9000000031",

                email:
                    `transaction-${timestamp}@test.local`,

                address:
                    "Test Address",

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
                        new Date(
                            "2026-08-26T10:00:00.000Z"
                        ),

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
                        new Date(
                            "2026-08-26T10:01:00.000Z"
                        ),

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
                        new Date(
                            "2026-08-26T10:02:00.000Z"
                        ),

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
    // LIVE SESSION
    // =====================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Transaction Atomicity Session",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            entryId,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            30,

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
// HELPER
// =====================================

const readAuthoritativeState =
    async () => {

        const entry =
            await CompetitionEntry
                .findById(entryId)
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
// CONTRACT 3.8E-1
//
// A failed transition must not partially
// persist authoritative state.
//
// We intentionally submit an invalid
// transition after the authoritative
// state has been loaded.
//
// The important contract is that processLift
// rejects and the persisted state remains
// unchanged.
// =====================================

test(
    "Feature 3.8E - failed lift transition leaves authoritative state unchanged",
    async () => {

        const before =
            await readAuthoritativeState();


        assert.ok(
            before.entry
        );

        assert.ok(
            before.session
        );


        const beforeAttempt =
            before.entry
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(
            beforeAttempt
        );


        const beforeState = {

            result:
                beforeAttempt.result,

            performedAt:
                beforeAttempt.performedAt,

            performedSequence:
                beforeAttempt
                    .performedSequence,

            attemptSequenceCounter:
                before.session
                    .attemptSequenceCounter,

            stateVersion:
                before.session
                    .stateVersion,

            currentEntryId:
                before.session
                    .currentEntryId
                    ?.toString() ??
                null,

            bestSnatch:
                before.entry
                    .results
                    .bestSnatch,

            bestCleanJerk:
                before.entry
                    .results
                    .bestCleanJerk,

            total:
                before.entry
                    .results
                    .total,

        };


        // =====================================
        // INVALID STATE VERSION
        //
        // The action is rejected before the
        // authoritative mutation is accepted.
        //
        // This gives us a deterministic failed
        // transition without intentionally
        // corrupting the database.
        // =====================================

        await assert.rejects(

            async () => {

                await processLift({

                    entryId,

                    competitionId,

                    gender,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        29,

                });

            },

            (error) => {

                assert.equal(

                    error.code,

                    "STALE_STATE",

                    "The failed transition must be rejected as stale state."

                );


                return true;

            }

        );


        // =====================================
        // RELOAD FROM MONGODB
        //
        // Never rely on the old in-memory
        // document for this assertion.
        // =====================================

        const after =
            await readAuthoritativeState();


        assert.ok(
            after.entry
        );

        assert.ok(
            after.session
        );


        const afterAttempt =
            after.entry
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(
            afterAttempt
        );


        // =====================================
        // ATTEMPT HISTORY
        // =====================================

        assert.equal(

            afterAttempt.result,

            beforeState.result,

            "Failed transition must not persist the lift result."

        );


        assert.equal(

            afterAttempt.performedAt,

            beforeState.performedAt,

            "Failed transition must not persist performedAt."

        );


        assert.equal(

            afterAttempt.performedSequence,

            beforeState.performedSequence,

            "Failed transition must not persist performedSequence."

        );


        // =====================================
        // SESSION STATE
        // =====================================

        assert.equal(

            after.session
                .attemptSequenceCounter,

            beforeState
                .attemptSequenceCounter,

            "Failed transition must not advance attemptSequenceCounter."

        );


        assert.equal(

            after.session
                .stateVersion,

            beforeState
                .stateVersion,

            "Failed transition must not advance stateVersion."

        );


        assert.equal(

            after.session
                .currentEntryId
                ?.toString() ??
                null,

            beforeState
                .currentEntryId,

            "Failed transition must not change currentEntryId."

        );


        // =====================================
        // RESULTS
        // =====================================

        assert.equal(

            after.entry
                .results
                .bestSnatch,

            beforeState
                .bestSnatch,

            "Failed transition must not partially update bestSnatch."

        );


        assert.equal(

            after.entry
                .results
                .bestCleanJerk,

            beforeState
                .bestCleanJerk,

            "Failed transition must not partially update bestCleanJerk."

        );


        assert.equal(

            after.entry
                .results
                .total,

            beforeState
                .total,

            "Failed transition must not partially update total."

        );

    }
);
// =====================================
// CONTRACT 3.8E-3
//
// A failure AFTER authoritative mutation
// has started must roll back the entire
// MongoDB transaction.
//
// This is the critical atomicity test.
//
// The test will use a controlled failure
// injection point in processLift().
// =====================================

test(
    "Feature 3.8E - failure after attempt mutation rolls back the entire transition",
    async () => {

        const before =
            await readAuthoritativeState();


        const beforeAttempt =
            before.entry
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(
            beforeAttempt
        );


        const beforeState = {

            result:
                beforeAttempt.result,

            performedAt:
                beforeAttempt.performedAt,

            performedSequence:
                beforeAttempt.performedSequence,

            attemptSequenceCounter:
                before.session
                    .attemptSequenceCounter,

            stateVersion:
                before.session
                    .stateVersion,

            currentEntryId:
                before.session
                    .currentEntryId
                    ?.toString() ??
                null,

        };


        // =====================================
        // FORCE FAILURE AFTER MUTATION
        //
        // This environment variable will be
        // consumed only by the controlled
        // test hook in processLift().
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
                            beforeState
                                .stateVersion,

                    });

                },

                (error) => {

                    assert.equal(

                        error.code,

                        "TEST_TRANSACTION_FAILURE",

                        "The controlled failure must be raised after mutation."

                    );


                    return true;

                }

            );

        } finally {

            delete process.env
                .LIVE_COMPETITION_TEST_FAILURE;

        }


        // =====================================
        // IMPORTANT:
        //
        // Reload everything from MongoDB.
        //
        // Do not inspect the in-memory
        // documents used inside processLift().
        // =====================================

        const after =
            await readAuthoritativeState();


        const afterAttempt =
            after.entry
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(
            afterAttempt
        );


        // =====================================
        // ATTEMPT MUST BE ROLLED BACK
        // =====================================

        assert.equal(

            afterAttempt.result,

            beforeState.result,

            "Transaction rollback must restore the original attempt result."

        );


        assert.equal(

            afterAttempt.performedAt,

            beforeState.performedAt,

            "Transaction rollback must remove persisted performedAt."

        );


        assert.equal(

            afterAttempt.performedSequence,

            beforeState.performedSequence,

            "Transaction rollback must restore performedSequence."

        );


        // =====================================
        // COUNTERS MUST BE ROLLED BACK
        // =====================================

        assert.equal(

            after.session
                .attemptSequenceCounter,

            beforeState
                .attemptSequenceCounter,

            "Transaction rollback must restore attemptSequenceCounter."

        );


        assert.equal(

            after.session
                .stateVersion,

            beforeState
                .stateVersion,

            "Transaction rollback must restore stateVersion."

        );


        // =====================================
        // PLATFORM STATE MUST BE ROLLED BACK
        // =====================================

        assert.equal(

            after.session
                .currentEntryId
                ?.toString() ??
                null,

            beforeState
                .currentEntryId,

            "Transaction rollback must restore currentEntryId."

        );

    }
);

// =====================================
// CONTRACT 3.8E-2
//
// Successful transition must commit the
// authoritative attempt exactly once.
//
// This establishes the positive side of
// the atomicity contract.
// =====================================

test(
    "Feature 3.8E - successful lift transition commits authoritative state",
    async () => {

        const before =
            await readAuthoritativeState();


        const expectedVersion =
            before.session
                .stateVersion;


        const expectedSequence =
            before.session
                .attemptSequenceCounter;


        const response =
            await processLift({

                entryId,

                competitionId,

                gender,

                result:
                    "GOOD",

                expectedStateVersion:
                    expectedVersion,

            });


        assert.ok(

            response,

            "Successful processLift must return a result."

        );


        // =====================================
        // RELOAD AUTHORITATIVE DATA
        // =====================================

        const after =
            await readAuthoritativeState();


        const attempt =
            after.entry
                .snatchAttempts
                .find(
                    (item) =>
                        item.attemptNo === 1
                );


        assert.ok(
            attempt
        );


        assert.equal(

            attempt.result,

            "GOOD",

            "Successful transition must persist GOOD."

        );


        assert.ok(

            attempt.performedAt,

            "Successful transition must persist performedAt."

        );


        assert.equal(

            attempt.performedSequence,

            expectedSequence,

            "Successful transition must consume exactly one performed sequence."

        );


        assert.equal(

            after.session
                .attemptSequenceCounter,

            expectedSequence + 1,

            "Successful transition must advance attemptSequenceCounter exactly once."

        );


        assert.ok(

            after.session
                .stateVersion >
            expectedVersion,

            "Successful state transition must advance stateVersion."

        );

    }
);


// =====================================
// CLEANUP
// =====================================

test.after(async () => {

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


    await mongoose.disconnect();

});