import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import advanceCompetition
    from "../services/liveCompetition/advanceCompetition.js";

dotenv.config();


// =====================================
// FEATURE 3.8D-4
// RESTART + INTEGRITY RECOVERY
//
// CONTRACT:
//
// After restart, persisted competition
// history may be incomplete or contradictory.
//
// Automatic progression MUST NOT guess.
//
// Expected safety behavior:
//
//     invalid persisted history
//              ↓
//       RECOVERY_REQUIRED
//              ↓
//       no automatic advance
//
// This contract deliberately corrupts the
// persisted attempt history AFTER the
// authoritative session has been created.
//
// The test verifies that automatic
// advancement refuses to operate on
// incomplete authoritative history.
//
// =====================================


const gender = "female";

let competitionId;
let athleteId;
let entryId;


// =====================================
// ERROR HELPER
// =====================================

const getErrorCode =
    (error) =>
        error?.code ??
        null;


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
            `Restart Integrity ${timestamp}`,

        registrationPrefix:
            `RI-${timestamp}`,

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
                `RI-A-${timestamp}`,

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    "Restart Integrity Athlete",

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9000000021",

                email:
                    `restart-integrity-${timestamp}@test.local`,

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
                        "GOOD",

                    performedAt:
                        new Date(
                            "2026-08-26T10:05:00.000Z"
                        ),

                    performedSequence:
                        1,

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
    // AUTHORITATIVE LIVE SESSION
    // =====================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Restart Integrity Session",

        selectedWeightCategories:
            ["57"],

        currentEntryId:
            entryId,

        currentPhase:
            "SNATCH",

        status:
            "RUNNING",

        stateVersion:
            20,

        attemptSequenceCounter:
            2,

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
// CONTRACT 3.8D-4A
//
// INCOMPLETE ATTEMPT HISTORY
//
// Attempt 2 is deliberately removed.
//
// The competition state says the athlete
// has already performed Attempt 1, but
// authoritative attempt history is now
// incomplete.
//
// Automatic advancement must refuse to
// guess the next state.
// =====================================

test(
    "Feature 3.8D - incomplete persisted attempt history requires recovery",
    async () => {

        // =====================================
        // CORRUPT PERSISTED HISTORY
        // =====================================

        await CompetitionEntry.updateOne(

            {

                _id:
                    entryId,

            },

            {

                $set: {

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
                                1,

                        },

                    ],

                },

            }

        );


        // =====================================
        // SIMULATE RESTART
        //
        // Fresh authoritative reads.
        // =====================================

        const reloadedEntry =
            await CompetitionEntry.findById(
                entryId
            )
            .lean();


        assert.ok(

            reloadedEntry,

            "Competition entry must be recoverable from persisted data."

        );


        assert.equal(

            reloadedEntry
                .snatchAttempts
                .length,

            1,

            "The test must contain deliberately incomplete persisted history."

        );


        const reloadedSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(
            reloadedSession
        );


        assert.equal(

            reloadedSession.integrity.status,

            "VALID",

            "The initial session is intentionally valid before recovery detection."

        );


        // =====================================
        // AUTOMATIC ADVANCEMENT
        //
        // It must NOT guess.
        // =====================================

        await assert.rejects(

            async () => {

                await advanceCompetition(

                    competitionId,

                    gender

                );

            },

            (error) => {

                assert.ok(

                    error,

                    "Automatic advancement must reject incomplete history."

                );


                return true;

            }

        );


        // =====================================
        // VERIFY PLATFORM WAS NOT ADVANCED
        // =====================================

        const afterSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.equal(

            afterSession.currentEntryId
                ?.toString(),

            entryId.toString(),

            "Automatic progression must not move the platform when history is incomplete."

        );


        // =====================================
        // IMPORTANT
        //
        // The state must not be silently
        // repaired by inventing missing
        // attempts.
        // =====================================

        assert.equal(

            afterSession
                .attemptSequenceCounter,

            2,

            "Recovery detection must not advance attemptSequenceCounter."

        );


        assert.equal(

            afterSession.stateVersion,

            20,

            "Recovery detection must not silently advance stateVersion."

        );

    }
);


// =====================================
// CONTRACT 3.8D-4B
//
// CONTRADICTORY PERFORMED HISTORY
//
// A pending attempt cannot have an
// authoritative performedAt or
// performedSequence.
//
// Automatic progression must refuse to
// operate on contradictory history.
// =====================================

test(
    "Feature 3.8D - contradictory persisted attempt history requires recovery",
    async () => {

        // =====================================
        // RESTORE COMPLETE VALID ATTEMPT
        // STRUCTURE FIRST
        // =====================================

        await CompetitionEntry.updateOne(

            {

                _id:
                    entryId,

            },

            {

                $set: {

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
                                1,

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

                            // ---------------------------------
                            // DELIBERATELY CONTRADICTORY
                            // ---------------------------------

                            performedAt:
                                new Date(
                                    "2026-08-26T10:07:00.000Z"
                                ),

                            performedSequence:
                                2,

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


        // =====================================
        // RESTART / RELOAD
        // =====================================

        const reloadedEntry =
            await CompetitionEntry.findById(
                entryId
            )
            .lean();


        assert.ok(
            reloadedEntry
        );


        const contradictoryAttempt =
            reloadedEntry
                .snatchAttempts
                .find(
                    (attempt) =>
                        attempt.attemptNo === 2
                );


        assert.ok(
            contradictoryAttempt
        );


        assert.equal(

            contradictoryAttempt.result,

            "PENDING",

            "Contradictory attempt must remain persisted as supplied."

        );


        assert.ok(

            contradictoryAttempt.performedAt,

            "The contradiction must actually exist for this contract."

        );


        assert.equal(

            contradictoryAttempt.performedSequence,

            2,

            "The contradiction must include a performed sequence."

        );


        // =====================================
        // AUTOMATIC ADVANCEMENT
        //
        // MUST NOT GUESS.
        // =====================================

        await assert.rejects(

            async () => {

                await advanceCompetition(

                    competitionId,

                    gender

                );

            },

            (error) => {

                assert.ok(

                    error,

                    "Automatic progression must reject contradictory history."

                );


                return true;

            }

        );


        // =====================================
        // VERIFY NO AUTOMATIC STATE ADVANCE
        // =====================================

        const afterSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.equal(

            afterSession.currentEntryId
                ?.toString(),

            entryId.toString(),

            "Contradictory history must not cause an automatic platform change."

        );


        assert.equal(

            afterSession.attemptSequenceCounter,

            2,

            "Contradictory history must not advance the attempt counter."

        );


        assert.equal(

            afterSession.stateVersion,

            20,

            "Contradictory history must not silently advance stateVersion."

        );

    }
);


// =====================================
// CONTRACT 3.8D-4C
//
// EXPLICIT RECOVERY STATE
//
// Once authoritative state is marked
// RECOVERY_REQUIRED, automatic advancement
// must remain blocked.
//
// =====================================

test(
    "Feature 3.8D - RECOVERY_REQUIRED state blocks automatic advancement",
    async () => {

        // =====================================
        // MARK SESSION AS RECOVERY REQUIRED
        // =====================================

        await LiveCompetition.updateOne(

            {

                competitionId,

                gender,

            },

            {

                $set: {

                    status:
                        "RECOVERY_REQUIRED",

                    "integrity.status":
                        "RECOVERY_REQUIRED",

                    "integrity.reason":
                        "Authoritative competition history requires manual recovery.",

                    "integrity.detectedAt":
                        new Date(),

                },

            }

        );


        // =====================================
        // RELOAD AFTER RESTART
        // =====================================

        const reloadedSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(
            reloadedSession
        );


        assert.equal(

            reloadedSession.status,

            "RECOVERY_REQUIRED",

            "Recovery status must survive restart."

        );


        assert.equal(

            reloadedSession.integrity.status,

            "RECOVERY_REQUIRED",

            "Integrity recovery state must survive restart."

        );


        // =====================================
        // AUTOMATIC ADVANCEMENT MUST BLOCK
        // =====================================

        await assert.rejects(

            async () => {

                await advanceCompetition(

                    competitionId,

                    gender

                );

            },

            (error) => {

                assert.ok(

                    error,

                    "Automatic advancement must be blocked during recovery."

                );


                return true;

            }

        );


        // =====================================
        // VERIFY STATE REMAINS RECOVERY
        // =====================================

        const finalSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.equal(

            finalSession.status,

            "RECOVERY_REQUIRED",

            "Recovery state must not be cleared automatically."

        );


        assert.equal(

            finalSession.integrity.status,

            "RECOVERY_REQUIRED",

            "Integrity recovery state must not be repaired automatically."

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