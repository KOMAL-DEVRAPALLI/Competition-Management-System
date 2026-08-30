import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import Athlete from "../models/Athlete.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import {
    assertStateVersion,
} from "../services/liveCompetition/state/stateVersion.js";

dotenv.config();


// =====================================
// FEATURE 3.8D-3
// RESTART + STALE STATE PROTECTION
//
// CONTRACT:
//
// Officials Screen reads stateVersion N.
//
// Server/application restarts.
//
// Persisted state is reconstructed from
// MongoDB.
//
// The authoritative version must remain N
// or greater; restart must never reset it.
//
// A request carrying an older version must
// still be rejected as STALE_STATE.
//
// =====================================

const gender = "female";

let competitionId;
let athleteId;
let entryId;


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
            `Restart Stale State ${timestamp}`,

        registrationPrefix:
            `RSS-${timestamp}`,

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
                `RSS-A-${timestamp}`,

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    "Restart Stale State Athlete",

                gender:
                    "Female",

                dob:
                    new Date("2000-01-01"),

                phone:
                    "9000000011",

                email:
                    `restart-stale-${timestamp}@test.local`,

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

            status:
                "READY",

        });


    entryId =
        entry._id;


    // =====================================
    // AUTHORITATIVE SESSION
    //
    // Version 14 represents the state
    // observed by the Officials Screen.
    // =====================================

    await LiveCompetition.create({

        competitionId,

        gender,

        sessionName:
            "Restart Stale State Session",

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
// CONTRACT
//
// Restart must preserve the authoritative
// state version.
// =====================================

test(
    "Feature 3.8D - restart preserves stateVersion used for stale-state protection",
    async () => {

        // =====================================
        // OFFICIALS SCREEN SNAPSHOT
        // =====================================

        const officialsObservedState =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(

            officialsObservedState,

            "Live competition session must exist."

        );


        const officialsStateVersion =
            officialsObservedState
                .stateVersion;


        assert.equal(

            officialsStateVersion,

            14,

            "Officials Screen must initially observe stateVersion 14."

        );


        // =====================================
        // SIMULATE SERVER-SIDE STATE CHANGE
        //
        // This represents an accepted
        // state-changing action that occurred
        // before/around the restart.
        //
        // Version becomes 15.
        // =====================================

        await LiveCompetition.updateOne(

            {

                competitionId,

                gender,

                stateVersion:
                    officialsStateVersion,

            },

            {

                $set: {

                    stateVersion:
                        officialsStateVersion + 1,

                },

            }

        );


        // =====================================
        // SIMULATE APPLICATION RESTART
        //
        // Do NOT reuse the old document.
        // Reload from MongoDB.
        // =====================================

        const reloadedSession =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            });


        assert.ok(

            reloadedSession,

            "Authoritative state must be recoverable after restart."

        );


        assert.equal(

            reloadedSession.stateVersion,

            15,

            "Restart must preserve the latest persisted stateVersion."

        );


        // =====================================
        // OLD OFFICIALS REQUEST
        //
        // The Officials Screen still has
        // version 14.
        //
        // Backend is now at version 15.
        // =====================================

        assert.throws(

            () => {

                assertStateVersion(

                    reloadedSession,

                    officialsStateVersion

                );

            },

            (error) => {

                assert.equal(

                    error.code,

                    "STALE_STATE",

                    "Older Officials Screen state must be rejected as STALE_STATE."

                );


                assert.equal(

                    error.statusCode,

                    409,

                    "STALE_STATE must return conflict semantics."

                );


                assert.equal(

                    error.expectedStateVersion,

                    14,

                    "Error must report the stale expected version."

                );


                assert.equal(

                    error.currentStateVersion,

                    15,

                    "Error must report the authoritative persisted version."

                );


                return true;

            }

        );

    }
);


// =====================================
// CONTRACT
//
// Restart must never reset stateVersion
// back to its default.
// =====================================

test(
    "Feature 3.8D - restart never resets persisted stateVersion",
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


        assert.equal(

            before.stateVersion,

            15,

            "Persisted stateVersion must be 15 before reload."

        );


        // =====================================
        // Fresh MongoDB read
        // =====================================

        const after =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            })
            .lean();


        assert.ok(
            after
        );


        assert.equal(

            after.stateVersion,

            before.stateVersion,

            "Restart/reload must not reset stateVersion."

        );


        assert.ok(

            after.stateVersion > 0,

            "A running competition must not lose its authoritative version during restart."

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