// =====================================
// GET CURRENT AUTHORITATIVE ATTEMPT
//
// FEATURE 4.x
// AUTHORITATIVE ATTEMPT STATE RESOLUTION
//
// Responsibility:
//
// 1. Validate authoritative attempt history.
// 2. Validate chronological attempt
//    progression within the requested phase.
// 3. Determine the first incomplete attempt
//    within the requested competition phase.
// 4. Preserve authoritative attempt number
//    and declaration.
// 5. Never mutate competition state.
//
// IMPORTANT:
//
// This function does NOT:
// - sort athletes
// - choose the next athlete
// - assign currentEntryId
// - change declarations
// - change results
// - advance competition phase
//
// Queue ordering belongs to the queue engine.
// Eligibility belongs to the eligibility layer.
// Phase transition belongs to the phase-transition
// logic.
//
// Missing or contradictory history MUST result
// in integrityError.
// The resolver must never guess.
// =====================================


// =====================================
// CREATE RESULT WITH INTEGRITY ERROR
// =====================================

const integrityResult = (
    phase,
    message
) => {

    return {

        completed: false,

        phase,

        attemptNo: null,

        declaredWeight: null,

        declaredAt: null,

        result: null,

        integrityError:
            message,

    };

};


// =====================================
// VALIDATE ONE PHASE'S ATTEMPT HISTORY
// =====================================
//
// This validates the structure and internal
// consistency of one phase.
//
// It does NOT decide which phase is active.
//
// It does NOT mutate the attempts.
//
// =====================================

const validateAttemptHistory = (
    attempts,
    phase
) => {

    // =====================================
    // ARRAY VALIDATION
    // =====================================

    if (!Array.isArray(attempts)) {

        return (
            `${phase} attempt history is missing.`
        );

    }


    // =====================================
    // EXACTLY THREE ATTEMPTS
    // =====================================

    if (attempts.length !== 3) {

        return (
            `${phase} attempt history must contain exactly 3 attempts.`
        );

    }


    // =====================================
    // ATTEMPT NUMBER VALIDATION
    // =====================================

    const seenAttemptNumbers =
        new Set();


    for (
        const attempt
        of attempts
    ) {

        const attemptNo =
            attempt?.attemptNo;


        if (
            !Number.isInteger(attemptNo) ||
            attemptNo < 1 ||
            attemptNo > 3
        ) {

            return (
                `${phase} contains an invalid attempt number.`
            );

        }


        if (
            seenAttemptNumbers.has(
                attemptNo
            )
        ) {

            return (
                `${phase} contains duplicate attempt ${attemptNo}.`
            );

        }


        seenAttemptNumbers.add(
            attemptNo
        );


        // =================================
        // RESULT VALIDATION
        // =================================

        const result =
            attempt?.result;


        if (
            result !== "PENDING" &&
            result !== "GOOD" &&
            result !== "NO_LIFT"
        ) {

            return (
                `${phase} attempt ${attemptNo} has an invalid result.`
            );

        }


        // =================================
        // PENDING ATTEMPT
        //
        // A pending attempt has not actually
        // been performed yet.
        // =================================

        if (
            result === "PENDING"
        ) {

            if (
                attempt?.performedAt !== null &&
                attempt?.performedAt !== undefined
            ) {

                return (
                    `${phase} attempt ${attemptNo} is PENDING but has performedAt.`
                );

            }


            if (
                attempt?.performedSequence !== null &&
                attempt?.performedSequence !== undefined
            ) {

                return (
                    `${phase} attempt ${attemptNo} is PENDING but has performedSequence.`
                );

            }

        }


        // =================================
        // PERFORMED ATTEMPT
        //
        // GOOD / NO_LIFT must have
        // authoritative execution history.
        // =================================

        if (
            result === "GOOD" ||
            result === "NO_LIFT"
        ) {

            if (
                !attempt?.performedAt
            ) {

                return (
                    `${phase} attempt ${attemptNo} is ${result} but performedAt is missing.`
                );

            }


            if (
                !Number.isInteger(
                    attempt?.performedSequence
                ) ||
                attempt.performedSequence < 1
            ) {

                return (
                    `${phase} attempt ${attemptNo} is ${result} but performedSequence is invalid.`
                );

            }

        }

    }


    // =====================================
    // ALL ATTEMPT NUMBERS 1–3 REQUIRED
    // =====================================

    for (
        let attemptNo = 1;
        attemptNo <= 3;
        attemptNo += 1
    ) {

        if (
            !seenAttemptNumbers.has(
                attemptNo
            )
        ) {

            return (
                `${phase} attempt ${attemptNo} is missing from authoritative attempt history.`
            );

        }

    }


    // =====================================
    // ORDER ATTEMPTS BY ATTEMPT NUMBER
    //
    // Sort a copy only.
    // Never mutate persisted history.
    // =====================================

    const orderedAttempts =
        [...attempts].sort(
            (a, b) =>
                a.attemptNo -
                b.attemptNo
        );


    // =====================================
    // CHRONOLOGICAL PROGRESSION VALIDATION
    //
    // A later attempt cannot be performed
    // while an earlier attempt remains
    // pending.
    //
    // Valid:
    //
    // PENDING
    // PENDING
    // PENDING
    //
    // GOOD
    // PENDING
    // PENDING
    //
    // GOOD
    // NO_LIFT
    // PENDING
    //
    // GOOD
    // GOOD
    // NO_LIFT
    //
    // Invalid:
    //
    // PENDING
    // GOOD
    // PENDING
    //
    // GOOD
    // PENDING
    // NO_LIFT
    // =====================================

    let foundPending =
        false;


    for (
        const attempt
        of orderedAttempts
    ) {

        if (
            attempt.result ===
            "PENDING"
        ) {

            foundPending = true;

            continue;

        }


        // ---------------------------------
        // A performed attempt after a
        // pending attempt is contradictory.
        // ---------------------------------

        if (
            foundPending
        ) {

            return (
                `${phase} attempt history is contradictory: attempt ${attempt.attemptNo} is ${attempt.result} after an earlier attempt is still PENDING.`
            );

        }

    }


    // =====================================
    // PERFORMED SEQUENCE VALIDATION
    //
    // Sequence values must be unique
    // within this phase.
    //
    // The global sequence ordering is
    // maintained by LiveCompetition.
    //
    // This function only validates that
    // the phase does not contain duplicate
    // historical sequence values.
    // =====================================

    const performedSequences =
        new Set();


    for (
        const attempt
        of orderedAttempts
    ) {

        if (
            attempt.result !== "GOOD" &&
            attempt.result !== "NO_LIFT"
        ) {

            continue;

        }


        const sequence =
            attempt.performedSequence;


        if (
            performedSequences.has(
                sequence
            )
        ) {

            return (
                `${phase} contains duplicate performedSequence ${sequence}.`
            );

        }


        performedSequences.add(
            sequence
        );

    }


    return null;

};


// =====================================
// FIND FIRST INCOMPLETE ATTEMPT
// =====================================
//
// Assumes attempt history has already
// passed integrity validation.
//
// IMPORTANT:
//
// This function:
// - does not mutate persisted history
// - does not determine competition phase
// - does not perform queue ordering
//
// It simply resolves the first PENDING
// attempt within the requested phase.
// =====================================

const findFirstIncompleteAttempt = (
    attempts,
    phase
) => {

    // -------------------------------------
    // Sort a COPY only.
    // -------------------------------------

    const orderedAttempts =
        [...attempts].sort(
            (a, b) =>
                a.attemptNo -
                b.attemptNo
        );


    // =====================================
    // FIND FIRST PENDING ATTEMPT
    // =====================================

    for (
        const attempt
        of orderedAttempts
    ) {

        if (
            attempt.result ===
            "PENDING"
        ) {

            return {

                completed: false,

                phase,

                attemptNo:
                    attempt.attemptNo,

                declaredWeight:
                    attempt.declaredWeight ??
                    null,

                declaredAt:
                    attempt.declaredAt ??
                    null,

                result:
                    attempt.result,

            };

        }

    }


    // =====================================
    // NO PENDING ATTEMPT
    // =====================================

    return null;

};


// =====================================
// GET CURRENT AUTHORITATIVE ATTEMPT
//
// PHASE-SCOPED
//
// Caller MUST explicitly provide:
//
// "SNATCH"
//
// or
//
// "CLEAN_JERK"
//
// This function does not decide whether
// the competition should transition from
// Snatch to Clean & Jerk.
// =====================================

const getCurrentAttempt = (
    competitionEntry,
    phase
) => {

    // =====================================
    // INVALID ENTRY
    // =====================================

    if (!competitionEntry) {

        return integrityResult(
            phase ?? null,
            "Competition entry is missing."
        );

    }


    // =====================================
    // VALIDATE PHASE
    // =====================================

    if (
        phase !== "SNATCH" &&
        phase !== "CLEAN_JERK"
    ) {

        return integrityResult(
            phase ?? null,
            "A valid competition phase is required: SNATCH or CLEAN_JERK."
        );

    }


    // =====================================
    // SELECT AUTHORITATIVE HISTORY
    // =====================================

    const attempts =
        phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;


    // =====================================
    // VALIDATE HISTORY
    // =====================================

    const integrityError =
        validateAttemptHistory(
            attempts,
            phase
        );


    if (
        integrityError
    ) {

        return integrityResult(
            phase,
            integrityError
        );

    }


    // =====================================
    // FIND FIRST INCOMPLETE ATTEMPT
    // =====================================

    const currentAttempt =
        findFirstIncompleteAttempt(
            attempts,
            phase
        );


    // =====================================
    // CURRENT ATTEMPT EXISTS
    // =====================================

    if (
        currentAttempt
    ) {

        return currentAttempt;

    }


    // =====================================
    // REQUESTED PHASE IS COMPLETE
    //
    // IMPORTANT:
    //
    // This means only the requested phase
    // has no remaining attempts.
    //
    // It does NOT mean the athlete's entire
    // competition is complete.
    //
    // It does NOT trigger Snatch → C&J.
    // =====================================

    return {

        completed: true,

        phase,

        attemptNo: null,

        declaredWeight: null,

        declaredAt: null,

        result: null,

    };

};


// =====================================
// NAMED EXPORTS
// =====================================

export {

    validateAttemptHistory,

    findFirstIncompleteAttempt,

};


// =====================================

export default getCurrentAttempt;