import mongoose from "mongoose";

import Competition from "../../models/Competition.js";
import LiveCompetition from "../../models/LiveCompetition.js";


// =====================================
// FEATURE 3.7C
// COMPETITION FORMAT MUTATION
//
// Responsibility:
//
// Establish or change competitionFormat
// BEFORE the competition becomes active.
//
// Valid values:
//
// TOTAL_ONLY
// SEPARATE_LIFT_CLASSIFICATION
//
// Once a live competition session exists
// in an active/historical state, the format
// cannot be changed.
//
// IMPORTANT:
//
// This service is the authoritative mutation
// boundary for competitionFormat.
//
// It does NOT:
//
// - start competition
// - change LiveCompetition state
// - perform phase transition
// - process lifts
// - calculate queue
// =====================================


const VALID_FORMATS = new Set([
    "TOTAL_ONLY",
    "SEPARATE_LIFT_CLASSIFICATION",
]);


const ACTIVE_OR_FINAL_SESSION_STATUSES = new Set([
    "RUNNING",
    "PAUSED",
    "RECOVERY_REQUIRED",
    "FINISHED",
]);


// =====================================
// SET COMPETITION FORMAT
// =====================================

const setCompetitionFormat = async ({
    competitionId,
    competitionFormat,
    dbSession = null,
}) => {

    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (!competitionId) {

        throw new Error(
            "Competition ID is required."
        );

    }


    // =====================================
    // VALIDATE OBJECT ID
    // =====================================

    if (
        !mongoose.Types.ObjectId.isValid(
            competitionId
        )
    ) {

        throw new Error(
            "Invalid competition ID."
        );

    }


    // =====================================
    // NORMALIZE FORMAT
    // =====================================

    const normalizedFormat =
        String(
            competitionFormat ?? ""
        )
            .trim()
            .toUpperCase();


    // =====================================
    // VALIDATE FORMAT
    // =====================================

    if (
        !VALID_FORMATS.has(
            normalizedFormat
        )
    ) {

        const error =
            new Error(
                "Invalid competition format. Allowed values are TOTAL_ONLY or SEPARATE_LIFT_CLASSIFICATION."
            );

        error.code =
            "INVALID_COMPETITION_FORMAT";

        error.statusCode =
            400;

        throw error;

    }


    // =====================================
    // LOAD COMPETITION
    // =====================================

    let competitionQuery =
        Competition.findById(
            competitionId
        );


    if (dbSession) {

        competitionQuery =
            competitionQuery.session(
                dbSession
            );

    }


    const competition =
        await competitionQuery;


    if (!competition) {

        const error =
            new Error(
                "Competition not found."
            );

        error.code =
            "COMPETITION_NOT_FOUND";

        error.statusCode =
            404;

        throw error;

    }


    // =====================================
    // CHECK LIVE COMPETITION SESSIONS
    //
    // A competition may have separate
    // male/female live sessions.
    //
    // Therefore we must inspect ALL sessions
    // belonging to this competition.
    // =====================================

    let sessionQuery =
        LiveCompetition.find({
            competitionId,
        });


    if (dbSession) {

        sessionQuery =
            sessionQuery.session(
                dbSession
            );

    }


    const liveSessions =
        await sessionQuery;


    // =====================================
    // FORMAT IMMUTABILITY
    //
    // Once competition has entered an
    // active or historical live state,
    // competitionFormat cannot change.
    // =====================================

    const lockedSession =
        liveSessions.find(
            (session) =>
                ACTIVE_OR_FINAL_SESSION_STATUSES
                    .has(
                        session.status
                    )
        );


    if (lockedSession) {

        const existingFormat =
            competition.competitionFormat ??
            null;


        // ---------------------------------
        // Same value
        //
        // This is idempotent and harmless.
        // ---------------------------------

        if (
            existingFormat ===
            normalizedFormat
        ) {

            return competition;

        }


        const error =
            new Error(
                "Competition format cannot be changed after the competition has become active."
            );

        error.code =
            "COMPETITION_FORMAT_IMMUTABLE";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // NO ACTIVE/HISTORICAL SESSION
    //
    // Format may be established or changed.
    //
    // This also intentionally permits:
    //
    // null → TOTAL_ONLY
    //
    // for legacy competitions.
    // =====================================

    competition.competitionFormat =
        normalizedFormat;


    // =====================================
    // PERSIST
    // =====================================

    await competition.save({

        session:
            dbSession ?? undefined,

    });


    return competition;

};


// =====================================
// EXPORT
// =====================================

export {

    VALID_FORMATS,

    ACTIVE_OR_FINAL_SESSION_STATUSES,

};


export default setCompetitionFormat;