import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Athlete from "../models/Athlete.js";
import Competition from "../models/Competition.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import processLift
    from "../services/liveCompetition/processLift.js";

dotenv.config();


// =====================================
// CONFIGURATION
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


    // =================================
    // CREATE COMPETITION ID
    // =================================

    competitionId =
        new mongoose.Types.ObjectId();

    const timestamp =
        Date.now();


    // =================================
    // CREATE AUTHORITATIVE COMPETITION
    //
    // Feature 3.7 requires an explicit
    // competition format before automatic
    // phase transition is allowed.
    // =================================

    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `Process Lift Integration ${timestamp}`,

        registrationPrefix:
            `INT-${timestamp}`,

        year:
            new Date().getFullYear(),

        competitionFormat:
            competitionFormat,

        status:
            "Live",

    });


    // =================================
    // CREATE ATHLETES
    //
    // These fields match the actual
    // Athlete model requirements.
    // =================================

    const athletes =
        await Athlete.create([

            {
                registrationNo:
                    `INT-A-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Integration Athlete A",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9000000001",

                    email:
                        `integration-a-${timestamp}@test.local`,

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
                    `INT-B-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Integration Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-02"),

                    phone:
                        "9000000002",

                    email:
                        `integration-b-${timestamp}@test.local`,

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
                    `INT-C-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Integration Athlete C",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-03"),

                    phone:
                        "9000000003",

                    email:
                        `integration-c-${timestamp}@test.local`,

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
    // CREATE COMPETITION ENTRIES
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
                        56.8,

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
                        60,

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
    // CREATE LIVE COMPETITION SESSION
    // =================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Process Lift Integration",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            entryAId,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            0,

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
// DATABASE CLEANUP
// =====================================

test.after(async () => {

    if (competitionId) {

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

    }


    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.disconnect();

    }

});


// =====================================
// HELPERS
// =====================================

const getSession = async () => {

    const session =
        await LiveCompetition.findOne({

            competitionId,

            gender,

        }).lean();


    assert.ok(

        session,

        "Expected integration live competition session."

    );


    return session;

};


const getEntry = async (entryId) => {

    const entry =
        await CompetitionEntry
            .findById(entryId)
            .lean();


    assert.ok(

        entry,

        "Expected competition entry."

    );


    return entry;

};


// =====================================
// RESET FIXTURE
// =====================================

const resetFixture = async () => {

    const pendingAttempts = [

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
                    pendingAttempts,

                cleanJerkAttempts:
                    pendingAttempts,

                "results.bestSnatch":
                    0,

                "results.bestCleanJerk":
                    0,

                "results.total":
                    0,

                "results.rank":
                    null,

                status:
                    "READY",

            },

        }

    );


    // =================================
    // DEFAULT DECLARATIONS
    // =================================

    await CompetitionEntry.updateOne(

        {
            _id:
                entryAId,
        },

        {
            $set: {

                "snatchAttempts.0.declaredWeight":
                    60,

                "snatchAttempts.0.declaredAt":
                    new Date(),

            },

        }

    );


    await CompetitionEntry.updateOne(

        {
            _id:
                entryBId,
        },

        {
            $set: {

                "snatchAttempts.0.declaredWeight":
                    55,

                "snatchAttempts.0.declaredAt":
                    new Date(),

            },

        }

    );


    await CompetitionEntry.updateOne(

        {
            _id:
                entryCId,
        },

        {
            $set: {

                "snatchAttempts.0.declaredWeight":
                    70,

                "snatchAttempts.0.declaredAt":
                    new Date(),

            },

        }

    );


    // =================================
    // RESET LIVE SESSION
    // =================================

    await LiveCompetition.updateOne(

        {
            competitionId,

            gender,

        },

        {
            $set: {

                selectedWeightCategories:
                    ["57"],

                currentEntryId:
                    entryAId,

                currentPhase:
                    "SNATCH",

                status:
                    "RUNNING",

                stateVersion:
                    0,

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

            $unset: {

                prepareEntryId:
                    "",

            },

        }

    );

};


// =====================================
// TEST 1
//
// GOOD → LOWER DECLARED WEIGHT
// =====================================

test(
    "Feature 3.5 - GOOD lift automatically advances to lower declared weight",
    async () => {

        await resetFixture();

        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const updatedA =
            await getEntry(entryAId);


        assert.equal(
            updatedA.snatchAttempts[0].result,
            "GOOD"
        );


        assert.ok(
            updatedA.snatchAttempts[0].performedAt
        );


        assert.equal(
            updatedA.snatchAttempts[0].performedSequence,
            1
        );


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId
                ?.toString(),

            entryBId.toString(),

            "Lower declared-weight athlete should become current automatically."

        );


        assert.equal(
            after.stateVersion,
            1
        );

    }
);


// =====================================
// TEST 2
//
// DUPLICATE RESULT
// =====================================

test(
    "Feature 3.5 - duplicate result is rejected",
    async () => {

        await resetFixture();

        let session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        session =
            await getSession();


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entryAId,

                    competitionId,

                    gender,

                    result:
                        "NO_LIFT",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /already been judged|not currently selected/i

        );

    }
);


// =====================================
// TEST 3
//
// STALE STATE
// =====================================

test(
    "Feature 3.5 - stale processLift state is rejected",
    async () => {

        await resetFixture();

        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entryBId,

                    competitionId,

                    gender,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

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
// TEST 4
//
// RECOVERY REQUIRED
// =====================================

test(
    "Feature 3.5 - recovery-required session blocks processLift",
    async () => {

        await resetFixture();


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
                processLift({

                    entryId:
                        entryAId,

                    competitionId,

                    gender,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /recovery|RECOVERY_REQUIRED/i

        );


        const entry =
            await getEntry(entryAId);


        assert.equal(

            entry.snatchAttempts[0].result,

            "PENDING"

        );

    }
);


// =====================================
// TEST 5
//
// SUCCESSIVE ATTEMPT
// =====================================

test(
    "Feature 3.5 - athlete can return for successive attempt",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryAId,
            },

            {
                $set: {

                    "snatchAttempts.1.declaredWeight":
                        60,

                    "snatchAttempts.1.declaredAt":
                        new Date(),

                },

            }

        );


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryBId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        70,

                },

            }

        );


        let session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        session =
            await getSession();


        assert.equal(

            session.currentEntryId
                ?.toString(),

            entryAId.toString(),

            "A's second attempt is still lower than B's 70 kg attempt."

        );

    }
);


// =====================================
// TEST 6
//
// EQUAL WEIGHT + ATTEMPT
// PREVIOUS ATTEMPT SEQUENCE
// =====================================

test(
    "Feature 3.5 - equal weight and attempt uses previous-attempt sequence",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryAId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.performedSequence":
                        1,

                    "snatchAttempts.1.declaredWeight":
                        65,

                },

            }

        );


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryBId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.performedSequence":
                        8,

                    "snatchAttempts.1.declaredWeight":
                        65,

                },

            }

        );


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryCId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.performedSequence":
                        5,

                    "snatchAttempts.1.declaredWeight":
                        65,

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
                        entryAId,

                    attemptSequenceCounter:
                        9,

                },

            }

        );


        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId
                ?.toString(),

            entryCId.toString(),

            "Earlier previous-attempt sequence should win."

        );

    }
);


// =====================================
// TEST 7
//
// LOT NUMBER TIE BREAK
// =====================================

test(
    "Feature 3.5 - complete tie uses lower lot number",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateMany(

            {
                competitionId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.performedSequence":
                        10,

                    "snatchAttempts.1.declaredWeight":
                        65,

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
                        entryAId,

                    attemptSequenceCounter:
                        11,

                },

            }

        );


        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId
                ?.toString(),

            entryBId.toString(),

            "Lot 102 must beat lot 103 when all earlier priorities are equal."

        );

    }
);


// =====================================
// TEST 8
//
// COMPLETED ATHLETE
// =====================================

test(
    "Feature 3.5 - completed athlete is never selected again",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryAId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.performedSequence":
                        1,

                    "snatchAttempts.1.result":
                        "GOOD",

                    "snatchAttempts.1.performedSequence":
                        2,

                    "snatchAttempts.2.declaredWeight":
                        65,

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
                        entryAId,

                    attemptSequenceCounter:
                        3,

                },

            }

        );


        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const after =
            await getSession();


        assert.notEqual(

            after.currentEntryId
                ?.toString(),

            entryAId.toString(),

            "Completed athlete must not be selected again."

        );

    }
);


// =====================================
// TEST 9
//
// NO ELIGIBLE ATHLETE
// =====================================

test(
    "Feature 3.5 - leaves platform empty when no eligible athlete exists",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateMany(

            {
                _id: {

                    $in: [

                        entryBId,
                        entryCId,

                    ],

                },

            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.1.result":
                        "GOOD",

                    "snatchAttempts.2.result":
                        "GOOD",

                },

            }

        );


        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId,

            null,

            "Platform should be empty when no eligible next athlete exists."

        );

    }
);


// =====================================
// TEST 10
//
// LATEST DECLARATION
// =====================================

test(
    "Feature 3.5 - latest declaration on the pending attempt determines next athlete",
    async () => {

        await resetFixture();


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryBId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        75,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                },

            }

        );


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryCId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        65,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                },

            }

        );


        const session =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                session.stateVersion,

        });


        const after =
            await getSession();


        assert.equal(

            after.currentEntryId
                ?.toString(),

            entryCId.toString(),

            "Queue must use the pending declaration."

        );

    }
);


// =====================================
// TEST 11
//
// STATE VERSION
// =====================================

test(
    "Feature 3.5 - automatic advancement increments stateVersion exactly once",
    async () => {

        await resetFixture();


        const before =
            await getSession();


        await processLift({

            entryId:
                entryAId,

            competitionId,

            gender,

            result:
                "GOOD",

            expectedStateVersion:
                before.stateVersion,

        });


        const after =
            await getSession();


        assert.equal(

            after.stateVersion,

            before.stateVersion + 1,

            "Accepted lift must increment stateVersion exactly once."

        );

    }
);


// =====================================
// TEST 12
//
// TRANSACTION / RECOVERY SAFETY
// =====================================

test(
    "Feature 3.5 - failed advancement does not modify lift state",
    async () => {

        await resetFixture();


        const beforeSession =
            await getSession();


        const beforeEntry =
            await getEntry(entryAId);


        await LiveCompetition.updateOne(

            {
                _id:
                    beforeSession._id,
            },

            {
                $set: {

                    integrity: {

                        status:
                            "RECOVERY_REQUIRED",

                        reason:
                            "Forced rollback test",

                        detectedAt:
                            new Date(),

                    },

                },

            }

        );


        const brokenSession =
            await getSession();


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entryAId,

                    competitionId,

                    gender,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        brokenSession.stateVersion,

                }),

            /recovery|RECOVERY_REQUIRED/i

        );


        const afterEntry =
            await getEntry(entryAId);


        const afterSession =
            await getSession();


        assert.equal(

            afterEntry.snatchAttempts[0].result,

            beforeEntry.snatchAttempts[0].result,

            "Failed transition must not change attempt result."

        );


        assert.equal(

            afterEntry.snatchAttempts[0].performedSequence,

            beforeEntry.snatchAttempts[0].performedSequence,

            "Failed transition must not consume performed sequence."

        );


        assert.equal(

            afterSession.attemptSequenceCounter,

            beforeSession.attemptSequenceCounter,

            "Failed transition must not consume sequence counter."

        );


        assert.equal(

            afterSession.currentEntryId
                ?.toString(),

            beforeSession.currentEntryId
                ?.toString(),

            "Failed transition must preserve platform."

        );


        assert.equal(

            afterSession.stateVersion,

            beforeSession.stateVersion,

            "Failed transition must preserve stateVersion."

        );

    }
);


// =====================================
// TEST 13
//
// INTEGRITY SAFETY
// =====================================

test(
    "Feature 3.5 - integrity failure blocks lift transition",
    async () => {

        await resetFixture();


        const before =
            await getSession();


        await LiveCompetition.updateOne(

            {
                _id:
                    before._id,
            },

            {
                $set: {

                    integrity: {

                        status:
                            "RECOVERY_REQUIRED",

                        reason:
                            "Integration integrity test",

                        detectedAt:
                            new Date(),

                    },

                },

            }

        );


        const broken =
            await getSession();


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entryAId,

                    competitionId,

                    gender,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        broken.stateVersion,

                }),

            /recovery|RECOVERY_REQUIRED/i

        );


        const entry =
            await getEntry(entryAId);


        assert.equal(

            entry.snatchAttempts[0].result,

            "PENDING",

            "Integrity failure must not record lift."

        );


        const after =
            await getSession();


        assert.equal(

            after.attemptSequenceCounter,

            before.attemptSequenceCounter

        );


        assert.equal(

            after.currentEntryId
                ?.toString(),

            before.currentEntryId
                ?.toString()

        );

    }
);