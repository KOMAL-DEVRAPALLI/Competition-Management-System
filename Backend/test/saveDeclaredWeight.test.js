import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import saveDeclaration
    from "../services/liveCompetition/saveDeclaration.js";

dotenv.config();


// =====================================
// TEST FIXTURE
// =====================================

let fixtureCompetitionId;
let athleteAId;
let athleteBId;
let entryAId;
let entryBId;


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


    // ---------------------------------
    // Create isolated competition ID
    // ---------------------------------

    fixtureCompetitionId =
        new mongoose.Types.ObjectId();


    // ---------------------------------
    // Create athletes
    // ---------------------------------

    const athletes =
        await Athlete.create([

            {
                registrationNo:
                    `TEST-36-A-${Date.now()}`,

                competition:
                    fixtureCompetitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.6 Athlete A",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9999999991",

                    email:
                        `feature36a-${Date.now()}@test.local`,

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
                    `TEST-36-B-${Date.now()}`,

                competition:
                    fixtureCompetitionId,

                personalInfo: {

                    fullName:
                        "Feature 3.6 Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9999999992",

                    email:
                        `feature36b-${Date.now()}@test.local`,

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


    // ---------------------------------
    // Create competition entries
    // ---------------------------------

    const entries =
        await CompetitionEntry.create([

            {

                competitionId:
                    fixtureCompetitionId,

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

                    },

                ],

                cleanJerkAttempts: [

                    {
                        attemptNo:
                            1,

                        declaredWeight:
                            null,

                        declaredAt:
                            null,

                        result:
                            "PENDING",

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

                    },

                ],

            },

            {

                competitionId:
                    fixtureCompetitionId,

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
                        65,

                    cleanJerk:
                        85,

                },

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

                    },

                ],

                cleanJerkAttempts: [

                    {
                        attemptNo:
                            1,

                        declaredWeight:
                            null,

                        declaredAt:
                            null,

                        result:
                            "PENDING",

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

                    },

                ],

            },

        ]);


    entryAId =
        entries[0]._id;

    entryBId =
        entries[1]._id;


    // ---------------------------------
    // Create live competition session
    // ---------------------------------

    await LiveCompetition.create({

        competitionId:
            fixtureCompetitionId,

        gender:
            "female",

        sessionName:
            "Feature 3.6 Test Session",

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

    if (!fixtureCompetitionId) {

        await mongoose.disconnect();

        return;

    }


    await LiveCompetition.deleteMany({

        competitionId:
            fixtureCompetitionId,

    });


    await CompetitionEntry.deleteMany({

        competitionId:
            fixtureCompetitionId,

    });


    await Athlete.deleteMany({

        _id: {

            $in: [

                athleteAId,
                athleteBId,

            ],

        },

    });


    await mongoose.disconnect();

});


// =====================================
// HELPERS
// =====================================

const getSession = async () => {

    const session =
        await LiveCompetition.findOne({

            competitionId:
                fixtureCompetitionId,

            gender:
                "female",

        }).lean();


    assert.ok(

        session,

        "Expected Feature 3.6 live competition session."

    );


    return session;

};


const getEntry = async (entryId) => {

    const entry =
        await CompetitionEntry.findById(
            entryId
        ).lean();


    assert.ok(

        entry,

        "Expected Feature 3.6 competition entry."

    );


    return entry;

};


// =====================================
// TEST 1
//
// Save first declaration.
// =====================================

test(
    "Feature 3.6 - saves declaration for current attempt",
    async () => {

        const session =
            await getSession();


        const result =
            await saveDeclaration({

                entryId:
                    entryBId,

                competitionId:
                    fixtureCompetitionId,

                gender:
                    "female",

                declaredWeight:
                    65,

                expectedStateVersion:
                    session.stateVersion,

            });


        assert.equal(

            result.declaredWeight,

            65

        );


        assert.equal(

            result.phase,

            "SNATCH"

        );


        assert.equal(

            result.attemptNo,

            1

        );


        assert.equal(

            result.stateVersion,

            session.stateVersion + 1

        );


        const entry =
            await getEntry(entryBId);


        assert.equal(

            entry.snatchAttempts[0]
                .declaredWeight,

            65

        );


        assert.ok(

            entry.snatchAttempts[0]
                .declaredAt,

            "Declaration timestamp must be stored."

        );

    }
);


// =====================================
// TEST 2
//
// Edit pending declaration.
// =====================================

test(
    "Feature 3.6 - allows editing pending declaration",
    async () => {

        const session =
            await getSession();


        const result =
            await saveDeclaration({

                entryId:
                    entryBId,

                competitionId:
                    fixtureCompetitionId,

                gender:
                    "female",

                declaredWeight:
                    70,

                expectedStateVersion:
                    session.stateVersion,

            });


        assert.equal(

            result.declaredWeight,

            70

        );


        const entry =
            await getEntry(entryBId);


        assert.equal(

            entry.snatchAttempts[0]
                .declaredWeight,

            70,

            "Pending declaration should be editable."

        );

    }
);


// =====================================
// TEST 3
//
// State version must advance.
// =====================================

test(
    "Feature 3.6 - increments state version",
    async () => {

        const sessionBefore =
            await getSession();


        const result =
            await saveDeclaration({

                entryId:
                    entryAId,

                competitionId:
                    fixtureCompetitionId,

                gender:
                    "female",

                declaredWeight:
                    60,

                expectedStateVersion:
                    sessionBefore.stateVersion,

            });


        assert.equal(

            result.stateVersion,

            sessionBefore.stateVersion + 1

        );


        const sessionAfter =
            await getSession();


        assert.equal(

            sessionAfter.stateVersion,

            sessionBefore.stateVersion + 1

        );

    }
);


// =====================================
// TEST 4
//
// Stale Officials Screen state.
// =====================================

test(
    "Feature 3.6 - rejects stale state version",
    async () => {

        const session =
            await getSession();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryAId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        62,

                    expectedStateVersion:
                        session.stateVersion - 1,

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
// TEST 5
//
// Invalid declared weight.
// =====================================

test(
    "Feature 3.6 - rejects invalid declared weight",
    async () => {

        const session =
            await getSession();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryAId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        0,

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Invalid declared weight/

        );

    }
);


// =====================================
// TEST 6
//
// Missing state version.
// =====================================

test(
    "Feature 3.6 - rejects missing expected state version",
    async () => {

        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryAId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        60,

                }),

            /expectedStateVersion must be a non-negative integer/

        );

    }
);


// =====================================
// TEST 7
//
// Unknown entry.
// =====================================

test(
    "Feature 3.6 - rejects unknown competition entry",
    async () => {

        const session =
            await getSession();


        const fakeEntryId =
            new mongoose.Types.ObjectId();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        fakeEntryId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        60,

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /Competition entry not found/

        );

    }
);


// =====================================
// TEST 8
//
// Declaration must not replace platform
// athlete.
// =====================================

test(
    "Feature 3.6 - preserves occupied platform",
    async () => {

        const sessionBefore =
            await getSession();


        assert.equal(

            sessionBefore.currentEntryId
                .toString(),

            entryAId.toString()

        );


        await saveDeclaration({

            entryId:
                entryBId,

            competitionId:
                fixtureCompetitionId,

            gender:
                "female",

            declaredWeight:
                75,

            expectedStateVersion:
                sessionBefore.stateVersion,

        });


        const sessionAfter =
            await getSession();


        assert.equal(

            sessionAfter.currentEntryId
                .toString(),

            entryAId.toString(),

            "Declaration change must not replace the athlete on the platform."

        );

    }
);


// =====================================
// TEST 9
//
// Wrong phase.
// =====================================

test(
    "Feature 3.6 - rejects declaration when athlete is in another phase",
    async () => {

        const entry =
            await CompetitionEntry.findById(
                entryAId
            );


        assert.ok(entry);


        entry.snatchAttempts =
            entry.snatchAttempts.map(
                (attempt) => ({

                    ...attempt.toObject(),

                    result:
                        "GOOD",

                })
            );


        await entry.save();


        const session =
            await getSession();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryAId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        90,

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /CLEAN_JERK|current phase/

        );

    }
);


// =====================================
// TEST 10
//
// Completed athlete cannot be declared.
// =====================================

test(
    "Feature 3.6 - rejects declaration for completed athlete",
    async () => {

        const entry =
            await CompetitionEntry.findById(
                entryAId
            );


        assert.ok(entry);


        entry.cleanJerkAttempts =
            entry.cleanJerkAttempts.map(
                (attempt) => ({

                    ...attempt.toObject(),

                    result:
                        "GOOD",

                })
            );


        await entry.save();


        const session =
            await getSession();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryAId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        95,

                    expectedStateVersion:
                        session.stateVersion,

                }),

            /completed the competition/

        );

    }
);


// =====================================
// TEST 11
//
// Recovery-required session.
// =====================================

test(
    "Feature 3.6 - rejects declaration when recovery is required",
    async () => {

        const session =
            await getSession();


        await LiveCompetition.updateOne(

            {
                _id:
                    session._id,
            },

            {
                $set: {

                    status:
                        "RECOVERY_REQUIRED",

                },

            }

        );


        const updatedSession =
            await getSession();


        await assert.rejects(

            () =>
                saveDeclaration({

                    entryId:
                        entryBId,

                    competitionId:
                        fixtureCompetitionId,

                    gender:
                        "female",

                    declaredWeight:
                        80,

                    expectedStateVersion:
                        updatedSession.stateVersion,

                }),

            /recovery|RECOVERY_REQUIRED/i

        );

    }
);