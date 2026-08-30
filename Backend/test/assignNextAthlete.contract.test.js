import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Athlete from "../models/Athlete.js";
import Competition from "../models/Competition.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import assignNextAthlete
    from "../services/liveCompetition/assignNextAthlete.js";

dotenv.config();


// =====================================
// FEATURE 3.4
// AUTOMATIC NEXT-ATHLETE ASSIGNMENT
//
// Contract:
//
// LiveCompetition
//       ↓
// recalculateQueue()
//       ↓
// queue[0]
//       ↓
// currentEntryId
//       ↓
// stateVersion + 1
//
// The caller does NOT choose the athlete.
// =====================================


const gender = "female";

const competitionFormat =
    "SEPARATE_LIFT_CLASSIFICATION";


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


    competitionId =
        new mongoose.Types.ObjectId();


    const timestamp =
        Date.now();


    // =================================
    // COMPETITION
    // =================================

    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `Feature 3.4 Assignment Test ${timestamp}`,

        registrationPrefix:
            `F34-${timestamp}`,

        year:
            new Date().getFullYear(),

        competitionFormat:
            competitionFormat,

        status:
            "Live",

    });


    // =================================
    // ATHLETES
    //
    // IMPORTANT:
    //
    // participations is required by the
    // actual Athlete model.
    // =================================

    const athletes =
        await Athlete.create([

            {
                registrationNo:
                    `F34-A-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.4 Athlete A",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9000000011",

                    email:
                        `f34-a-${timestamp}@test.local`,

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
                    `F34-B-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.4 Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-02"),

                    phone:
                        "9000000012",

                    email:
                        `f34-b-${timestamp}@test.local`,

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
                    `F34-C-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.4 Athlete C",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-03"),

                    phone:
                        "9000000013",

                    email:
                        `f34-c-${timestamp}@test.local`,

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

            },

        ]);


    entryAId =
        entries[0]._id;

    entryBId =
        entries[1]._id;

    entryCId =
        entries[2]._id;


    // =================================
    // LIVE COMPETITION
    // =================================

    await LiveCompetition.create({

        competitionId,

        gender,

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

const getSession =
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


const resetSession =
    async () => {

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


        await CompetitionEntry.updateMany(

            {
                competitionId,

            },

            {
                $set: {

                    snatchAttempts: [

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

                    ],

                },

            }

        );

    };


const declareSnatch =
    async (
        entryId,
        weight
    ) => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryId,

            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        weight,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                },

            }

        );

    };


// =====================================
// TEST 1
//
// queue[0] becomes current athlete.
// =====================================

test(
    "Feature 3.4 - assigns authoritative queue first athlete",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );

        await declareSnatch(
            entryBId,
            65
        );

        await declareSnatch(
            entryCId,
            70
        );


        const before =
            await getSession();


        const result =
            await assignNextAthlete({

                competitionId,

                gender,

                expectedStateVersion:
                    before.stateVersion,

            });


        assert.equal(
            result.assigned,
            true
        );


        assert.equal(
            result.reason,
            "NEXT_ATHLETE_ASSIGNED"
        );


        assert.equal(

            result.currentEntryId.toString(),

            entryAId.toString()

        );


        assert.equal(

            result.athlete.entryId.toString(),

            entryAId.toString()

        );


        assert.equal(

            result.stateVersion,

            before.stateVersion + 1

        );

    }
);


// =====================================
// TEST 2
//
// Arbitrary entryId must not control
// athlete selection.
// =====================================

test(
    "Feature 3.4 - does not accept arbitrary entryId selection",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );

        await declareSnatch(
            entryBId,
            65
        );


        const before =
            await getSession();


        const result =
            await assignNextAthlete({

                competitionId,

                gender,

                expectedStateVersion:
                    before.stateVersion,

                // Deliberately supplied.
                // The service must ignore it.
                entryId:
                    entryCId,

            });


        assert.equal(

            result.currentEntryId.toString(),

            entryAId.toString()

        );


        assert.notEqual(

            result.currentEntryId.toString(),

            entryCId.toString()

        );

    }
);


// =====================================
// TEST 3
//
// State version increments once.
// =====================================

test(
    "Feature 3.4 - increments stateVersion exactly once",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );


        const before =
            await getSession();


        const result =
            await assignNextAthlete({

                competitionId,

                gender,

                expectedStateVersion:
                    before.stateVersion,

            });


        assert.equal(

            result.stateVersion,

            before.stateVersion + 1

        );


        const after =
            await getSession();


        assert.equal(

            after.stateVersion,

            before.stateVersion + 1

        );

    }
);


// =====================================
// TEST 4
//
// Occupied platform cannot be overwritten.
// =====================================

test(
    "Feature 3.4 - refuses to overwrite occupied platform",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );

        await declareSnatch(
            entryBId,
            65
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
            await getSession();


        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId,

                    gender,

                    expectedStateVersion:
                        before.stateVersion,

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "PLATFORM_OCCUPIED"
                );

                assert.equal(
                    error.statusCode,
                    409
                );

                return true;

            }

        );


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId.toString(),

            entryBId.toString()

        );


        assert.equal(

            after.stateVersion,

            before.stateVersion

        );

    }
);


// =====================================
// TEST 5
//
// Stale state is rejected.
// =====================================

test(
    "Feature 3.4 - rejects stale stateVersion",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );


        const before =
            await getSession();


        await LiveCompetition.updateOne(

            {
                competitionId,

                gender,

            },

            {
                $inc: {

                    stateVersion:
                        1,

                },

            }

        );


        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId,

                    gender,

                    expectedStateVersion:
                        before.stateVersion,

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "STALE_STATE"
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
// TEST 6
//
// Recovery-required state is blocked.
// =====================================

test(
    "Feature 3.4 - blocks RECOVERY_REQUIRED state",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );


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


        const session =
            await getSession();


        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId,

                    gender,

                    expectedStateVersion:
                        session.stateVersion,

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
// Integrity recovery is blocked.
// =====================================

test(
    "Feature 3.4 - blocks integrity recovery",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );


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
                            "Feature 3.4 contract test",

                        detectedAt:
                            new Date(),

                    },

                },

            }

        );


        const session =
            await getSession();


        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId,

                    gender,

                    expectedStateVersion:
                        session.stateVersion,

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
// Empty queue does not mutate platform
// or state version.
// =====================================

test(
    "Feature 3.4 - returns no assignment when queue is empty",
    async () => {

        await resetSession();


        const before =
            await getSession();


        const result =
            await assignNextAthlete({

                competitionId,

                gender,

                expectedStateVersion:
                    before.stateVersion,

            });


        assert.equal(
            result.assigned,
            false
        );


        assert.equal(

            result.reason,

            "NO_ELIGIBLE_ATHLETE"

        );


        assert.equal(
            result.athlete,
            null
        );


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId
                ?.toString() ?? null,

            null

        );


        assert.equal(

            after.stateVersion,

            before.stateVersion

        );

    }
);


// =====================================
// TEST 9
//
// Assignment must not modify attempts
// or competition results.
// =====================================

test(
    "Feature 3.4 - does not modify athlete attempts or results",
    async () => {

        await resetSession();


        await declareSnatch(
            entryAId,
            60
        );


        const beforeEntry =
            await CompetitionEntry
                .findById(entryAId)
                .lean();


        const beforeSession =
            await getSession();


        await assignNextAthlete({

            competitionId,

            gender,

            expectedStateVersion:
                beforeSession.stateVersion,

        });


        const afterEntry =
            await CompetitionEntry
                .findById(entryAId)
                .lean();


        assert.deepEqual(

            afterEntry.snatchAttempts,

            beforeEntry.snatchAttempts

        );


        assert.deepEqual(

            afterEntry.results,

            beforeEntry.results

        );

    }
);


// =====================================
// TEST 10
//
// Unknown live competition.
// =====================================

test(
    "Feature 3.4 - rejects unknown competition",
    async () => {

        const unknownCompetitionId =
            new mongoose.Types.ObjectId();


        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId:
                        unknownCompetitionId,

                    gender,

                    expectedStateVersion:
                        0,

                }),

            (error) => {

                assert.equal(

                    error.code,

                    "LIVE_COMPETITION_NOT_FOUND"

                );

                assert.equal(

                    error.statusCode,

                    404

                );

                return true;

            }

        );

    }
);


// =====================================
// TEST 11
//
// Invalid expected state version.
// =====================================

test(
    "Feature 3.4 - rejects invalid expectedStateVersion",
    async () => {

        await assert.rejects(

            () =>
                assignNextAthlete({

                    competitionId,

                    gender,

                    expectedStateVersion:
                        -1,

                }),

            (error) => {

                assert.equal(

                    error.message,

                    "expectedStateVersion must be a non-negative integer."

                );

                return true;

            }

        );

    }
);