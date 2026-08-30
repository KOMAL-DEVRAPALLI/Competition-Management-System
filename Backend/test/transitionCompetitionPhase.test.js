import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import CompetitionEntry from "../models/CompetitionEntry.js";
import LiveCompetition from "../models/LiveCompetition.js";

import transitionCompetitionPhase
    from "../services/liveCompetition/transitionCompetitionPhase.js";

dotenv.config();


// =====================================
// CONFIGURATION
// =====================================

const gender = "female";


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
// TEST HELPERS
// =====================================

const uniqueValue = () =>
    `${Date.now()}-${Math.random()}`
        .replace(/\./g, "");


const createCompetition = async (
    competitionFormat
) => {

    return Competition.create({

        competitionName:
            `3.7D Test ${uniqueValue()}`,

        registrationPrefix:
            `T37D${uniqueValue()}`,

        competitionFormat,

    });

};


const createLiveSession = async ({
    competitionId,
    currentPhase = "SNATCH",
    status = "RUNNING",
    stateVersion = 0,
}) => {

    return LiveCompetition.create({

        competitionId,

        gender,

        selectedWeightCategories:
            ["57"],

        currentPhase,

        status,

        stateVersion,

        currentEntryId:
            null,

        prepareEntryId:
            null,

    });

};


const createEntry = async ({
    competitionId,
    snatchResults = [
        "PENDING",
        "PENDING",
        "PENDING",
    ],
    cleanJerkResults = [
        "PENDING",
        "PENDING",
        "PENDING",
    ],
}) => {

    return CompetitionEntry.create({

        competitionId,

        athleteId:
            new mongoose.Types.ObjectId(),

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
                Math.floor(
                    Math.random() * 900
                ) + 100,

        },

        opening: {

            snatch:
                50,

            cleanJerk:
                70,

        },

        snatchAttempts:
            snatchResults.map(
                (result, index) => ({

                    attemptNo:
                        index + 1,

                    declaredWeight:
                        50 + index * 2,

                    result,

                })
            ),

        cleanJerkAttempts:
            cleanJerkResults.map(
                (result, index) => ({

                    attemptNo:
                        index + 1,

                    declaredWeight:
                        70 + index * 2,

                    result,

                })
            ),

    });

};


const cleanupCompetition =
    async (competitionId) => {

        await LiveCompetition.deleteMany({
            competitionId,
        });

        await CompetitionEntry.deleteMany({
            competitionId,
        });

        await Competition.deleteOne({
            _id:
                competitionId,
        });

    };


// =====================================
// TEST 1
//
// Snatch still has pending attempts.
//
// Expected:
// remain SNATCH.
// =====================================

test(
    "Feature 3.7D - remains SNATCH when Snatch is not exhausted",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        const session =
            await createLiveSession({
                competitionId:
                    competition._id,
            });

        await createEntry({
            competitionId:
                competition._id,
        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "SNATCH"
        );

        assert.equal(
            result.stateVersion,
            0
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 2
//
// Snatch exhausted and C&J eligible.
//
// Expected:
// SNATCH → BREAK.
// =====================================

test(
    "Feature 3.7D - transitions SNATCH to BREAK when C&J athlete exists",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        const session =
            await createLiveSession({
                competitionId:
                    competition._id,
            });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "GOOD",
                "GOOD",
                "GOOD",
            ],

            cleanJerkResults: [
                "PENDING",
                "PENDING",
                "PENDING",
            ],

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "BREAK"
        );

        assert.equal(
            result.currentEntryId,
            null
        );

        assert.equal(
            result.stateVersion,
            1
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 3
//
// BREAK → CLEAN_JERK.
// =====================================

test(
    "Feature 3.7D - transitions BREAK to CLEAN_JERK",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

            currentPhase:
                "BREAK",

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "CLEAN_JERK"
        );

        assert.equal(
            result.currentEntryId,
            null
        );

        assert.equal(
            result.stateVersion,
            1
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 4
//
// Snatch exhausted but no athlete may
// continue to C&J.
//
// Expected:
// COMPLETED.
// =====================================

test(
    "Feature 3.7D - transitions SNATCH to COMPLETED when no C&J athlete is eligible",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "NO_LIFT",
                "NO_LIFT",
                "NO_LIFT",
            ],

            cleanJerkResults: [
                "PENDING",
                "PENDING",
                "PENDING",
            ],

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "COMPLETED"
        );

        assert.equal(
            result.status,
            "FINISHED"
        );

        assert.equal(
            result.currentEntryId,
            null
        );

        assert.equal(
            result.stateVersion,
            1
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 5
//
// TOTAL_ONLY:
//
// Three failed Snatches eliminate
// athlete from C&J.
// =====================================

test(
    "Feature 3.7D - TOTAL_ONLY excludes athlete with three failed Snatches",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "NO_LIFT",
                "NO_LIFT",
                "NO_LIFT",
            ],

            cleanJerkResults: [
                "PENDING",
                "PENDING",
                "PENDING",
            ],

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "COMPLETED"
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 6
//
// SEPARATE_LIFT_CLASSIFICATION:
//
// Three failed Snatches do NOT by
// themselves eliminate athlete.
// =====================================

test(
    "Feature 3.7D - SEPARATE_LIFT_CLASSIFICATION allows C&J after three failed Snatches",
    async () => {

        const competition =
            await createCompetition(
                "SEPARATE_LIFT_CLASSIFICATION"
            );

        await createLiveSession({

            competitionId:
                competition._id,

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "NO_LIFT",
                "NO_LIFT",
                "NO_LIFT",
            ],

            cleanJerkResults: [
                "PENDING",
                "PENDING",
                "PENDING",
            ],

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "BREAK"
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 7
//
// Missing competition format.
//
// Expected:
// COMPETITION_FORMAT_REQUIRED.
// =====================================

test(
    "Feature 3.7D - rejects automatic transition when competition format is missing",
    async () => {

        const competition =
            await createCompetition(
                null
            );

        await createLiveSession({

            competitionId:
                competition._id,

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "GOOD",
                "GOOD",
                "GOOD",
            ],

        });


        await assert.rejects(

            () =>
                transitionCompetitionPhase({

                    competitionId:
                        competition._id,

                    gender,

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "COMPETITION_FORMAT_REQUIRED"
                );

                assert.equal(
                    error.statusCode,
                    409
                );

                return true;

            }

        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 8
//
// Recovery required.
//
// Expected:
// transition blocked.
// =====================================

test(
    "Feature 3.7D - blocks transition when recovery is required",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

            status:
                "RECOVERY_REQUIRED",

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "GOOD",
                "GOOD",
                "GOOD",
            ],

        });


        await assert.rejects(

            () =>
                transitionCompetitionPhase({

                    competitionId:
                        competition._id,

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


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 9
//
// COMPLETED is terminal.
//
// Expected:
// no mutation.
// =====================================

test(
    "Feature 3.7D - completed competition is idempotent",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

            currentPhase:
                "COMPLETED",

            status:
                "FINISHED",

            stateVersion:
                7,

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "COMPLETED"
        );

        assert.equal(
            result.status,
            "FINISHED"
        );

        assert.equal(
            result.stateVersion,
            7
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 10
//
// C&J exhausted.
//
// Expected:
// CLEAN_JERK → COMPLETED.
// =====================================

test(
    "Feature 3.7D - transitions exhausted C&J to COMPLETED",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );

        await createLiveSession({

            competitionId:
                competition._id,

            currentPhase:
                "CLEAN_JERK",

        });

        await createEntry({

            competitionId:
                competition._id,

            snatchResults: [
                "GOOD",
                "GOOD",
                "GOOD",
            ],

            cleanJerkResults: [
                "NO_LIFT",
                "NO_LIFT",
                "NO_LIFT",
            ],

        });


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "COMPLETED"
        );

        assert.equal(
            result.status,
            "FINISHED"
        );

        assert.equal(
            result.stateVersion,
            1
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// TEST 11
//
// Current platform and prepare state
// must be cleared on phase transition.
// =====================================

test(
    "Feature 3.7D - clears platform state during phase transition",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        const entry =
            await createEntry({

                competitionId:
                    competition._id,

                snatchResults: [
                    "GOOD",
                    "GOOD",
                    "GOOD",
                ],

            });


        const session =
            await createLiveSession({

                competitionId:
                    competition._id,

            });


        session.currentEntryId =
            entry._id;

        session.prepareEntryId =
            entry._id;

        await session.save();


        const result =
            await transitionCompetitionPhase({

                competitionId:
                    competition._id,

                gender,

            });


        assert.equal(
            result.currentPhase,
            "BREAK"
        );

        assert.equal(
            result.currentEntryId,
            null
        );

        assert.equal(
            result.prepareEntryId,
            null
        );


        await cleanupCompetition(
            competition._id
        );

    }
);


// =====================================
// DATABASE TEARDOWN
// =====================================

test.after(async () => {

    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.disconnect();

    }

});