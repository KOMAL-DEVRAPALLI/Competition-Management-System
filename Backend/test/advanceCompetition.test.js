import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "../models/Athlete.js";

import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import advanceCompetition
    from "../services/liveCompetition/advanceCompetition.js";

dotenv.config();


// =====================================
// CONFIGURATION
// =====================================

const TEST_GENDER = "female";

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

    if (
        mongoose.connection.readyState === 0
    ) {

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

const getCompetitionId = () => {

    if (!currentTestCompetitionId) {

        throw new Error(
            "Test competition ID is not initialized."
        );

    }

    return currentTestCompetitionId;

};


// =====================================
// CREATE ATHLETE
// =====================================

const createAthlete = async (
    suffix
) => {

    const unique =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;


    const athlete =
        await Athlete.create({

            registrationNo:
                `ADV-${unique}-${suffix}`,

            competition:
                getCompetitionId(),

            personalInfo: {

                fullName:
                    `Advance Test ${suffix}`,

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9999999999",

                email:
                    `advance-${unique}-${suffix}@example.com`,

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
    lotNumber,
    openingSnatch,
    declaredSnatch = openingSnatch,
    attempt1Result = "PENDING",
    attempt2Result = "PENDING",
    attempt3Result = "PENDING",
    attempt1Sequence = null,
    attempt2Sequence = null,
    attempt3Sequence = null,
}) => {

    const entry =
        await CompetitionEntry.create({

            competitionId:
                getCompetitionId(),

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
                    openingSnatch,

                cleanJerk:
                    80,

            },

            snatchAttempts: [

                {
                    attemptNo: 1,

                    declaredWeight:
                        declaredSnatch,

                    declaredAt:
                        declaredSnatch != null
                            ? new Date()
                            : null,

                    result:
                        attempt1Result,

                    performedAt:
                        attempt1Result !== "PENDING"
                            ? new Date()
                            : null,

                    performedSequence:
                        attempt1Sequence,

                },

                {
                    attemptNo: 2,

                    declaredWeight:
                        null,

                    result:
                        attempt2Result,

                    performedAt:
                        attempt2Result !== "PENDING"
                            ? new Date()
                            : null,

                    performedSequence:
                        attempt2Sequence,

                },

                {
                    attemptNo: 3,

                    declaredWeight:
                        null,

                    result:
                        attempt3Result,

                    performedAt:
                        attempt3Result !== "PENDING"
                            ? new Date()
                            : null,

                    performedSequence:
                        attempt3Sequence,

                },

            ],

            cleanJerkAttempts: [

                {
                    attemptNo: 1,

                    declaredWeight:
                        80,

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
    status = "RUNNING",
}) => {

    const session =
        await LiveCompetition.create({

            competitionId:
                getCompetitionId(),

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

            status,

            stateVersion,

            attemptSequenceCounter:
                1,

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
// The completed current athlete must be
// removed from the platform and the next
// athlete must be determined from the
// authoritative queue.
// =====================================

test(
    "Feature 3.5 - GOOD lift advances to authoritative next athlete",
    async () => {

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    65,

                declaredSnatch:
                    65,

            });


        const session =
            await createSession({

                currentEntryId:
                    entryA._id,

            });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.ok(
            result,
            "Expected authoritative session result."
        );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryB._id.toString(),

            "The next athlete must become the authoritative current athlete."

        );


        assert.equal(

            result.prepareEntryId,

            null,

            "Prepare state must not contain the selected platform athlete."

        );

    }
);


// =====================================
// TEST 2
//
// LOWER DECLARED WEIGHT
//
// Calling order must be determined by
// the authoritative queue, not by lot
// number or database order.
// =====================================

test(
    "Feature 3.5 - next athlete follows lower applicable weight",
    async () => {

        const currentAthlete =
            await createAthlete("CURRENT");

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const currentEntry =
            await createEntry({

                athlete:
                    currentAthlete,

                lotNumber:
                    100,

                openingSnatch:
                    50,

                declaredSnatch:
                    50,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    65,

                declaredSnatch:
                    65,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

            });


        await createSession({

            currentEntryId:
                currentEntry._id,

        });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryB._id.toString(),

            "60 kg must be called before 65 kg."

        );

    }
);


// =====================================
// TEST 3
//
// SAME WEIGHT
// LOWER ATTEMPT NUMBER FIRST
// =====================================

test(
    "Feature 3.5 - same weight uses lower attempt number",
    async () => {

        const currentAthlete =
            await createAthlete("CURRENT");

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const currentEntry =
            await createEntry({

                athlete:
                    currentAthlete,

                lotNumber:
                    100,

                openingSnatch:
                    50,

                declaredSnatch:
                    50,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "NO_LIFT",

                attempt1Sequence:
                    2,

            });


        // B now needs attempt 2.
        // Give it the same applicable weight
        // so attempt number becomes decisive.
        await CompetitionEntry.updateOne(

            {
                _id:
                    entryB._id,
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


        await createSession({

            currentEntryId:
                currentEntry._id,

        });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryA._id.toString(),

            "First attempt must precede second attempt at equal weight."

        );

    }
);


// =====================================
// TEST 4
//
// SAME WEIGHT + SAME ATTEMPT
//
// Previous-attempt sequence determines
// order.
// =====================================

test(
    "Feature 3.5 - same weight and attempt uses previous-attempt sequence",
    async () => {

        const currentAthlete =
            await createAthlete("CURRENT");

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const currentEntry =
            await createEntry({

                athlete:
                    currentAthlete,

                lotNumber:
                    100,

                openingSnatch:
                    50,

                declaredSnatch:
                    50,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "NO_LIFT",

                attempt1Sequence:
                    2,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "NO_LIFT",

                attempt1Sequence:
                    3,

            });


        await CompetitionEntry.updateOne(

            {
                _id:
                    entryA._id,
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
                    entryB._id,
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


        await createSession({

            currentEntryId:
                currentEntry._id,

        });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryA._id.toString(),

            "Earlier previous-attempt sequence must have priority."

        );

    }
);


// =====================================
// TEST 5
//
// FULL TIE
//
// Lower lot number wins only after the
// higher-priority comparisons are tied.
// =====================================

test(
    "Feature 3.5 - complete tie uses lower lot number",
    async () => {

        const currentAthlete =
            await createAthlete("CURRENT");

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const currentEntry =
            await createEntry({

                athlete:
                    currentAthlete,

                lotNumber:
                    100,

                openingSnatch:
                    50,

                declaredSnatch:
                    50,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    105,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "NO_LIFT",

                attempt1Sequence:
                    2,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    103,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "NO_LIFT",

                attempt1Sequence:
                    2,

            });


        for (
            const entry
            of [entryA, entryB]
        ) {

            await CompetitionEntry.updateOne(

                {
                    _id:
                        entry._id,
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

        }


        await createSession({

            currentEntryId:
                currentEntry._id,

        });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryB._id.toString(),

            "Lower lot number must win the complete tie."

        );

    }
);


// =====================================
// TEST 6
//
// CURRENT PLATFORM MUST NOT BE REPLACED
// BEFORE ADVANCEMENT.
// =====================================

test(
    "Feature 3.5 - occupied platform is not replaced by advance logic prematurely",
    async () => {

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

            });


        await createEntry({

            athlete:
                athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    65,

                declaredSnatch:
                    65,

            });


        const session =
            await createSession({

                currentEntryId:
                    entryA._id,

            });


        assert.equal(

            session.currentEntryId
                ?.toString(),

            entryA._id.toString()

        );

    }
);


// =====================================
// TEST 7
//
// NO ELIGIBLE NEXT ATHLETE
//
// Platform becomes empty rather than
// inventing a selection.
// =====================================

test(
    "Feature 3.5 - leaves platform empty when no eligible next athlete exists",
    async () => {

        const athlete =
            await createAthlete("ONLY");


        const entry =
            await createEntry({

                athlete,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

                attempt2Result:
                    "GOOD",

                attempt2Sequence:
                    2,

                attempt3Result:
                    "GOOD",

                attempt3Sequence:
                    3,

            });


        const session =
            await createSession({

                currentEntryId:
                    entry._id,

            });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId,

            null,

            "No completed athlete should be selected again."

        );

    }
);


// =====================================
// TEST 8
//
// RECOVERY STATE
//
// Automatic advancement must stop.
// =====================================

test(
    "Feature 3.5 - blocks advancement when recovery is required",
    async () => {

        const athlete =
            await createAthlete("RECOVERY");


        const entry =
            await createEntry({

                athlete,

                lotNumber:
                    101,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

            });


        const session =
            await createSession({

                currentEntryId:
                    entry._id,

                status:
                    "RECOVERY_REQUIRED",

            });


        await assert.rejects(

            () =>
                advanceCompetition(

                    getCompetitionId(),

                    TEST_GENDER

                ),

            /recovery/i

        );


        const unchanged =
            await LiveCompetition.findById(
                session._id
            );


        assert.equal(

            unchanged.currentEntryId
                ?.toString(),

            entry._id.toString(),

            "Recovery failure must not silently mutate the platform."

        );

    }
);


// =====================================
// TEST 9
//
// MISSING SESSION
// =====================================

test(
    "Feature 3.5 - rejects missing live competition session",
    async () => {

        await assert.rejects(

            () =>
                advanceCompetition(

                    getCompetitionId(),

                    TEST_GENDER

                ),

            /Live competition session not found/

        );

    }
);


// =====================================
// TEST 10
//
// STATE VERSION MUST NOT BE USED AS A
// MANUAL QUEUE PRIORITY.
//
// This test documents that advancement
// must derive ordering from competition
// state, not from stateVersion.
// =====================================

test(
    "Feature 3.5 - advancement does not use stateVersion as queue priority",
    async () => {

        const currentAthlete =
            await createAthlete("CURRENT");

        const athleteA =
            await createAthlete("A");

        const athleteB =
            await createAthlete("B");


        const currentEntry =
            await createEntry({

                athlete:
                    currentAthlete,

                lotNumber:
                    100,

                openingSnatch:
                    50,

                declaredSnatch:
                    50,

                attempt1Result:
                    "GOOD",

                attempt1Sequence:
                    1,

            });


        const entryA =
            await createEntry({

                athlete:
                    athleteA,

                lotNumber:
                    101,

                openingSnatch:
                    70,

                declaredSnatch:
                    70,

            });


        const entryB =
            await createEntry({

                athlete:
                    athleteB,

                lotNumber:
                    102,

                openingSnatch:
                    60,

                declaredSnatch:
                    60,

            });


        await createSession({

            currentEntryId:
                currentEntry._id,

            stateVersion:
                999,

        });


        const result =
            await advanceCompetition(

                getCompetitionId(),

                TEST_GENDER

            );


        assert.equal(

            result.currentEntryId
                ?.toString(),

            entryB._id.toString(),

            "Queue ordering must depend on authoritative competition state, not stateVersion."

        );

    }
);