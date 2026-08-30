import LiveCompetition from "../../models/LiveCompetition.js";

import buildWorkingSheetData
    from "../pdf/workingSheet/buildWorkingSheetData.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";


// =====================================
// FEATURE 3.1
// AUTHORITATIVE QUEUE CANDIDATE
// ELIGIBILITY
//
// Responsibility:
//
// 1. Read authoritative LiveCompetition.
// 2. Load CompetitionEntry data.
// 3. Validate active phase.
// 4. Validate athlete/session scope.
// 5. Resolve current attempt from
//    CompetitionEntry.
// 6. Exclude current platform athlete
//    unless explicitly allowed.
// 7. Exclude athletes who completed the
//    active phase.
// 8. Exclude athletes with no remaining
//    attempts.
// 9. Require a valid declaration.
// 10. Resolve the candidate's applicable
//     weight.
// 11. Return the authoritative candidate.
//
// IMPORTANT:
//
// CompetitionEntry is the authoritative
// source for athlete attempt history.
//
// LiveCompetition is the authoritative
// source for competition/session state.
//
// This service does NOT:
//
// - sort candidates
// - choose current athlete
// - modify CompetitionEntry
// - modify LiveCompetition
// - calculate calling order
// - transition competition phase
//
// Calling order belongs to
// selectNextAthlete.js.
//
// =====================================


// =====================================
// VALID PHASE
// =====================================

const isValidPhase = (
    phase
) => {

    return (
        phase === "SNATCH" ||
        phase === "CLEAN_JERK"
    );

};


// =====================================
// GET PHASE ATTEMPTS
//
// CompetitionEntry is authoritative.
//
// =====================================

const getPhaseAttempts = (
    competitionEntry,
    phase
) => {

    if (
        !competitionEntry
    ) {

        return null;

    }


    if (
        phase === "SNATCH"
    ) {

        return Array.isArray(
            competitionEntry.snatchAttempts
        )
            ? competitionEntry.snatchAttempts
            : null;

    }


    if (
        phase === "CLEAN_JERK"
    ) {

        return Array.isArray(
            competitionEntry.cleanJerkAttempts
        )
            ? competitionEntry.cleanJerkAttempts
            : null;

    }


    return null;

};


// =====================================
// GET ATTEMPT BY NUMBER
// =====================================

const getAttemptByNumber = (
    attempts,
    attemptNo
) => {

    if (
        !Array.isArray(
            attempts
        )
    ) {

        return null;

    }


    return (
        attempts.find(
            (attempt) =>
                Number(
                    attempt?.attemptNo
                ) ===
                Number(
                    attemptNo
                )
        ) ??
        null
    );

};


// =====================================
// CHECK ACTIVE PHASE COMPLETION
//
// An athlete has no further place in the
// active-phase queue when all three attempts
// in that phase have been performed.
//
// PENDING = attempt still available.
//
// GOOD / NO_LIFT = attempt performed.
//
// This check is intentionally based on
// CompetitionEntry attempt history.
//
// =====================================

const isPhaseCompleted = (
    competitionEntry,
    phase
) => {

    const attempts =
        getPhaseAttempts(
            competitionEntry,
            phase
        );


    if (
        !attempts
    ) {

        return {

            completed: false,

            integrityError:
                `${phase} attempt history is missing.`,
        };

    }


    const attempt1 =
        getAttemptByNumber(
            attempts,
            1
        );

    const attempt2 =
        getAttemptByNumber(
            attempts,
            2
        );

    const attempt3 =
        getAttemptByNumber(
            attempts,
            3
        );


    if (
        !attempt1 ||
        !attempt2 ||
        !attempt3
    ) {

        return {

            completed: false,

            integrityError:
                `${phase} attempt history must contain attempts 1, 2 and 3.`,
        };

    }


    const allPerformed =
        attempt1.result !== "PENDING" &&
        attempt2.result !== "PENDING" &&
        attempt3.result !== "PENDING";


    return {

        completed:
            allPerformed,

        attempts: [
            attempt1,
            attempt2,
            attempt3,
        ],

    };

};


// =====================================
// GET COMPETITION ENTRY
//
// Candidate contract:
//
// candidate.competitionEntry
//
// =====================================

const getCompetitionEntry = (
    candidate
) => {

    return (
        candidate?.competitionEntry ??
        null
    );

};


// =====================================
// RESOLVE APPLICABLE WEIGHT
//
// Feature 3.1 exposes a real applicable
// weight to downstream consumers.
//
// Priority:
//
// 1. Current attempt declared weight
// 2. Attempt-1 opening weight
//
// Missing weight = null.
//
// IMPORTANT:
//
// Number.MAX_SAFE_INTEGER is NEVER
// returned from this function.
//
// That value is an internal ordering
// sentinel and must not enter the
// candidate/UI contract.
// =====================================

const resolveApplicableWeight = (
    competitionEntry,
    currentAttempt,
    phase
) => {

    if (
        !competitionEntry ||
        !currentAttempt
    ) {

        return null;

    }


    const declaredWeight =
        Number(
            currentAttempt.declaredWeight
        );


    if (
        currentAttempt.declaredWeight !==
            null &&
        currentAttempt.declaredWeight !==
            undefined &&
        currentAttempt.declaredWeight !==
            "" &&
        Number.isFinite(
            declaredWeight
        ) &&
        declaredWeight > 0
    ) {

        return declaredWeight;

    }


    // ---------------------------------
    // Attempt 1 opening weight
    // ---------------------------------

    if (
        Number(
            currentAttempt.attemptNo
        ) === 1
    ) {

        const openingWeight =
            phase === "SNATCH"
                ? competitionEntry?.opening?.snatch
                : competitionEntry?.opening?.cleanJerk;


        const numericOpeningWeight =
            Number(
                openingWeight
            );


        if (
            openingWeight !== null &&
            openingWeight !== undefined &&
            openingWeight !== "" &&
            Number.isFinite(
                numericOpeningWeight
            ) &&
            numericOpeningWeight > 0
        ) {

            return numericOpeningWeight;

        }

    }


    return null;

};


// =====================================
// PURE ELIGIBILITY EVALUATOR
// =====================================

export const evaluateQueueCandidateEligibility = ({
    entry,
    session,
    normalizedGender,
    allowCurrentEntry = false,
}) => {

    // =====================================
    // ENTRY DATA
    // =====================================

    if (
        !entry?.competitionEntry
    ) {

        return {

            eligible: false,

            reason:
                "ENTRY_DATA_MISSING",

            integrityError:
                "Competition entry data is missing.",

        };

    }


    const competitionEntry =
        entry.competitionEntry;


    // =====================================
    // ENTRY ID
    // =====================================

    if (
        !entry.entryId
    ) {

        return {

            eligible: false,

            reason:
                "ENTRY_ID_MISSING",

            integrityError:
                "Competition entry ID is missing.",

        };

    }


    // =====================================
    // ACTIVE PHASE
    // =====================================

    const activePhase =
        session?.currentPhase;


    if (
        !isValidPhase(
            activePhase
        )
    ) {

        return {

            eligible: false,

            reason:
                "INVALID_ACTIVE_PHASE",

            integrityError:
                `Invalid active competition phase: ${activePhase}.`,

        };

    }


    // =====================================
    // CURRENT PLATFORM ATHLETE
    // =====================================

    if (
        !allowCurrentEntry &&
        session.currentEntryId &&
        String(
            session.currentEntryId
        ) ===
        String(
            entry.entryId
        )
    ) {

        return {

            eligible: false,

            reason:
                "CURRENT_PLATFORM_ATHLETE",

        };

    }


    // =====================================
    // GENDER
    // =====================================

    const athleteGender =
        entry.gender
            ?.toString()
            .trim()
            .toLowerCase();


    if (
        !athleteGender
    ) {

        return {

            eligible: false,

            reason:
                "ATHLETE_GENDER_MISSING",

            integrityError:
                "Athlete gender is missing.",

        };

    }


    if (
        athleteGender !==
        normalizedGender
    ) {

        return {

            eligible: false,

            reason:
                "OUTSIDE_GENDER_SCOPE",

        };

    }


    // =====================================
    // WEIGHT CATEGORY
    // =====================================

    const category =
        entry.displayWeightCategory
            ?.toString()
            .trim();


    if (
        !category
    ) {

        return {

            eligible: false,

            reason:
                "WEIGHT_CATEGORY_MISSING",

            integrityError:
                "Weight category is missing.",

        };

    }


    // =====================================
    // SESSION CATEGORY SCOPE
    // =====================================

    const selectedCategories =
        session.selectedWeightCategories;


    if (
        !Array.isArray(
            selectedCategories
        ) ||
        selectedCategories.length === 0
    ) {

        return {

            eligible: false,

            reason:
                "CATEGORY_SCOPE_MISSING",

            integrityError:
                "Live competition has no selected weight-category scope.",

        };

    }


    const normalizedCategories =
        selectedCategories
            .map(
                (item) =>
                    String(item).trim()
            )
            .filter(Boolean);


    if (
        !normalizedCategories.includes(
            category
        )
    ) {

        return {

            eligible: false,

            reason:
                "OUTSIDE_WEIGHT_CATEGORY_SCOPE",

        };

    }


    // =====================================
    // ATHLETE STATUS
    // =====================================

    if (
        competitionEntry.status ===
        "COMPLETED"
    ) {

        return {

            eligible: false,

            reason:
                "ATHLETE_COMPLETED",

        };

    }


    // =====================================
    // PHASE ATTEMPT HISTORY
    // =====================================

    const phaseAttempts =
        getPhaseAttempts(
            competitionEntry,
            activePhase
        );


    if (
        !phaseAttempts
    ) {

        return {

            eligible: false,

            reason:
                "ATTEMPT_HISTORY_MISSING",

            integrityError:
                `${activePhase} attempt history is missing.`,

        };

    }


    // =====================================
    // EXPLICIT PHASE COMPLETION
    //
    // If all three attempts have a result,
    // the athlete cannot remain in the
    // current phase queue.
    // =====================================

    const phaseCompletion =
        isPhaseCompleted(
            competitionEntry,
            activePhase
        );


    if (
        phaseCompletion.integrityError
    ) {

        return {

            eligible: false,

            reason:
                "ATTEMPT_HISTORY_INTEGRITY_ERROR",

            integrityError:
                phaseCompletion.integrityError,

        };

    }


    if (
        phaseCompletion.completed
    ) {

        return {

            eligible: false,

            reason:
                "PHASE_COMPLETED",

            currentAttempt: null,

            phaseAttempts:
                phaseCompletion.attempts,

        };

    }


    // =====================================
    // RESOLVE CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry,
            activePhase
        );


    // =====================================
    // CURRENT ATTEMPT INTEGRITY
    // =====================================

    if (
        currentAttempt?.integrityError
    ) {

        return {

            eligible: false,

            reason:
                "ATTEMPT_HISTORY_INTEGRITY_ERROR",

            integrityError:
                currentAttempt.integrityError,

            currentAttempt,

        };

    }


    // =====================================
    // CURRENT ATTEMPT REQUIRED
    // =====================================

    if (
        !currentAttempt
    ) {

        return {

            eligible: false,

            reason:
                "CURRENT_ATTEMPT_MISSING",

            integrityError:
                `Unable to resolve current ${activePhase} attempt.`,

        };

    }


    // =====================================
    // PHASE VALIDATION
    // =====================================

    if (
        currentAttempt.phase !==
        activePhase
    ) {

        return {

            eligible: false,

            reason:
                "ATTEMPT_PHASE_MISMATCH",

            integrityError:
                `Athlete attempt phase ${currentAttempt.phase} does not match active phase ${activePhase}.`,

            currentAttempt,

        };

    }


    // =====================================
    // CURRENT ATTEMPT NUMBER
    // =====================================

    const currentAttemptNo =
        Number(
            currentAttempt.attemptNo
        );


    if (
        !Number.isInteger(
            currentAttemptNo
        ) ||
        currentAttemptNo < 1 ||
        currentAttemptNo > 3
    ) {

        return {

            eligible: false,

            reason:
                "INVALID_CURRENT_ATTEMPT",

            integrityError:
                `Invalid current ${activePhase} attempt number.`,

            currentAttempt,

        };

    }


    // =====================================
    // AUTHORITATIVE CURRENT ATTEMPT
    // =====================================

    const authoritativeAttempt =
        getAttemptByNumber(
            phaseAttempts,
            currentAttemptNo
        );


    if (
        !authoritativeAttempt
    ) {

        return {

            eligible: false,

            reason:
                "CURRENT_ATTEMPT_NOT_FOUND",

            integrityError:
                `Attempt ${currentAttemptNo} is missing from ${activePhase} attempt history.`,

            currentAttempt,

        };

    }


    // =====================================
    // CURRENT ATTEMPT MUST BE PENDING
    // =====================================

    if (
        authoritativeAttempt.result !==
        "PENDING"
    ) {

        return {

            eligible: false,

            reason:
                "CURRENT_ATTEMPT_NOT_PENDING",

            currentAttempt,

            authoritativeAttempt,

        };

    }


    // =====================================
    // DECLARATION
    // =====================================

    const declaredWeight =
        authoritativeAttempt.declaredWeight;


    if (
        declaredWeight === null ||
        declaredWeight === undefined ||
        declaredWeight === ""
    ) {

        return {

            eligible: false,

            reason:
                "DECLARATION_REQUIRED",

            currentAttempt,

            declaredWeight:
                null,

            applicableWeight:
                resolveApplicableWeight(
                    competitionEntry,
                    authoritativeAttempt,
                    activePhase
                ),

        };

    }


    // =====================================
    // NORMALIZE DECLARED WEIGHT
    // =====================================

    const numericDeclaredWeight =
        Number(
            declaredWeight
        );


    if (
        !Number.isFinite(
            numericDeclaredWeight
        ) ||
        numericDeclaredWeight <= 0
    ) {

        return {

            eligible: false,

            reason:
                "INVALID_DECLARED_WEIGHT",

            integrityError:
                `Current attempt ${currentAttemptNo} has an invalid declared weight.`,

            currentAttempt,

            declaredWeight,

        };

    }


    // =====================================
    // APPLICABLE WEIGHT
    // =====================================

    const applicableWeight =
        resolveApplicableWeight(
            competitionEntry,
            authoritativeAttempt,
            activePhase
        );


    // =====================================
    // ELIGIBLE
    // =====================================

    return {

        eligible:
            true,

        reason:
            "ELIGIBLE",

        currentAttempt: {

            ...currentAttempt,

            declaredWeight:
                numericDeclaredWeight,

        },

        declaredWeight:
            numericDeclaredWeight,

        applicableWeight,

    };

};


// =====================================
// MAIN SERVICE
// =====================================

const getEligibleQueueCandidates = async ({
    competitionId,
    gender,
    dbSession = null,
    allowCurrentEntry = false,
}) => {

    // =====================================
    // VALIDATE INPUT
    // =====================================

    if (
        !competitionId
    ) {

        throw new Error(
            "Competition ID is required."
        );

    }


    if (
        !gender
    ) {

        throw new Error(
            "Gender is required."
        );

    }


    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    // =====================================
    // LOAD LIVE SESSION
    // =====================================

    let sessionQuery =
        LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });


    if (
        dbSession
    ) {

        sessionQuery =
            sessionQuery.session(
                dbSession
            );

    }


    const session =
        await sessionQuery;


    if (
        !session
    ) {

        throw new Error(
            "Live competition session not found."
        );

    }


    // =====================================
    // RECOVERY SAFETY
    // =====================================

    if (
        session.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition requires recovery. Automatic queue progression is stopped."
            );

        error.code =
            "RECOVERY_REQUIRED";

        error.statusCode =
            409;

        throw error;

    }


    if (
        session.integrity?.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition integrity is invalid. Automatic queue progression is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // CATEGORY SCOPE
    // =====================================

    if (
        !Array.isArray(
            session.selectedWeightCategories
        ) ||
        session.selectedWeightCategories.length === 0
    ) {

        const error =
            new Error(
                "Live competition has no selected weight-category scope."
            );

        error.code =
            "QUEUE_SCOPE_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // ACTIVE PHASE
    // =====================================

    const activePhase =
        session.currentPhase;


    if (
        !isValidPhase(
            activePhase
        )
    ) {

        const error =
            new Error(
                `Invalid live competition phase: ${activePhase}.`
            );

        error.code =
            "INVALID_PHASE";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // LOAD COMPETITION ENTRIES
    //
    // CompetitionEntry remains the only
    // authoritative athlete/attempt source.
    //
    // No LiveCompetitionEntry.
    //
    // IMPORTANT:
    //
    // dbSession MUST be passed through.
    //
    // When this service is called from
    // advanceCompetition() inside the
    // processLift transaction, the queue
    // must read the same transactional
    // CompetitionEntry state that contains
    // the newly recorded result and any
    // automatically established next
    // declaration.
    //
    // Without dbSession here, the queue
    // reads outside the transaction and can
    // see stale CompetitionEntry data.
    // =====================================

    const entries =
        await buildWorkingSheetData(

            competitionId,

            normalizedGender,

            true,

            session.selectedWeightCategories,

            dbSession

        );


    if (
        !Array.isArray(
            entries
        )
    ) {

        const error =
            new Error(
                "Unable to load competition athletes."
            );

        error.code =
            "QUEUE_ENTRY_LOAD_ERROR";

        error.statusCode =
            500;

        throw error;

    }


    // =====================================
    // RESULT COLLECTIONS
    // =====================================

    const eligibleCandidates = [];

    const integrityErrors = [];

    const rejectedCandidates = [];


    // =====================================
    // EVALUATE EVERY ENTRY
    // =====================================

    for (
        const entry
        of entries
    ) {

        const evaluation =
            evaluateQueueCandidateEligibility({

                entry,

                session,

                normalizedGender,

                allowCurrentEntry,

            });


        // =================================
        // REJECTED
        // =================================

        if (
            !evaluation.eligible
        ) {

            rejectedCandidates.push({

                entryId:
                    entry.entryId
                        ?.toString() ??
                    null,

                name:
                    entry.name ??
                    null,

                lotNumber:
                    entry.lotNumber ??
                    null,

                weightCategory:
                    entry.displayWeightCategory ??
                    null,

                reason:
                    evaluation.reason ??
                    "UNKNOWN_REJECTION",

                integrityError:
                    evaluation.integrityError ??
                    null,

                currentAttempt:
                    evaluation.currentAttempt
                        ? {

                            phase:
                                evaluation
                                    .currentAttempt
                                    .phase,

                            attemptNo:
                                evaluation
                                    .currentAttempt
                                    .attemptNo,

                            declaredWeight:
                                evaluation
                                    .currentAttempt
                                    .declaredWeight,

                            result:
                                evaluation
                                    .currentAttempt
                                    .result,

                            completed:
                                evaluation
                                    .currentAttempt
                                    .completed,

                        }
                        : null,

            });

        }


        // =================================
        // INTEGRITY ERROR
        // =================================

        if (
            evaluation.integrityError
        ) {

            integrityErrors.push({

                entryId:
                    entry.entryId
                        ?.toString() ??
                    null,

                name:
                    entry.name ??
                    null,

                reason:
                    evaluation.integrityError,

            });

            continue;

        }


        // =================================
        // ELIGIBLE CANDIDATE
        // =================================

        if (
            evaluation.eligible
        ) {

            eligibleCandidates.push({

                ...entry,

                // ---------------------------------
                // Queue identity
                // ---------------------------------

                phase:
                    evaluation
                        .currentAttempt
                        .phase,

                attemptNo:
                    evaluation
                        .currentAttempt
                        .attemptNo,

                // ---------------------------------
                // Authoritative weight data
                // ---------------------------------

                declaredWeight:
                    evaluation
                        .declaredWeight,

                applicableWeight:
                    evaluation
                        .applicableWeight ??
                    null,

                // ---------------------------------
                // Current result state
                // ---------------------------------

                result:
                    evaluation
                        .currentAttempt
                        .result,

            });

        }

    }


    // =====================================
    // INTEGRITY FAILURE
    // =====================================

    if (
        integrityErrors.length > 0
    ) {

        console.error(
            "===== QUEUE INTEGRITY ERRORS ====="
        );

        console.error(
            JSON.stringify(
                integrityErrors,
                null,
                2
            )
        );


        console.error(
            "===== QUEUE CANDIDATE DIAGNOSTICS ====="
        );

        console.error(
            JSON.stringify(
                {

                    competitionId:
                        competitionId.toString(),

                    gender:
                        normalizedGender,

                    activePhase,

                    currentEntryId:
                        session.currentEntryId
                            ?.toString() ??
                        null,

                    allowCurrentEntry,

                    totalEntries:
                        entries.length,

                    eligibleCandidates:
                        eligibleCandidates.length,

                    rejectedCandidates,

                },
                null,
                2
            )
        );


        const error =
            new Error(
                "Live competition integrity check failed. Automatic queue progression has been stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        error.integrityErrors =
            integrityErrors;

        throw error;

    }


    // =====================================
    // DEBUG
    // =====================================

    console.log(
        "===== ELIGIBLE QUEUE CANDIDATES ====="
    );

    console.log({

        competitionId:
            competitionId.toString(),

        gender:
            normalizedGender,

        phase:
            activePhase,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentEntryId:
            session.currentEntryId
                ?.toString() ??
            null,

        allowCurrentEntry,

        totalEntries:
            entries.length,

        eligibleCandidates:
            eligibleCandidates.length,

        candidates:
            eligibleCandidates.map(
                (entry) => ({

                    entryId:
                        entry.entryId
                            ?.toString(),

                    name:
                        entry.name,

                    lotNumber:
                        entry.lotNumber,

                    weightCategory:
                        entry.displayWeightCategory,

                    phase:
                        entry.phase,

                    attemptNo:
                        entry.attemptNo,

                    declaredWeight:
                        entry.declaredWeight,

                    applicableWeight:
                        entry.applicableWeight,

                    result:
                        entry.result,

                })
            ),

    });


    // =====================================
    // REJECTION DEBUG
    // =====================================

    console.log(
        "===== REJECTED QUEUE CANDIDATES ====="
    );

    console.log(
        JSON.stringify(
            rejectedCandidates,
            null,
            2
        )
    );


    // =====================================
    // AUTHORITATIVE RETURN CONTRACT
    // =====================================

    return {

        session,

        candidates:
            eligibleCandidates,

        totalCandidates:
            eligibleCandidates.length,

        rejectedCandidates,

    };

};


export default getEligibleQueueCandidates;