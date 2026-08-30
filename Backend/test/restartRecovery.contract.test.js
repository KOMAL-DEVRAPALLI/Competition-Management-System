import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import recalculateQueue
    from "../services/liveCompetition/recalculateQueue.js";

dotenv.config();


// =====================================
// FEATURE 3.8D
// RESTART / RECOVERY
//
// CONTRACTS:
//
// 3.8D-1
// Persisted authoritative state must
// survive application restart/reload.
//
// 3.8D-2
// The REAL queue engine must reconstruct
// the authoritative next athlete from
// persisted state after restart.
//
// No test-local queue algorithm is used.
//
// =====================================


const gender = "female";

let competitionId;
let athleteId;
let entryId;


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
            `Restart Recovery ${timestamp}`,

        registrationPrefix:
            `RR-${timestamp}`,

        year:
            new Date().getFullYear(),

        competitionFormat:
            "SEPARATE_LIFT_CLASSIFICATION",

        status:
            "Live",

    });


    // =====================================
    // ATHLETE A
    // =====================================

    const athlete =
        await Athlete.create({

            registrationNo:
                `RR-A-${timestamp}`,

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    "Restart Recovery Athlete A",

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9000000001",

                email:
                    `restart-recovery-a-${timestamp}@test.local`,

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
    // COMPETITION ENTRY A
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
                        "GOOD",

                    performedAt:
                        new Date(
                            "2026-08-26T10:05:00.000Z"
                        ),

                    performedSequence:
                        7,

                },

                {

                    attemptNo:
                        2,

                    declaredWeight:
                        62,

                    declaredAt:
                        new Date(
                            "2026-08-26T10:06:00.000Z"
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
                        null,

                    declaredAt:
                        null,

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
            "Restart Recovery Session",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            entryId,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            14,

        attemptSequenceCounter:
            8,

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
// CONTRACT 3.8D-1
//
// Persisted authoritative state survives
// application restart / document reload.
// =====================================

test(
    "Feature 3.8D - authoritative state reconstructs from persisted MongoDB state",
    async () => {

        const persistedBefore =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(

            persistedBefore,

            "Live competition session must exist before reconstruction."

        );


        const beforeState = {

            currentPhase:
                persistedBefore.currentPhase,

            currentEntryId:
                persistedBefore.currentEntryId
                    ?.toString() ??
                null,

            stateVersion:
                persistedBefore.stateVersion,

            attemptSequenceCounter:
                persistedBefore
                    .attemptSequenceCounter,

            status:
                persistedBefore.status,

            integrityStatus:
                persistedBefore
                    .integrity
                    ?.status,

        };


        // =====================================
        // SIMULATED RESTART
        //
        // Fresh database read. No existing
        // LiveCompetition document reused.
        // =====================================

        const reloadedSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(

            reloadedSession,

            "Live competition session must be reconstructable after reload."

        );


        const afterState = {

            currentPhase:
                reloadedSession.currentPhase,

            currentEntryId:
                reloadedSession.currentEntryId
                    ?.toString() ??
                null,

            stateVersion:
                reloadedSession.stateVersion,

            attemptSequenceCounter:
                reloadedSession
                    .attemptSequenceCounter,

            status:
                reloadedSession.status,

            integrityStatus:
                reloadedSession
                    .integrity
                    ?.status,

        };


        assert.deepEqual(

            afterState,

            beforeState,

            "Authoritative competition state must survive reload unchanged."

        );


        assert.equal(

            afterState.currentPhase,

            "SNATCH",

            "Current phase must survive restart."

        );


        assert.equal(

            afterState.currentEntryId,

            entryId.toString(),

            "Current athlete must survive restart."

        );


        assert.equal(

            afterState.stateVersion,

            14,

            "stateVersion must survive restart."

        );


        assert.equal(

            afterState.attemptSequenceCounter,

            8,

            "attemptSequenceCounter must survive restart."

        );


        assert.equal(

            afterState.status,

            "RUNNING",

            "Live competition status must survive restart."

        );


        assert.equal(

            afterState.integrityStatus,

            "VALID",

            "Integrity state must survive restart."

        );

    }
);


// =====================================
// CONTRACT 3.8D-1B
//
// Attempt history survives restart.
// =====================================

test(
    "Feature 3.8D - performed attempt history survives restart",
    async () => {

        const entryBefore =
            await CompetitionEntry.findById(
                entryId
            )
            .lean();


        assert.ok(

            entryBefore,

            "Competition entry must exist."

        );


        const attemptBefore =
            entryBefore
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(

            attemptBefore,

            "Attempt 1 must exist."

        );


        const entryAfter =
            await CompetitionEntry.findById(
                entryId
            )
            .lean();


        assert.ok(

            entryAfter,

            "Competition entry must remain available after restart."

        );


        const attemptAfter =
            entryAfter
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        assert.ok(

            attemptAfter,

            "Attempt 1 must remain available after reload."

        );


        assert.equal(

            attemptAfter.result,

            "GOOD",

            "Historical result must survive restart."

        );


        assert.equal(

            attemptAfter.performedSequence,

            7,

            "Historical performedSequence must survive restart."

        );


        assert.ok(

            attemptAfter.performedAt,

            "Historical performedAt must survive restart."

        );


        const pendingAttempt =
            entryAfter
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 2
                );


        assert.ok(

            pendingAttempt,

            "Attempt 2 must exist."

        );


        assert.equal(

            pendingAttempt.result,

            "PENDING",

            "Future pending attempt must not be changed during reconstruction."

        );

    }
);


// =====================================
// CONTRACT 3.8D-1C
//
// Reconstruction itself must not mutate
// authoritative counters.
// =====================================

test(
    "Feature 3.8D - reconstruction does not advance authoritative counters",
    async () => {

        const before =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(
            before
        );


        await LiveCompetition.findOne({

            competitionId,

            gender,

        })
        .lean();


        const after =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.equal(

            after.stateVersion,

            before.stateVersion,

            "Reconstruction must not increment stateVersion."

        );


        assert.equal(

            after.attemptSequenceCounter,

            before.attemptSequenceCounter,

            "Reconstruction must not increment attemptSequenceCounter."

        );


        assert.equal(

            after.currentEntryId
                ?.toString(),

            before.currentEntryId
                ?.toString(),

            "Reconstruction must not change currentEntryId."

        );


        assert.equal(

            after.currentPhase,

            before.currentPhase,

            "Reconstruction must not change currentPhase."

        );

    }
);


// =====================================
// CONTRACT 3.8D-2
//
// REAL QUEUE ENGINE AFTER RESTART
//
// This contract intentionally calls the
// production recalculateQueue().
//
// No test-local queue sorting is allowed.
//
// Scenario:
//
// Athlete A:
//   Attempt 1 = GOOD
//   Attempt 2 = 62 kg PENDING
//   Lot = 101
//
// Athlete B:
//   Attempt 1 = 65 kg PENDING
//   Lot = 102
//
// Therefore the persisted queue inputs
// should resolve Athlete A before B.
//
// The important part is that the queue
// engine obtains this information from
// freshly reloaded MongoDB state.
// =====================================

test(
    "Feature 3.8D - real queue engine reconstructs next athlete after restart",
    async () => {

        // =====================================
        // CREATE ATHLETE B
        // =====================================

        const timestamp =
            Date.now();


        const athleteB =
            await Athlete.create({

                registrationNo:
                    `RR-B-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Restart Recovery Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9000000002",

                    email:
                        `restart-recovery-b-${timestamp}@test.local`,

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


        const entryB =
            await CompetitionEntry.create({

                competitionId,

                athleteId:
                    athleteB._id,

                competitionCategory: {

                    ageCategory:
                        "SENIOR",

                },

                official: {

                    bodyWeight:
                        56.9,

                    eligibleWeightCategories:
                        ["57"],

                    selectedWeightCategory:
                        "57",

                    finalWeightCategory:
                        "57",

                    lotNumber:
                        102,

                },

                opening: {

                    snatch:
                        65,

                    cleanJerk:
                        80,

                },

                snatchAttempts: [

                    {

                        attemptNo:
                            1,

                        declaredWeight:
                            65,

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
                            null,

                        declaredAt:
                            null,

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
                            null,

                        declaredAt:
                            null,

                        result:
                            "PENDING",

                        performedAt:
                            null,

                        performedSequence:
                            null,

                    },

                ],

                status:
                    "READY",

            });


        // =====================================
        // IMPORTANT
        //
        // The current platform is cleared
        // because we are testing reconstruction
        // of the NEXT athlete.
        // =====================================

        const session =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            });


        assert.ok(
            session
        );


        session.currentEntryId =
            null;


        session.currentPhase =
            "SNATCH";


        session.status =
            "RUNNING";


        await session.save();


        // =====================================
        // SIMULATE APPLICATION RESTART
        //
        // Force all application-side Mongoose
        // documents used by this test to be
        // discarded.
        //
        // The queue engine must read fresh
        // persisted state.
        // =====================================

        const reloadedSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(

            reloadedSession,

            "LiveCompetition must be reloadable after restart."

        );


        const reloadedEntries =
            await CompetitionEntry.find({

                competitionId,

            })
            .lean();


        assert.equal(

            reloadedEntries.length,

            2,

            "Both competition entries must be available after restart."

        );


        // =====================================
        // SNAPSHOT AUTHORITATIVE STATE
        //
        // recalculateQueue() is a queue
        // calculation and must not itself
        // mutate these values.
        // =====================================

        const stateBeforeQueue =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        // =====================================
        // CALL REAL QUEUE ENGINE
        //
        // This is the critical assertion.
        //
        // Do NOT replace this with local
        // sorting logic.
        // =====================================

        const queueState =
            await recalculateQueue({

                competitionId,

                gender,

            });


        assert.ok(

            queueState,

            "recalculateQueue() must return queue state."

        );


        assert.ok(

            queueState.nextAthlete,

            "Queue reconstruction must resolve a next athlete."

        );


        // =====================================
        // VERIFY AUTHORITATIVE NEXT ATHLETE
        // =====================================

        assert.equal(

            queueState.nextAthlete.entryId
                .toString(),

            entryId.toString(),

            "After restart, the real queue engine must resolve Athlete A as the next athlete."

        );


        assert.equal(

            Number(
                queueState.nextAthlete
                    .declaredWeight
            ),

            62,

            "Resolved next athlete must use Athlete A's persisted 62 kg declaration."

        );


        assert.equal(

            Number(
                queueState.nextAthlete
                    .attemptNo
            ),

            2,

            "Resolved next athlete must be Athlete A's second attempt."

        );


        // =====================================
        // VERIFY ATHLETE B WAS NOT SELECTED
        // =====================================

        assert.notEqual(

            queueState.nextAthlete.entryId
                .toString(),

            entryB._id.toString(),

            "Athlete B must not be selected while Athlete A has the lower applicable weight."

        );


        // =====================================
        // VERIFY QUEUE CALCULATION DID NOT
        // MUTATE AUTHORITATIVE STATE
        // =====================================

        const stateAfterQueue =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.equal(

            stateAfterQueue.currentEntryId,

            stateBeforeQueue.currentEntryId,

            "Queue reconstruction must not assign the athlete to the platform."

        );


        assert.equal(

            stateAfterQueue.currentPhase,

            stateBeforeQueue.currentPhase,

            "Queue reconstruction must not change competition phase."

        );


        assert.equal(

            stateAfterQueue.stateVersion,

            stateBeforeQueue.stateVersion,

            "Queue reconstruction must not advance stateVersion."

        );


        assert.equal(

            stateAfterQueue
                .attemptSequenceCounter,

            stateBeforeQueue
                .attemptSequenceCounter,

            "Queue reconstruction must not advance attemptSequenceCounter."

        );


        assert.equal(

            stateAfterQueue.status,

            stateBeforeQueue.status,

            "Queue reconstruction must not change competition status."

        );


        // =====================================
        // VERIFY PERSISTED ATTEMPT HISTORY
        // REMAINS UNCHANGED
        // =====================================

        const finalEntryA =
            await CompetitionEntry.findById(
                entryId
            )
            .lean();


        assert.ok(
            finalEntryA
        );


        const finalAttemptA1 =
            finalEntryA
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 1
                );


        const finalAttemptA2 =
            finalEntryA
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 2
                );


        assert.equal(

            finalAttemptA1.result,

            "GOOD",

            "Historical completed attempt must remain unchanged."

        );


        assert.equal(

            finalAttemptA1.performedSequence,

            7,

            "Historical performedSequence must remain unchanged."

        );


        assert.equal(

            finalAttemptA2.result,

            "PENDING",

            "Future attempt must remain pending."

        );


        assert.equal(

            finalAttemptA2.declaredWeight,

            62,

            "Future declaration must remain unchanged."

        );


        // =====================================
        // CLEANUP ATHLETE B
        // =====================================

        await CompetitionEntry.deleteOne({

            _id:
                entryB._id,

        });


        await Athlete.deleteOne({

            _id:
                athleteB._id,

        });

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