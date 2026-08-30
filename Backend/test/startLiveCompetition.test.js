import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Competition from "../models/Competition.js";
import LiveCompetition from "../models/LiveCompetition.js";

import startLiveCompetition
    from "../services/liveCompetition/startLiveCompetition.js";

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
// DATABASE CLEANUP
// =====================================

test.after(async () => {

    await mongoose.disconnect();

});


// =====================================
// TEST 1
//
// Missing format blocks automatic start.
// =====================================

test(
    "Feature 3.7B - rejects live competition start when format is missing",
    async () => {

        const competition =
            await Competition.create({

                competitionName:
                    "3.7B Missing Format",

                registrationPrefix:
                    `T37BM${Date.now()}`,

                competitionFormat:
                    null,

            });


        await assert.rejects(

            () =>
                startLiveCompetition({

                    competitionId:
                        competition._id,

                    gender:
                        "female",

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


        const session =
            await LiveCompetition.findOne({

                competitionId:
                    competition._id,

                gender:
                    "female",

            });


        assert.equal(
            session,
            null
        );

    }
);


// =====================================
// TEST 2
//
// TOTAL_ONLY is a valid explicit format.
// Model-level contract only.
// =====================================

test(
    "Feature 3.7B - accepts explicitly configured TOTAL_ONLY format",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "3.7B Total Only",

                competitionFormat:
                    "TOTAL_ONLY",

            });


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );


        assert.equal(
            competition.competitionFormat,
            "TOTAL_ONLY"
        );

    }
);


// =====================================
// TEST 3
//
// SEPARATE_LIFT_CLASSIFICATION is valid.
// Model-level contract only.
// =====================================

test(
    "Feature 3.7B - accepts explicitly configured SEPARATE_LIFT_CLASSIFICATION format",
    () => {

        const competition =
            new Competition({

                competitionName:
                    "3.7B Separate Lift",

                competitionFormat:
                    "SEPARATE_LIFT_CLASSIFICATION",

            });


        const validationError =
            competition.validateSync();


        assert.equal(
            validationError,
            undefined
        );


        assert.equal(
            competition.competitionFormat,
            "SEPARATE_LIFT_CLASSIFICATION"
        );

    }
);