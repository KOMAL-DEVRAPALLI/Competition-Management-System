import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "../models/Athlete.js";

import LiveCompetition
    from "../models/LiveCompetition.js";

import updateCurrentPlatformAthlete
    from "../services/liveCompetition/updateCurrentPlatformAthlete.js";

import recalculateQueue
    from "../services/liveCompetition/recalculateQueue.js";

dotenv.config();


// =====================================
// CONFIGURATION
// =====================================

const competitionId =
    "6a6b8799cc18f655c8c486e9";

const gender =
    "female";


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
// Empty platform:
//
// Feature 3.5 must assign the first
// athlete from the authoritative queue.
// =====================================

test(
    "Feature 3.5 - assigns first authoritative queue athlete",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });

        assert.ok(
            session,
            "Expected live competition session."
        );


        const originalCurrentEntryId =
            session.currentEntryId ?? null;

        const originalPrepareEntryId =
            session.prepareEntryId ?? null;

        const originalStateVersion =
            session.stateVersion;


        try {

            // ---------------------------------
            // Force an empty platform for this
            // isolated test scenario.
            // ---------------------------------

            session.currentEntryId = null;

            await session.save();


            const queueState =
                await recalculateQueue({
                    competitionId,
                    gender,
                });


            assert.ok(
                queueState,
                "Expected authoritative queue state."
            );


            assert.ok(
                queueState.queue.length > 0,
                "Expected at least one queue candidate."
            );


            const expectedEntryId =
                queueState.queue[0]
                    .entryId
                    .toString();


            const result =
                await updateCurrentPlatformAthlete(
                    competitionId,
                    gender
                );


            assert.ok(
                result,
                "Expected platform assignment result."
            );


            assert.equal(
                result.assigned,
                true,
                "Expected an athlete to be assigned."
            );


            assert.equal(
                result.reason,
                "ATHLETE_ASSIGNED"
            );


            assert.equal(
                result.currentEntryId
                    .toString(),
                expectedEntryId,
                "Assigned athlete must be the first athlete in the authoritative queue."
            );


            assert.equal(
                result.stateVersion,
                originalStateVersion + 1,
                "State version must increment exactly once after assignment."
            );


            assert.equal(
                result.session.currentEntryId
                    .toString(),
                expectedEntryId
            );

        } finally {

            // ---------------------------------
            // Restore original authoritative
            // state.
            // ---------------------------------

            await LiveCompetition.updateOne(

                {
                    _id:
                        session._id,
                },

                {
                    $set: {

                        currentEntryId:
                            originalCurrentEntryId,

                        prepareEntryId:
                            originalPrepareEntryId,

                        stateVersion:
                            originalStateVersion,

                    },
                }

            );

        }

    }
);


// =====================================
// TEST 2
//
// Occupied platform must NEVER be
// replaced by queue recalculation.
// =====================================

test(
    "Feature 3.5 - preserves occupied platform",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });

        assert.ok(
            session,
            "Expected live competition session."
        );


        assert.ok(
            session.currentEntryId,
            "Fixture must contain a current platform athlete."
        );


        const currentEntryId =
            session.currentEntryId
                .toString();


        const previousVersion =
            session.stateVersion;


        const result =
            await updateCurrentPlatformAthlete(
                competitionId,
                gender
            );


        assert.equal(
            result.assigned,
            false
        );


        assert.equal(
            result.platformPreserved,
            true
        );


        assert.equal(
            result.reason,
            "PLATFORM_OCCUPIED"
        );


        assert.equal(
            result.currentEntryId
                .toString(),
            currentEntryId,
            "Existing platform athlete must not be replaced."
        );


        assert.equal(
            result.session.stateVersion,
            previousVersion,
            "Preserving an occupied platform must not increment stateVersion."
        );

    }
);


// =====================================
// TEST 3
//
// Empty queue must not assign anyone.
// =====================================
//
// IMPORTANT:
//
// This scenario requires an isolated
// competition state with no eligible
// candidates.
//
// We do NOT modify real athlete attempt
// history here.
//
// If the current fixture contains eligible
// candidates, the test is skipped rather
// than corrupting competition data.
// =====================================

test(
    "Feature 3.5 - does not assign when queue is empty",
    async () => {

        const queueState =
            await recalculateQueue({
                competitionId,
                gender,
            });


        assert.ok(
            queueState,
            "Expected authoritative queue state."
        );


        if (
            queueState.queue.length > 0
        ) {

            console.log(
                "Skipping empty-queue assertion: fixture currently has eligible queue candidates."
            );

            return;

        }


        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });


        assert.ok(
            session,
            "Expected live competition session."
        );


        assert.equal(
            session.currentEntryId,
            null,
            "Platform must be empty when queue is empty."
        );


        const previousVersion =
            session.stateVersion;


        const result =
            await updateCurrentPlatformAthlete(
                competitionId,
                gender
            );


        assert.equal(
            result.assigned,
            false
        );


        assert.equal(
            result.reason,
            "QUEUE_EMPTY"
        );


        assert.equal(
            result.currentEntryId,
            null
        );


        assert.equal(
            result.session.stateVersion,
            previousVersion,
            "No assignment must not increment stateVersion."
        );

    }
);


// =====================================
// TEST 4
//
// Missing competition ID.
// =====================================

test(
    "Feature 3.5 - rejects missing competitionId",
    async () => {

        await assert.rejects(

            () =>
                updateCurrentPlatformAthlete(
                    null,
                    gender
                ),

            {
                message:
                    "Competition ID is required."
            }

        );

    }
);


// =====================================
// TEST 5
//
// Missing gender.
// =====================================

test(
    "Feature 3.5 - rejects missing gender",
    async () => {

        await assert.rejects(

            () =>
                updateCurrentPlatformAthlete(
                    competitionId,
                    null
                ),

            {
                message:
                    "Gender is required."
            }

        );

    }
);


// =====================================
// TEST 6
//
// Recovery-required session must block
// automatic platform assignment.
// =====================================

test(
    "Feature 3.5 - blocks RECOVERY_REQUIRED session",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });


        assert.ok(
            session,
            "Expected live competition session."
        );


        const originalStatus =
            session.status;


        try {

            session.status =
                "RECOVERY_REQUIRED";

            await session.save();


            await assert.rejects(

                () =>
                    updateCurrentPlatformAthlete(
                        competitionId,
                        gender
                    ),

                (error) => {

                    assert.equal(
                        error.code,
                        "RECOVERY_REQUIRED"
                    );

                    return true;

                }

            );

        } finally {

            await LiveCompetition.updateOne(

                {
                    _id:
                        session._id,
                },

                {
                    $set: {
                        status:
                            originalStatus,
                    },
                }

            );

        }

    }
);


// =====================================
// TEST 7
//
// Integrity recovery must block
// automatic platform assignment.
// =====================================

test(
    "Feature 3.5 - blocks integrity recovery",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });


        assert.ok(
            session,
            "Expected live competition session."
        );


        const originalIntegrity = {

            status:
                session.integrity?.status ??
                "VALID",

            reason:
                session.integrity?.reason ??
                "",

            detectedAt:
                session.integrity?.detectedAt ??
                null,

        };


        try {

            session.integrity.status =
                "RECOVERY_REQUIRED";

            session.integrity.reason =
                "TEST_RECOVERY";

            session.integrity.detectedAt =
                new Date();

            await session.save();


            await assert.rejects(

                () =>
                    updateCurrentPlatformAthlete(
                        competitionId,
                        gender
                    ),

                (error) => {

                    assert.equal(
                        error.code,
                        "QUEUE_INTEGRITY_ERROR"
                    );

                    return true;

                }

            );

        } finally {

            await LiveCompetition.updateOne(

                {
                    _id:
                        session._id,
                },

                {
                    $set: {

                        "integrity.status":
                            originalIntegrity.status,

                        "integrity.reason":
                            originalIntegrity.reason,

                        "integrity.detectedAt":
                            originalIntegrity.detectedAt,

                    },
                }

            );

        }

    }
);


// =====================================
// TEST 8
//
// preferredEntryId must NEVER override
// authoritative queue ordering.
// =====================================

test(
    "Feature 3.5 - preferredEntryId cannot override queue order",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });


        assert.ok(
            session,
            "Expected live competition session."
        );


        const originalCurrentEntryId =
            session.currentEntryId ?? null;

        const originalPrepareEntryId =
            session.prepareEntryId ?? null;

        const originalStateVersion =
            session.stateVersion;


        try {

            // ---------------------------------
            // Isolate empty-platform scenario.
            // ---------------------------------

            session.currentEntryId = null;

            await session.save();


            const queueState =
                await recalculateQueue({
                    competitionId,
                    gender,
                });


            if (
                queueState.queue.length < 2
            ) {

                console.log(
                    "Skipping preferred-entry test: fixture has fewer than two queue candidates."
                );

                return;

            }


            const expectedEntryId =
                queueState.queue[0]
                    .entryId
                    .toString();


            const preferredEntryId =
                queueState.queue[1]
                    .entryId
                    .toString();


            const result =
                await updateCurrentPlatformAthlete(

                    competitionId,
                    gender,
                    preferredEntryId

                );


            assert.equal(
                result.assigned,
                true
            );


            assert.equal(
                result.currentEntryId
                    .toString(),
                expectedEntryId,
                "preferredEntryId must never bypass authoritative queue ordering."
            );


        } finally {

            await LiveCompetition.updateOne(

                {
                    _id:
                        session._id,
                },

                {
                    $set: {

                        currentEntryId:
                            originalCurrentEntryId,

                        prepareEntryId:
                            originalPrepareEntryId,

                        stateVersion:
                            originalStateVersion,

                    },
                }

            );

        }

    }
);


// =====================================
// TEST 9
//
// Repeated call after assignment must
// preserve the current athlete.
// =====================================

test(
    "Feature 3.5 - repeated assignment preserves current athlete",
    async () => {

        const session =
            await LiveCompetition.findOne({
                competitionId,
                gender,
            });


        assert.ok(
            session,
            "Expected live competition session."
        );


        assert.ok(
            session.currentEntryId,
            "Fixture must contain a current platform athlete."
        );


        const currentEntryId =
            session.currentEntryId
                .toString();


        const previousVersion =
            session.stateVersion;


        const result =
            await updateCurrentPlatformAthlete(
                competitionId,
                gender
            );


        assert.equal(
            result.assigned,
            false
        );


        assert.equal(
            result.reason,
            "PLATFORM_OCCUPIED"
        );


        assert.equal(
            result.currentEntryId
                .toString(),
            currentEntryId,
            "Repeated call must preserve the same athlete."
        );


        assert.equal(
            result.session.stateVersion,
            previousVersion,
            "Repeated platform resolution must not increment stateVersion."
        );

    }
);