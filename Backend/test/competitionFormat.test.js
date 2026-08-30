import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Competition from "../models/Competition.js";
import LiveCompetition from "../models/LiveCompetition.js";

import setCompetitionFormat
    from "../services/competition/setCompetitionFormat.js";

dotenv.config();


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
// FEATURE 3.7A
// COMPETITION FORMAT MODEL CONTRACT
//
// Locked values:
//
// TOTAL_ONLY
// SEPARATE_LIFT_CLASSIFICATION
//
// Missing value:
// null
//
// No automatic default.
// =====================================


test(
    "Feature 3.7A - accepts TOTAL_ONLY competition format",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "Format Test",

                competitionFormat:
                    "TOTAL_ONLY",

            });


        assert.equal(
            competition.competitionFormat,
            "TOTAL_ONLY"
        );


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );

    }
);


test(
    "Feature 3.7A - accepts SEPARATE_LIFT_CLASSIFICATION competition format",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "Format Test",

                competitionFormat:
                    "SEPARATE_LIFT_CLASSIFICATION",

            });


        assert.equal(
            competition.competitionFormat,
            "SEPARATE_LIFT_CLASSIFICATION"
        );


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );

    }
);


test(
    "Feature 3.7A - rejects invalid competition format",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "Format Test",

                competitionFormat:
                    "INVALID_FORMAT",

            });


        const validationError =
            competition.validateSync();


        assert.ok(
            validationError
        );


        assert.ok(
            validationError.errors
                .competitionFormat
        );


        assert.equal(
            validationError.errors
                .competitionFormat
                .kind,
            "enum"
        );

    }
);


test(
    "Feature 3.7A - missing competition format remains null",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "Legacy Format Test",

            });


        assert.equal(
            competition.competitionFormat,
            null
        );


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );

    }
);


test(
    "Feature 3.7A - explicit null competition format remains null",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "Legacy Format Test",

                competitionFormat:
                    null,

            });


        assert.equal(
            competition.competitionFormat,
            null
        );


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );

    }
);


// =====================================
// FEATURE 3.7C
// COMPETITION FORMAT MUTATION
//
// Rules:
//
// 1. Format may be established before
//    competition becomes active.
//
// 2. Format may be changed before the
//    competition becomes active.
//
// 3. Once a live session is RUNNING,
//    PAUSED, RECOVERY_REQUIRED or FINISHED,
//    changing the format is forbidden.
//
// 4. Repeating the same format is
//    idempotent.
//
// 5. Invalid formats are rejected.
//
// 6. Unknown competitions are rejected.
// =====================================


// =====================================
// TEST HELPER
// =====================================

const createCompetition =
    async (format = null) => {

        const unique =
            `${Date.now()}-${Math.random()}`
                .replace(/\./g, "");


        return Competition.create({

            competitionName:
                `Feature 3.7C ${unique}`,

            registrationPrefix:
                `F37C${unique}`,

            competitionFormat:
                format,

        });

    };


// =====================================
// TEST 6
//
// Establish format before start.
// =====================================

test(
    "Feature 3.7C - allows establishing format before competition starts",
    async () => {

        const competition =
            await createCompetition(null);


        const result =
            await setCompetitionFormat({

                competitionId:
                    competition._id,

                competitionFormat:
                    "TOTAL_ONLY",

            });


        assert.equal(
            result.competitionFormat,
            "TOTAL_ONLY"
        );


        const saved =
            await Competition.findById(
                competition._id
            ).lean();


        assert.equal(
            saved.competitionFormat,
            "TOTAL_ONLY"
        );


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 7
//
// Change format before start.
// =====================================

test(
    "Feature 3.7C - allows changing format before competition starts",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        const result =
            await setCompetitionFormat({

                competitionId:
                    competition._id,

                competitionFormat:
                    "SEPARATE_LIFT_CLASSIFICATION",

            });


        assert.equal(
            result.competitionFormat,
            "SEPARATE_LIFT_CLASSIFICATION"
        );


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 8
//
// RUNNING locks format.
// =====================================

test(
    "Feature 3.7C - rejects format change during RUNNING competition",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        await LiveCompetition.create({

            competitionId:
                competition._id,

            gender:
                "female",

            status:
                "RUNNING",

            currentPhase:
                "SNATCH",

        });


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        competition._id,

                    competitionFormat:
                        "SEPARATE_LIFT_CLASSIFICATION",

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "COMPETITION_FORMAT_IMMUTABLE"
                );

                assert.equal(
                    error.statusCode,
                    409
                );

                return true;

            }

        );


        await LiveCompetition.deleteMany({
            competitionId:
                competition._id,
        });


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 9
//
// PAUSED locks format.
// =====================================

test(
    "Feature 3.7C - rejects format change during PAUSED competition",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        await LiveCompetition.create({

            competitionId:
                competition._id,

            gender:
                "female",

            status:
                "PAUSED",

            currentPhase:
                "SNATCH",

        });


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        competition._id,

                    competitionFormat:
                        "SEPARATE_LIFT_CLASSIFICATION",

                }),

            /cannot be changed/i

        );


        await LiveCompetition.deleteMany({
            competitionId:
                competition._id,
        });


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 10
//
// RECOVERY_REQUIRED locks format.
//
// Recovery does NOT permit changing
// authoritative competition rules.
// =====================================

test(
    "Feature 3.7C - rejects format change during RECOVERY_REQUIRED state",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        await LiveCompetition.create({

            competitionId:
                competition._id,

            gender:
                "female",

            status:
                "RECOVERY_REQUIRED",

            currentPhase:
                "SNATCH",

        });


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        competition._id,

                    competitionFormat:
                        "SEPARATE_LIFT_CLASSIFICATION",

                }),

            /cannot be changed/i

        );


        await LiveCompetition.deleteMany({
            competitionId:
                competition._id,
        });


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 11
//
// FINISHED locks format.
// =====================================

test(
    "Feature 3.7C - rejects format change after competition is finished",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        await LiveCompetition.create({

            competitionId:
                competition._id,

            gender:
                "female",

            status:
                "FINISHED",

            currentPhase:
                "COMPLETED",

        });


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        competition._id,

                    competitionFormat:
                        "SEPARATE_LIFT_CLASSIFICATION",

                }),

            /cannot be changed/i

        );


        await LiveCompetition.deleteMany({
            competitionId:
                competition._id,
        });


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 12
//
// Same format while RUNNING is
// idempotent.
// =====================================

test(
    "Feature 3.7C - allows idempotent same-format request",
    async () => {

        const competition =
            await createCompetition(
                "TOTAL_ONLY"
            );


        await LiveCompetition.create({

            competitionId:
                competition._id,

            gender:
                "female",

            status:
                "RUNNING",

            currentPhase:
                "SNATCH",

        });


        const result =
            await setCompetitionFormat({

                competitionId:
                    competition._id,

                competitionFormat:
                    "TOTAL_ONLY",

            });


        assert.equal(
            result.competitionFormat,
            "TOTAL_ONLY"
        );


        await LiveCompetition.deleteMany({
            competitionId:
                competition._id,
        });


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 13
//
// Invalid format.
// =====================================

test(
    "Feature 3.7C - rejects invalid competition format",
    async () => {

        const competition =
            await createCompetition(null);


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        competition._id,

                    competitionFormat:
                        "BEST_OF_THREE",

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "INVALID_COMPETITION_FORMAT"
                );

                assert.equal(
                    error.statusCode,
                    400
                );

                return true;

            }

        );


        await Competition.deleteOne({
            _id:
                competition._id,
        });

    }
);


// =====================================
// TEST 14
//
// Unknown competition.
// =====================================

test(
    "Feature 3.7C - rejects unknown competition",
    async () => {

        const fakeCompetitionId =
            new mongoose.Types.ObjectId();


        await assert.rejects(

            () =>
                setCompetitionFormat({

                    competitionId:
                        fakeCompetitionId,

                    competitionFormat:
                        "TOTAL_ONLY",

                }),

            (error) => {

                assert.equal(
                    error.code,
                    "COMPETITION_NOT_FOUND"
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
// DATABASE TEARDOWN
// =====================================

test.after(async () => {

    if (
        mongoose.connection.readyState !== 0
    ) {

        await mongoose.disconnect();

    }

});