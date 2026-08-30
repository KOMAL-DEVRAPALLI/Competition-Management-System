import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Athlete from "../models/Athlete.js";
import Competition from "../models/Competition.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import recalculateQueue
    from "../services/liveCompetition/recalculateQueue.js";

dotenv.config();


// =====================================
// FEATURE 3.3
// QUEUE RECALCULATION CONTRACT TEST
//
// Responsibility being tested:
//
// Competition State
//        ↓
// Feature 3.1 eligibility
//        ↓
// Feature 3.2 ordering
//        ↓
// Feature 3.3 queue state
//
// Feature 3.3 itself must:
//
// - read authoritative LiveCompetition state
// - return ordered queue
// - return next athlete
// - return upcoming athletes
// - preserve currentEntryId
// - support allowCurrentEntry
// - stop during recovery
// - remain read-only
//
// It must NOT:
//
// - modify attempts
// - modify results
// - assign currentEntryId
// - increment stateVersion
// - perform phase transition
// =====================================


const gender = "female";

let competitionId;

let athleteAId;
let athleteBId;
let athleteCId;

let entryAId;
let entryBId;
let entryCId;


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


    competitionId =
        new mongoose.Types.ObjectId();


    // =================================
    // COMPETITION
    // =================================

    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `Feature 3.3 Queue Test ${timestamp}`,

        registrationPrefix:
            `F33-${timestamp}`,

        year:
            new Date().getFullYear(),

        status:
            "Live",

    });


    // =================================
    // ATHLETES
    // =================================

    const athletes =
        await Athlete.create([

            {
                registrationNo:
                    `F33-A-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.3 Athlete A",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9000000001",

                    email:
                        `f33-a-${timestamp}@test.local`,

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

            },


            {
                registrationNo:
                    `F33-B-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.3 Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-02"),

                    phone:
                        "9000000002",

                    email:
                        `f33-b-${timestamp}@test.local`,

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

            },


            {
                registrationNo:
                    `F33-C-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.3 Athlete C",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-03"),

                    phone:
                        "9000000003",

                    email:
                        `f33-c-${timestamp}@test.local`,

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

            },

        ]);


    athleteAId =
        athletes[0]._id;

    athleteBId =
        athletes[1]._id;

    athleteCId =
        athletes[2]._id;


    // =================================
    // COMPETITION ENTRIES
    // =================================

    const entries =
        await CompetitionEntry.create([

            {
                competitionId,

                athleteId:
                    athleteAId,

                competitionCategory: {

                    ageCategory:
                        "Senior",

                },

                official: {

                    bodyWeight:
                        56.5,

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

                status:
                    "READY",

            },


            {
                competitionId,

                athleteId:
                    athleteBId,

                competitionCategory: {

                    ageCategory:
                        "Senior",

                },

                official: {

                    bodyWeight:
                        56.7,

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

                status:
                    "READY",

            },


            {
                competitionId,

                athleteId:
                    athleteCId,

                competitionCategory: {

                    ageCategory:
                        "Senior",

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
                        103,

                },

                opening: {

                    snatch:
                        70,

                    cleanJerk:
                        80,

                },

                status:
                    "READY",

            },

        ]);


    entryAId =
        entries[0]._id;

    entryBId =
        entries[1]._id;

    entryCId =
        entries[2]._id;


    // =================================
    // LIVE COMPETITION SESSION
    // =================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Feature 3.3 Contract",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            null,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            10,

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
// CLEANUP
// =====================================

test.after(async () => {

    await LiveCompetition.deleteMany({

        competitionId,

    });


    await CompetitionEntry.deleteMany({

        competitionId,

    });


    await Athlete.deleteMany({

        _id: {

            $in: [

                athleteAId,
                athleteBId,
                athleteCId,

            ],

        },

    });


    await Competition.deleteOne({

        _id:
            competitionId,

    });


    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.disconnect();

    }

});


// =====================================
// HELPERS
// =====================================


const getLiveSession =
    async () => {

        const session =
            await LiveCompetition
                .findOne({

                    competitionId,

                    gender,

                })
                .lean();


        assert.ok(
            session,
            "Expected live competition session."
        );


        return session;

    };


const resetCompetitionState =
    async () => {

        const attempts = [

            {
                attemptNo:
                    1,

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

        ];


        await CompetitionEntry.updateMany(

            {
                competitionId,
            },

            {
                $set: {

                    snatchAttempts:
                        attempts,

                    cleanJerkAttempts:
                        attempts,

                    status:
                        "READY",

                    "results.bestSnatch":
                        0,

                    "results.bestCleanJerk":
                        0,

                    "results.total":
                        0,

                },

            }

        );


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $set: {

                    currentEntryId:
                        null,

                    currentPhase:
                        "SNATCH",

                    status:
                        "RUNNING",

                    stateVersion:
                        10,

                    attemptSequenceCounter:
                        1,

                    selectedWeightCategories:
                        ["57"],

                    integrity: {

                        status:
                            "VALID",

                        reason:
                            "",

                        detectedAt:
                            null,

                    },

                },

            }

        );

    };


const setDeclaration =
    async (
        entryId,
        attemptNo,
        weight
    ) => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryId,
            },

            {
                $set: {

                    [`snatchAttempts.${attemptNo - 1}.declaredWeight`]:
                        weight,

                    [`snatchAttempts.${attemptNo - 1}.declaredAt`]:
                        new Date(),

                },

            }

        );

    };


// =====================================
// TEST 1
//
// BASIC QUEUE RESOLUTION
// =====================================

test(
    "Feature 3.3 - returns ordered queue",
    async () => {

        await resetCompetitionState();


        await setDeclaration(
            entryAId,
            1,
            60
        );


        await setDeclaration(
            entryBId,
            1,
            65
        );


        await setDeclaration(
            entryCId,
            1,
            70
        );


        const result =
            await recalculateQueue({

                competitionId,

                gender,

            });


        assert.ok(
            result.session
        );


        assert.ok(
            Array.isArray(
                result.queue
            )
        );


        assert.equal(
            result.candidateCount,
            result.queue.length
        );


        assert.equal(
            result.queue.length,
            3
        );


        assert.equal(

            result.nextAthlete
                .entryId
                .toString(),

            entryAId.toString()

        );


        assert.deepEqual(

            result.upcoming.map(
                (candidate) =>
                    candidate.entryId.toString()
            ),

            [

                entryBId.toString(),

                entryCId.toString(),

            ]

        );

    }
);


// =====================================
// TEST 2
//
// CURRENT PLATFORM PRESERVED
// =====================================

test(
    "Feature 3.3 - preserves occupied platform",
    async () => {

        await resetCompetitionState();


        await setDeclaration(
            entryAId,
            1,
            60
        );


        await setDeclaration(
            entryBId,
            1,
            65
        );


        await setDeclaration(
            entryCId,
            1,
            70
        );


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $set: {

                    currentEntryId:
                        entryBId,

                },

            }

        );


        const before =
            await getLiveSession();


        const result =
            await recalculateQueue({

                competitionId,

                gender,

            });


        assert.equal(

            result.currentEntryId
                .toString(),

            entryBId.toString()

        );


        assert.equal(
            result.platformOccupied,
            true
        );


        assert.equal(
            result.platformPreserved,
            true
        );


        const after =
            await getLiveSession();


        assert.equal(

            after.currentEntryId
                ?.toString() ?? null,

            before.currentEntryId
                ?.toString() ?? null

        );


        assert.equal(
            after.stateVersion,
            before.stateVersion
        );

    }
);


// =====================================
// TEST 3
//
// ALLOW CURRENT ENTRY
//
// Normal recalculation:
// current athlete excluded.
//
// Post-result recalculation:
// current athlete may be considered.
// =====================================

test(
    "Feature 3.3 - supports allowCurrentEntry",
    async () => {

        await resetCompetitionState();


        await setDeclaration(
            entryAId,
            1,
            60
        );


        await setDeclaration(
            entryBId,
            1,
            65
        );


        await setDeclaration(
            entryCId,
            1,
            70
        );


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $set: {

                    currentEntryId:
                        entryAId,

                },

            }

        );


        const normal =
            await recalculateQueue({

                competitionId,

                gender,

                allowCurrentEntry:
                    false,

            });


        assert.equal(
            normal.allowCurrentEntry,
            false
        );


        assert.ok(
            normal.queue.every(

                (candidate) =>

                    candidate.entryId
                        .toString() !==
                    entryAId.toString()

            )
        );


        const postResult =
            await recalculateQueue({

                competitionId,

                gender,

                allowCurrentEntry:
                    true,

            });


        assert.equal(
            postResult.allowCurrentEntry,
            true
        );


        assert.equal(

            postResult.nextAthlete
                .entryId
                .toString(),

            entryAId.toString()

        );

    }
);


// =====================================
// TEST 4
//
// EMPTY QUEUE
//
// All athletes have no pending declaration.
// =====================================

test(
    "Feature 3.3 - returns no next athlete when no candidate is eligible",
    async () => {

        await resetCompetitionState();


        const result =
            await recalculateQueue({

                competitionId,

                gender,

            });


        assert.equal(
            result.nextAthlete,
            null
        );


        assert.deepEqual(
            result.upcoming,
            []
        );


        assert.equal(
            result.candidateCount,
            0
        );


        assert.deepEqual(
            result.queue,
            []
        );

    }
);


// =====================================
// TEST 5
//
// READ-ONLY CONTRACT
//
// recalculateQueue must not modify:
// - currentEntryId
// - phase
// - status
// - stateVersion
// - attemptSequenceCounter
// =====================================

test(
    "Feature 3.3 - does not mutate authoritative competition state",
    async () => {

        await resetCompetitionState();


        await setDeclaration(
            entryAId,
            1,
            60
        );


        await setDeclaration(
            entryBId,
            1,
            65
        );


        const before =
            await getLiveSession();


        await recalculateQueue({

            competitionId,

            gender,

        });


        const after =
            await getLiveSession();


        assert.equal(

            after.currentEntryId
                ?.toString() ?? null,

            before.currentEntryId
                ?.toString() ?? null

        );


        assert.equal(

            after.currentPhase,

            before.currentPhase

        );


        assert.equal(

            after.status,

            before.status

        );


        assert.equal(

            after.stateVersion,

            before.stateVersion

        );


        assert.equal(

            after.attemptSequenceCounter,

            before.attemptSequenceCounter

        );

    }
);


// =====================================
// TEST 6
//
// RECOVERY REQUIRED
// =====================================

test(
    "Feature 3.3 - blocks RECOVERY_REQUIRED session",
    async () => {

        await resetCompetitionState();


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $set: {

                    status:
                        "RECOVERY_REQUIRED",

                },

            }

        );


        await assert.rejects(

            () =>
                recalculateQueue({

                    competitionId,

                    gender,

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "RECOVERY_REQUIRED"
                );


                assert.equal(
                    error.statusCode,
                    409
                );


                return true;

            }

        );

    }
);


// =====================================
// TEST 7
//
// INTEGRITY RECOVERY REQUIRED
// =====================================

test(
    "Feature 3.3 - blocks integrity recovery",
    async () => {

        await resetCompetitionState();


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $set: {

                    integrity: {

                        status:
                            "RECOVERY_REQUIRED",

                        reason:
                            "Feature 3.3 contract test",

                        detectedAt:
                            new Date(),

                    },

                },

            }

        );


        await assert.rejects(

            () =>
                recalculateQueue({

                    competitionId,

                    gender,

                }),

            (error) => {

                assert.equal(

                    error.code,

                    "QUEUE_INTEGRITY_ERROR"

                );


                assert.equal(

                    error.statusCode,

                    409

                );


                return true;

            }

        );

    }
);


// =====================================
// TEST 8
//
// MISSING COMPETITION ID
// =====================================

test(
    "Feature 3.3 - rejects missing competitionId",
    async () => {

        await assert.rejects(

            () =>
                recalculateQueue({

                    gender,

                }),

            {

                message:
                    "Competition ID is required.",

            }

        );

    }
);


// =====================================
// TEST 9
//
// MISSING GENDER
// =====================================

test(
    "Feature 3.3 - rejects missing gender",
    async () => {

        await assert.rejects(

            () =>
                recalculateQueue({

                    competitionId,

                }),

            {

                message:
                    "Gender is required.",

            }

        );

    }
);


// =====================================
// TEST 10
//
// MISSING LIVE SESSION
// =====================================

test(
    "Feature 3.3 - rejects missing live competition session",
    async () => {

        const missingCompetitionId =
            new mongoose.Types.ObjectId();


        await assert.rejects(

            () =>
                recalculateQueue({

                    competitionId:
                        missingCompetitionId,

                    gender,

                }),

            {

                message:
                    "Live competition session not found.",

            }

        );

    }
);


// =====================================
// FINAL CONTRACT CHECK
//
// Ensures returned object exposes the
// authoritative Feature 3.3 structure.
// =====================================

test(
    "Feature 3.3 - returns complete queue state contract",
    async () => {

        await resetCompetitionState();


        await setDeclaration(
            entryAId,
            1,
            60
        );


        const result =
            await recalculateQueue({

                competitionId,

                gender,

            });


        assert.ok(
            result.session
        );


        assert.ok(
            "currentEntryId" in result
        );


        assert.ok(
            "nextAthlete" in result
        );


        assert.ok(
            "upcoming" in result
        );


        assert.ok(
            "queue" in result
        );


        assert.ok(
            "candidateCount" in result
        );


        assert.ok(
            "platformOccupied" in result
        );


        assert.ok(
            "platformPreserved" in result
        );


        assert.ok(
            "allowCurrentEntry" in result
        );


        assert.equal(
            result.candidateCount,
            result.queue.length
        );


        assert.equal(
            result.allowCurrentEntry,
            false
        );


        assert.equal(
            result.platformOccupied,
            false
        );


        assert.equal(
            result.platformPreserved,
            false
        );

    }
);