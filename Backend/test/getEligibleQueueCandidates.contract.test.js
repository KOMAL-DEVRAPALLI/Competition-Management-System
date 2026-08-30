import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Athlete from "../models/Athlete.js";
import Competition from "../models/Competition.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import getEligibleQueueCandidates
    from "../services/liveCompetition/getEligibleQueueCandidates.js";

dotenv.config();


// =====================================
// FEATURE 3.1
// ELIGIBLE QUEUE CANDIDATE CONTRACT
//
// Feature 3.1 owns:
//
// - eligibility
// - current attempt resolution
// - declared weight resolution
//
// Feature 3.2 owns:
//
// - ordering
//
// Therefore these tests verify the
// candidate contract only.
// =====================================


const gender = "female";

let competitionId;

let athleteAId;
let athleteBId;
let athleteCId;

let entryAId;
let entryBId;
let entryCId;

let timestamp;


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


    timestamp =
        Date.now();


    // =================================
    // COMPETITION
    // =================================

    await Competition.create({

        _id:
            competitionId,

        competitionName:
            `Candidate Contract ${timestamp}`,

        registrationPrefix:
            `CQC-${timestamp}`,

        year:
            new Date().getFullYear(),

        competitionFormat:
            "SEPARATE_LIFT_CLASSIFICATION",

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
                    `CQC-A-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Contract Athlete A",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-01"),

                    phone:
                        "9000000001",

                    email:
                        `cqc-a-${timestamp}@test.local`,

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
                    `CQC-B-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Contract Athlete B",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-02"),

                    phone:
                        "9000000002",

                    email:
                        `cqc-b-${timestamp}@test.local`,

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
                    `CQC-C-${timestamp}`,

                competition:
                    competitionId,

                personalInfo: {

                    fullName:
                        "Contract Athlete C",

                    gender:
                        "Female",

                    dob:
                        new Date("2000-01-03"),

                    phone:
                        "9000000003",

                    email:
                        `cqc-c-${timestamp}@test.local`,

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
                        55,

                    cleanJerk:
                        75,

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
    // LIVE SESSION
    // =================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Candidate Contract Test",

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
// HELPER
// =====================================

const getCandidate = async (
    entryId,
    options = {}
) => {

    const result =
        await getEligibleQueueCandidates({

            competitionId,

            gender,

            ...options,

        });


    assert.ok(

        Array.isArray(
            result.candidates
        ),

        "Expected candidates array."

    );


    return result.candidates.find(

        (candidate) =>

            candidate.entryId
                ?.toString() ===
            entryId.toString()

    );

};


// =====================================
// TEST 1
//
// Resolved current attempt fields.
// =====================================

test(
    "Feature 3.1 contract - exposes resolved current attempt fields",
    async () => {

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


        const candidate =
            await getCandidate(
                entryBId
            );


        assert.ok(
            candidate,
            "Expected Athlete B to be eligible."
        );


        assert.equal(
            candidate.phase,
            "SNATCH"
        );


        assert.equal(
            candidate.attemptNo,
            1
        );


        assert.equal(
            candidate.declaredWeight,
            55
        );


        assert.equal(
            candidate.result,
            "PENDING"
        );

    }
);


// =====================================
// TEST 2
//
// Pending declaration is authoritative.
// =====================================

test(
    "Feature 3.1 contract - exposes the pending attempt declaration",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryBId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        57,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                },

            }

        );


        const candidate =
            await getCandidate(
                entryBId
            );


        assert.ok(
            candidate
        );


        assert.equal(
            candidate.attemptNo,
            1
        );


        assert.equal(
            candidate.declaredWeight,
            57
        );


        assert.equal(
            candidate.result,
            "PENDING"
        );

    }
);


// =====================================
// TEST 3
//
// Later attempt must not replace current
// pending attempt.
// =====================================

test(
    "Feature 3.1 contract - later attempt declaration does not replace current attempt",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryBId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "PENDING",

                    "snatchAttempts.0.declaredWeight":
                        55,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                    "snatchAttempts.1.declaredWeight":
                        80,

                    "snatchAttempts.1.declaredAt":
                        new Date(),

                },

            }

        );


        const candidate =
            await getCandidate(
                entryBId
            );


        assert.ok(
            candidate
        );


        assert.equal(
            candidate.attemptNo,
            1
        );


        assert.equal(
            candidate.declaredWeight,
            55
        );

    }
);


// =====================================
// TEST 4
//
// Missing declaration excludes candidate.
// =====================================

test(
    "Feature 3.1 contract - missing declaration excludes candidate",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryCId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        null,

                    "snatchAttempts.0.declaredAt":
                        null,

                },

            }

        );


        const candidate =
            await getCandidate(
                entryCId
            );


        assert.equal(
            candidate,
            undefined
        );

    }
);


// =====================================
// TEST 5
//
// Completed athlete excluded.
// =====================================

test(
    "Feature 3.1 contract - completed athlete is excluded",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryCId,
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


        const candidate =
            await getCandidate(
                entryCId
            );


        assert.equal(
            candidate,
            undefined
        );

    }
);


// =====================================
// TEST 6
//
// Current athlete excluded normally.
// =====================================

test(
    "Feature 3.1 contract - current athlete is excluded normally",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryAId,
            },

            {
                $set: {

                    "snatchAttempts.0.declaredWeight":
                        50,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                    "snatchAttempts.0.result":
                        "PENDING",

                },

            }

        );


        const candidate =
            await getCandidate(

                entryAId,

                {
                    allowCurrentEntry:
                        false,
                }

            );


        assert.equal(
            candidate,
            undefined
        );

    }
);


// =====================================
// TEST 7
//
// Current athlete may re-enter explicitly.
// =====================================

test(
    "Feature 3.1 contract - current athlete may re-enter when explicitly allowed",
    async () => {

        await CompetitionEntry.updateOne(

            {
                _id:
                    entryAId,
            },

            {
                $set: {

                    "snatchAttempts.0.result":
                        "GOOD",

                    "snatchAttempts.0.declaredWeight":
                        50,

                    "snatchAttempts.0.declaredAt":
                        new Date(),

                    "snatchAttempts.0.performedAt":
                        new Date(),

                    "snatchAttempts.0.performedSequence":
                        1,

                    "snatchAttempts.1.result":
                        "PENDING",

                    "snatchAttempts.1.declaredWeight":
                        60,

                    "snatchAttempts.1.declaredAt":
                        new Date(),

                },

            }

        );


        const candidate =
            await getCandidate(

                entryAId,

                {
                    allowCurrentEntry:
                        true,
                }

            );


        assert.ok(
            candidate,
            "Current athlete should be eligible when explicitly allowed."
        );


        assert.equal(
            candidate.phase,
            "SNATCH"
        );


        assert.equal(
            candidate.attemptNo,
            2
        );


        assert.equal(
            candidate.declaredWeight,
            60
        );


        assert.equal(
            candidate.result,
            "PENDING"
        );

    }
);