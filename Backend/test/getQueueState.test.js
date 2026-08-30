import test from "node:test";
import assert from "node:assert/strict";

import dotenv from "dotenv";
import mongoose from "mongoose";

import "../models/Athlete.js";

import LiveCompetition
    from "../models/LiveCompetition.js";

import getQueueState
    from "../services/liveCompetition/getQueueState.js";

dotenv.config();


const competitionId =
    "6a6b8799cc18f655c8c486e9";

const gender =
    "female";


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


test.after(async () => {

    await mongoose.disconnect();

});


// =====================================
// TEST 1
//
// Current / next / upcoming are exposed.
// =====================================

test(
    "Feature 3.4 - exposes current, next and upcoming",
    async () => {

        const session =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            }).lean();


        assert.ok(
            session,
            "Expected live competition session."
        );


        const state =
            await getQueueState({

                competitionId,

                gender,

            });


        assert.equal(

            state.currentPhase,

            session.currentPhase

        );


        assert.equal(

            state.stateVersion,

            session.stateVersion

        );


        assert.ok(
            Array.isArray(
                state.queue
            )
        );


        assert.ok(
            Array.isArray(
                state.upcoming
            )
        );


        // ---------------------------------
        // If platform is occupied,
        // current must match session state.
        // ---------------------------------

        if (
            session.currentEntryId
        ) {

            assert.ok(
                state.current,
                "Expected current athlete."
            );


            assert.equal(

                state.current.entryId
                    .toString(),

                session.currentEntryId
                    .toString()

            );


            assert.equal(

                state.current.status,

                "ON_PLATFORM"

            );

        }

    }
);


// =====================================
// TEST 2
//
// Next athlete is first queue athlete.
// =====================================

test(
    "Feature 3.4 - next matches first waiting queue athlete",
    async () => {

        const state =
            await getQueueState({

                competitionId,

                gender,

            });


        if (
            state.queue.length === 0
        ) {

            assert.equal(
                state.next,
                null
            );

            return;

        }


        assert.ok(
            state.next,
            "Expected next athlete."
        );


        assert.equal(

            state.next.entryId
                .toString(),

            state.queue[0].entryId
                .toString(),

            "Next athlete must be first athlete in authoritative queue."

        );


        assert.equal(
            state.next.status,
            "NEXT"
        );

    }
);


// =====================================
// TEST 3
//
// Upcoming is queue after next.
// =====================================

test(
    "Feature 3.4 - upcoming follows next in queue order",
    async () => {

        const state =
            await getQueueState({

                competitionId,

                gender,

            });


        const expectedUpcoming =
            state.queue
                .slice(1)
                .map(
                    (entry) =>
                        entry.entryId
                            .toString()
                );


        const actualUpcoming =
            state.upcoming
                .map(
                    (entry) =>
                        entry.entryId
                            .toString()
                );


        assert.deepEqual(

            actualUpcoming,

            expectedUpcoming

        );

    }
);


// =====================================
// TEST 4
//
// Read-only guarantee.
//
// Calling Feature 3.4 must not change
// authoritative platform or version.
// =====================================

test(
    "Feature 3.4 - does not mutate authoritative state",
    async () => {

        const before =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            }).lean();


        assert.ok(
            before
        );


        await getQueueState({

            competitionId,

            gender,

        });


        const after =
            await LiveCompetition.findOne({

                competitionId,

                gender,

            }).lean();


        assert.equal(

            after.currentEntryId
                ?.toString() ?? null,

            before.currentEntryId
                ?.toString() ?? null

        );


        assert.equal(

            after.stateVersion,

            before.stateVersion

        );

    }
);


// =====================================
// TEST 5
//
// Recovery state must not expose a
// guessed queue.
// =====================================

test(
    "Feature 3.4 - blocks recovery-required session",
    async () => {

        const originalFindOne =
            LiveCompetition.findOne;


        const session = {

            competitionId:
                new mongoose.Types.ObjectId(
                    competitionId
                ),

            gender,

            currentPhase:
                "SNATCH",

            currentEntryId:
                null,

            status:
                "RECOVERY_REQUIRED",

            stateVersion:
                100,

            selectedWeightCategories:
                [],

            sessionName:
                "",

            integrity: {

                status:
                    "VALID",

                reason:
                    "",

                detectedAt:
                    null,

            },

        };


        LiveCompetition.findOne =
            () => ({

                then(
                    resolve,
                    reject
                ) {

                    return Promise
                        .resolve(session)
                        .then(
                            resolve,
                            reject
                        );

                },

            });


        try {

            await assert.rejects(

                () =>
                    getQueueState({

                        competitionId,

                        gender,

                    }),

                (error) => {

                    assert.equal(

                        error.code,

                        "RECOVERY_REQUIRED"

                    );

                    return true;

                }

            );

        } finally {

            LiveCompetition.findOne =
                originalFindOne;

        }

    }
);