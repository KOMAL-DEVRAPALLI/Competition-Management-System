import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "../models/Athlete.js";

import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import processLift
    from "../services/liveCompetition/processLift.js";

dotenv.config();


// =====================================
// CONFIGURATION
// =====================================

const TEST_GENDER = "female";


// =====================================
// TEST ISOLATION
//
// Every test gets its own competitionId.
// =====================================

let currentTestCompetitionId = null;


// =====================================
// CREATED DOCUMENT TRACKING
// =====================================

const createdAthleteIds = [];
const createdEntryIds = [];
const createdSessionIds = [];


// =====================================
// DATABASE SETUP
// =====================================

test.before(async () => {

    if (!process.env.MONGO_URI) {
        throw new Error(
            "MONGO_URI is not configured."
        );
    }

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(
            process.env.MONGO_URI
        );
    }

});


// =====================================
// PER-TEST SETUP
// =====================================

test.beforeEach(() => {

    currentTestCompetitionId =
        new mongoose.Types.ObjectId();

});


// =====================================
// DATABASE CLEANUP
// =====================================

test.after(async () => {

    if (createdSessionIds.length) {

        await LiveCompetition.deleteMany({
            _id: {
                $in: createdSessionIds,
            },
        });

    }

    if (createdEntryIds.length) {

        await CompetitionEntry.deleteMany({
            _id: {
                $in: createdEntryIds,
            },
        });

    }

    if (createdAthleteIds.length) {

        await Athlete.deleteMany({
            _id: {
                $in: createdAthleteIds,
            },
        });

    }

    await mongoose.disconnect();

});


// =====================================
// HELPERS
// =====================================

const getTestCompetitionId = () => {

    if (!currentTestCompetitionId) {

        throw new Error(
            "Test competition ID has not been initialized."
        );

    }

    return currentTestCompetitionId;

};


// =====================================
// CREATE ATHLETE
// =====================================

const createAthlete = async (suffix) => {

    const athlete =
        await Athlete.create({

            registrationNo:
                `TEST-${Date.now()}-${suffix}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            competition:
                getTestCompetitionId(),

            personalInfo: {

                fullName:
                    `Test Athlete ${suffix}`,

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9999999999",

                email:
                    `test-${Date.now()}-${suffix}-${Math.random()
                        .toString(36)
                        .slice(2, 8)}@example.com`,

                address:
                    "Test Address",

            },

            competitionInfo: {

                competitionName:
                    "Automatic Officials Test",

            },

            participations: [
                {
                    category:
                        "Senior",
                },
            ],

            documents: {

                passportPhoto: {},
                aadhaar: {},
                birthCertificate: {},
                iwlfCard: {},

            },

            verification: {

                status:
                    "Verified",

            },

        });


    createdAthleteIds.push(
        athlete._id
    );


    return athlete;

};


// =====================================
// CREATE COMPETITION ENTRY
// =====================================

const createEntry = async ({
    athlete,
    lotNumber = 1,
    snatchOpening = 60,
    cleanJerkOpening = 80,
}) => {

    const entry =
        await CompetitionEntry.create({

            competitionId:
                getTestCompetitionId(),

            athleteId:
                athlete._id,

            competitionCategory: {

                ageCategory:
                    "Senior",

            },

            official: {

                bodyWeight:
                    55,

                eligibleWeightCategories: [
                    "57",
                ],

                selectedWeightCategory:
                    "57",

                finalWeightCategory:
                    "57",

                lotNumber,

            },

            opening: {

                snatch:
                    snatchOpening,

                cleanJerk:
                    cleanJerkOpening,

            },

            snatchAttempts: [

                {
                    attemptNo: 1,

                    declaredWeight:
                        snatchOpening,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",
                },

                {
                    attemptNo: 2,

                    result:
                        "PENDING",
                },

                {
                    attemptNo: 3,

                    result:
                        "PENDING",
                },

            ],

            cleanJerkAttempts: [

                {
                    attemptNo: 1,

                    declaredWeight:
                        cleanJerkOpening,

                    declaredAt:
                        new Date(),

                    result:
                        "PENDING",
                },

                {
                    attemptNo: 2,

                    result:
                        "PENDING",
                },

                {
                    attemptNo: 3,

                    result:
                        "PENDING",
                },

            ],

            status:
                "READY",

        });


    createdEntryIds.push(
        entry._id
    );


    return entry;

};


// =====================================
// CREATE LIVE SESSION
// =====================================

const createSession = async ({
    currentEntryId,
    currentPhase = "SNATCH",
    stateVersion = 0,
    attemptSequenceCounter = 1,
}) => {

    const session =
        await LiveCompetition.create({

            competitionId:
                getTestCompetitionId(),

            gender:
                TEST_GENDER,

            sessionName:
                "Automatic Officials Test",

            selectedWeightCategories: [
                "57",
            ],

            currentEntryId:
                currentEntryId ?? null,

            currentPhase,

            status:
                "RUNNING",

            stateVersion,

            attemptSequenceCounter,

            integrity: {

                status:
                    "VALID",

                reason:
                    "",

            },

        });


    createdSessionIds.push(
        session._id
    );


    return session;

};


// =====================================
// TEST 1
//
// GOOD LIFT
//
// Verifies:
// - result
// - performedAt
// - performedSequence
// - attempt sequence increment
// - state version increment
// =====================================

test(
    "Feature 3.6 - GOOD lift records authoritative attempt history",
    async () => {

        const athlete =
            await createAthlete("GOOD");

        const entry =
            await createEntry({
                athlete,
                lotNumber: 1,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,

                attemptSequenceCounter:
                    1,
            });

        const result =
            await processLift({

                entryId:
                    entry._id,

                competitionId:
                    getTestCompetitionId(),

                gender:
                    TEST_GENDER,

                result:
                    "GOOD",

                expectedStateVersion:
                    session.stateVersion,

            });


        assert.ok(
            result,
            "Expected processLift result."
        );


        const updatedEntry =
            await CompetitionEntry.findById(
                entry._id
            );


        const attempt =
            updatedEntry.snatchAttempts.find(
                (item) =>
                    item.attemptNo === 1
            );


        assert.equal(
            attempt.result,
            "GOOD"
        );


        assert.ok(
            attempt.performedAt instanceof Date,
            "performedAt must be recorded."
        );


        assert.equal(
            attempt.performedSequence,
            1
        );


        const updatedSession =
            await LiveCompetition.findById(
                session._id
            );


        assert.equal(
            updatedSession.attemptSequenceCounter,
            2
        );


        assert.equal(
            updatedSession.stateVersion,
            1
        );

    }
);


// =====================================
// TEST 2
//
// NO LIFT
// =====================================

test(
    "Feature 3.6 - NO_LIFT records authoritative attempt history",
    async () => {

        const athlete =
            await createAthlete("NO-LIFT");

        const entry =
            await createEntry({
                athlete,
                lotNumber: 2,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,

                attemptSequenceCounter:
                    10,
            });


        await processLift({

            entryId:
                entry._id,

            competitionId:
                getTestCompetitionId(),

            gender:
                TEST_GENDER,

            result:
                "NO_LIFT",

            expectedStateVersion:
                session.stateVersion,

        });


        const updatedEntry =
            await CompetitionEntry.findById(
                entry._id
            );


        const attempt =
            updatedEntry.snatchAttempts.find(
                (item) =>
                    item.attemptNo === 1
            );


        assert.equal(
            attempt.result,
            "NO_LIFT"
        );


        assert.ok(
            attempt.performedAt instanceof Date
        );


        assert.equal(
            attempt.performedSequence,
            10
        );


        const updatedSession =
            await LiveCompetition.findById(
                session._id
            );


        assert.equal(
            updatedSession.attemptSequenceCounter,
            11
        );


        assert.equal(
            updatedSession.stateVersion,
            1
        );

    }
);


// =====================================
// TEST 3
//
// INVALID RESULT
// =====================================

test(
    "Feature 3.6 - rejects invalid lift result",
    async () => {

        const athlete =
            await createAthlete("INVALID");

        const entry =
            await createEntry({
                athlete,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,
            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "INVALID",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Invalid lift result/

        );

    }
);


// =====================================
// TEST 4
//
// MISSING GENDER
// =====================================

test(
    "Feature 3.6 - rejects missing gender",
    async () => {

        const athlete =
            await createAthlete("GENDER");

        const entry =
            await createEntry({
                athlete,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,
            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        "",

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Gender is required/

        );

    }
);


// =====================================
// TEST 5
//
// INVALID EXPECTED STATE VERSION
// =====================================

test(
    "Feature 3.6 - rejects invalid expectedStateVersion",
    async () => {

        const athlete =
            await createAthlete("VERSION");

        const entry =
            await createEntry({
                athlete,
            });

        await createSession({
            currentEntryId:
                entry._id,
        });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        null,

                }),

            /expectedStateVersion must be a non-negative integer/

        );

    }
);


// =====================================
// TEST 6
//
// WRONG ATHLETE
// =====================================

test(
    "Feature 3.6 - rejects athlete who is not currently selected",
    async () => {

        const athleteA =
            await createAthlete("WRONG-A");

        const athleteB =
            await createAthlete("WRONG-B");


        const entryA =
            await createEntry({
                athlete:
                    athleteA,

                lotNumber:
                    1,
            });


        const entryB =
            await createEntry({
                athlete:
                    athleteB,

                lotNumber:
                    2,
            });


        const session =
            await createSession({
                currentEntryId:
                    entryA._id,
            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entryB._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /This athlete is not currently selected/

        );

    }
);


// =====================================
// TEST 7
//
// STALE STATE
//
// This is the authoritative protection
// against repeated/stale Officials Screen
// actions.
//
// A previously rendered stateVersion must
// not be allowed to mutate newer state.
// =====================================

test(
    "Feature 3.6 - rejects stale state version",
    async () => {

        const athlete =
            await createAthlete("STALE");

        const entry =
            await createEntry({
                athlete,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,

                stateVersion:
                    5,
            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        4,

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "STALE_STATE"
                );

                return true;

            }

        );

    }
);


// =====================================
// TEST 8
//
// INVALID ATTEMPT SEQUENCE STATE
//
// Mongoose prevents creating a session
// with attemptSequenceCounter = 0.
//
// Therefore create a valid session first,
// then intentionally corrupt the persisted
// document using updateOne().
//
// This verifies processLift's defensive
// validation without weakening the schema.
// =====================================

test(
    "Feature 3.6 - rejects invalid attempt sequence state",
    async () => {

        const athlete =
            await createAthlete("SEQUENCE");

        const entry =
            await createEntry({
                athlete,
            });

        const session =
            await createSession({
                currentEntryId:
                    entry._id,

                attemptSequenceCounter:
                    1,
            });


        await LiveCompetition.updateOne(

            {
                _id:
                    session._id,
            },

            {
                $set: {
                    attemptSequenceCounter:
                        0,
                },
            }

        );


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /attempt sequence is invalid/

        );

    }
);


// =====================================
// TEST 9
//
// WRONG PHASE
// =====================================

test(
    "Feature 3.6 - rejects phase mismatch",
    async () => {

        const athlete =
            await createAthlete("PHASE");

        const entry =
            await createEntry({
                athlete,
            });

        const session =
            await createSession({

                currentEntryId:
                    entry._id,

                currentPhase:
                    "CLEAN_JERK",

            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Athlete attempt is SNATCH, but live session is in CLEAN_JERK\./

        );

    }
);


// =====================================
// TEST 10
//
// MISSING COMPETITION ENTRY
// =====================================

test(
    "Feature 3.6 - rejects missing competition entry",
    async () => {

        const session =
            await createSession({

                currentEntryId:
                    new mongoose.Types.ObjectId(),

            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        new mongoose.Types.ObjectId(),

                    competitionId:
                        getTestCompetitionId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Competition entry not found/

        );

    }
);


// =====================================
// TEST 11
//
// MISSING LIVE SESSION
// =====================================

test(
    "Feature 3.6 - rejects missing live competition session",
    async () => {

        const athlete =
            await createAthlete("NO-SESSION");

        const entry =
            await createEntry({
                athlete,
            });


        await assert.rejects(

            () =>
                processLift({

                    entryId:
                        entry._id,

                    competitionId:
                        new mongoose.Types.ObjectId(),

                    gender:
                        TEST_GENDER,

                    result:
                        "GOOD",

                    expectedStateVersion:
                        0,

                }),

            /Live competition session not found/

        );

    }
);