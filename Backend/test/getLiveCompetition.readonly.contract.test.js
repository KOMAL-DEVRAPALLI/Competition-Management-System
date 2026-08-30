import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import getLiveCompetition
    from "../services/liveCompetition/getLiveCompetition.js";

dotenv.config();


// =====================================
// FEATURE 3.8A
// GET LIVE COMPETITION MUST BE READ-ONLY
//
// Contract:
//
// GET / live competition may:
//
// - read authoritative state
// - validate persisted state
// - build response
//
// It MUST NOT:
//
// - change currentPhase
// - change status
// - change currentEntryId
// - change stateVersion
// - change attemptSequenceCounter
// - save LiveCompetition
// - automatically transition phase
//
// Phase transitions belong to the
// authoritative transition layer.
// =====================================


const gender = "female";

let competitionId;
let athleteId;
let entryId;
let liveSessionId;

const timestamp = Date.now();


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


    athleteId =
        new mongoose.Types.ObjectId();


    entryId =
        new mongoose.Types.ObjectId();


    // =================================
    // COMPETITION
    // =================================

    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `3.8A Read Only Test ${timestamp}`,

        registrationPrefix:
            `READ-${timestamp}`,

        year:
            new Date().getFullYear(),

        competitionFormat:
            "SEPARATE_LIFT_CLASSIFICATION",

        status:
            "Live",

    });


    // =================================
    // ATHLETE
    // =================================

    await Athlete.create({

        _id:
            athleteId,

        registrationNo:
            `READ-${timestamp}`,

        competition:
            competitionId,

        personalInfo: {

            fullName:
                "3.8A Read Only Athlete",

            gender:
                "Female",

            dob:
                new Date("2000-01-01"),

            phone:
                "9000000001",

            email:
                `readonly-${timestamp}@test.local`,

            address:
                "Read Only Test Address",

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


    // =================================
    // COMPETITION ENTRY
    // =================================

    await CompetitionEntry.create({

        _id:
            entryId,

        competitionId,

        athleteId,

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

    });


    // =================================
    // LIVE SESSION
    // =================================

    const session =
        await LiveCompetition.create({

            competitionId,

            gender,

            sessionName:
                "3.8A Read Only Session",

            selectedWeightCategories:
                ["57"],

            currentEntryId:
                entryId,

            currentPhase:
                "SNATCH",

            status:
                "RUNNING",

            stateVersion:
                17,

            attemptSequenceCounter:
                4,

            integrity: {

                status:
                    "VALID",

                reason:
                    "",

                detectedAt:
                    null,

            },

        });


    liveSessionId =
        session._id;

});


// =====================================
// TEST 1
//
// GET must not mutate currentPhase.
// =====================================

test(
    "Feature 3.8A - GET does not mutate currentPhase",
    async () => {

        const before =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        assert.equal(
            before.currentPhase,
            "SNATCH"
        );


        await getLiveCompetition(
            competitionId,
            gender
        );


        const after =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        assert.equal(
            after.currentPhase,
            "SNATCH",
            "GET must not automatically transition the competition phase."
        );

    }
);


// =====================================
// TEST 2
//
// GET must not mutate stateVersion.
// =====================================

test(
    "Feature 3.8A - GET does not mutate stateVersion",
    async () => {

        const before =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        const beforeVersion =
            before.stateVersion;


        await getLiveCompetition(
            competitionId,
            gender
        );


        const after =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        assert.equal(
            after.stateVersion,
            beforeVersion,
            "GET must never advance stateVersion."
        );

    }
);


// =====================================
// TEST 3
//
// GET must not mutate status.
// =====================================

test(
    "Feature 3.8A - GET does not mutate status",
    async () => {

        const before =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        const beforeStatus =
            before.status;


        await getLiveCompetition(
            competitionId,
            gender
        );


        const after =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        assert.equal(
            after.status,
            beforeStatus,
            "GET must not change competition lifecycle status."
        );

    }
);


// =====================================
// TEST 4
//
// GET must not mutate currentEntryId.
// =====================================

test(
    "Feature 3.8A - GET does not mutate currentEntryId",
    async () => {

        const before =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        const beforeCurrentEntryId =
            before.currentEntryId?.toString() ??
            null;


        await getLiveCompetition(
            competitionId,
            gender
        );


        const after =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        const afterCurrentEntryId =
            after.currentEntryId?.toString() ??
            null;


        assert.equal(
            afterCurrentEntryId,
            beforeCurrentEntryId,
            "GET must not change the authoritative platform athlete."
        );

    }
);


// =====================================
// TEST 5
//
// GET must not mutate attempt sequence.
// =====================================

test(
    "Feature 3.8A - GET does not mutate attemptSequenceCounter",
    async () => {

        const before =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        const beforeSequence =
            before.attemptSequenceCounter;


        await getLiveCompetition(
            competitionId,
            gender
        );


        const after =
            await LiveCompetition.findById(
                liveSessionId
            ).lean();


        assert.equal(
            after.attemptSequenceCounter,
            beforeSequence,
            "GET must not change the authoritative attempt sequence."
        );

    }
);


// =====================================
// TEST 6
//
// GET must return persisted state.
// =====================================

test(
    "Feature 3.8A - GET returns persisted authoritative state",
    async () => {

        const result =
            await getLiveCompetition(
                competitionId,
                gender
            );


        assert.equal(
            result.currentPhase,
            "SNATCH"
        );


        assert.equal(
            result.status,
            "RUNNING"
        );


        assert.equal(
            result.stateVersion,
            17
        );


        assert.equal(
            result.attemptSequenceCounter,
            4
        );


        assert.equal(
            result.currentAthlete
                ?.entryId
                ?.toString(),
            entryId.toString()
        );

    }
);


// =====================================
// TEST 7
//
// Repeated GET calls must be stable.
// =====================================

test(
    "Feature 3.8A - repeated GET calls preserve identical authoritative state",
    async () => {

        const first =
            await getLiveCompetition(
                competitionId,
                gender
            );


        const second =
            await getLiveCompetition(
                competitionId,
                gender
            );


        assert.equal(
            second.currentPhase,
            first.currentPhase
        );


        assert.equal(
            second.status,
            first.status
        );


        assert.equal(
            second.stateVersion,
            first.stateVersion
        );


        assert.equal(
            second.attemptSequenceCounter,
            first.attemptSequenceCounter
        );


        assert.equal(
            second.currentAthlete
                ?.entryId
                ?.toString(),
            first.currentAthlete
                ?.entryId
                ?.toString()
        );

    }
);


// =====================================
// TEST 8
//
// Persisted CLEAN_JERK state must remain
// CLEAN_JERK.
//
// GET must not attempt to reinterpret
// or rewrite it.
// =====================================

test(
    "Feature 3.8A - GET preserves persisted CLEAN_JERK state",
    async () => {

        await LiveCompetition.updateOne(

            {
                _id:
                    liveSessionId,
            },

            {
                $set: {

                    currentPhase:
                        "CLEAN_JERK",

                    stateVersion:
                        25,

                },

            }

        );


        const result =
            await getLiveCompetition(
                competitionId,
                gender
            );


        assert.equal(
            result.currentPhase,
            "CLEAN_JERK"
        );


        assert.equal(
            result.stateVersion,
            25
        );


        const persisted =
            await LiveCompetition
                .findById(
                    liveSessionId
                )
                .lean();


        assert.equal(
            persisted.currentPhase,
            "CLEAN_JERK"
        );


        assert.equal(
            persisted.stateVersion,
            25
        );

    }
);


// =====================================
// TEST 9
//
// RECOVERY_REQUIRED state must not be
// automatically repaired by GET.
// =====================================

test(
    "Feature 3.8A - GET does not repair RECOVERY_REQUIRED state",
    async () => {

        await LiveCompetition.updateOne(

            {
                _id:
                    liveSessionId,
            },

            {
                $set: {

                    status:
                        "RECOVERY_REQUIRED",

                    currentPhase:
                        "SNATCH",

                    stateVersion:
                        31,

                    "integrity.status":
                        "RECOVERY_REQUIRED",

                    "integrity.reason":
                        "Test recovery condition",

                },

            }

        );


        const result =
            await getLiveCompetition(
                competitionId,
                gender
            );


        assert.equal(
            result.status,
            "RECOVERY_REQUIRED"
        );


        assert.equal(
            result.currentPhase,
            "SNATCH"
        );


        assert.equal(
            result.stateVersion,
            31
        );


        const persisted =
            await LiveCompetition
                .findById(
                    liveSessionId
                )
                .lean();


        assert.equal(
            persisted.status,
            "RECOVERY_REQUIRED"
        );


        assert.equal(
            persisted.currentPhase,
            "SNATCH"
        );


        assert.equal(
            persisted.stateVersion,
            31
        );


        assert.equal(
            persisted.integrity?.status,
            "RECOVERY_REQUIRED"
        );

    }
);


// =====================================
// CLEANUP
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

            competition:
                competitionId,

        });


        await Competition.deleteOne({

            _id:
                competitionId,

        });

    }


    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.connection.close();

    }

});