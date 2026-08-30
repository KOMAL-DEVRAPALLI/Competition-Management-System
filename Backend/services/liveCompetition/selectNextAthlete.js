import getCurrentAttempt from "./getCurrentAttempt.js";


// =====================================
// FEATURE 3.2
// AUTHORITATIVE QUEUE ORDERING
//
// Responsibility:
//
// 1. Receive eligible candidates from
//    Feature 3.1.
// 2. Resolve each candidate's current
//    attempt from CompetitionEntry.
// 3. Apply the authoritative calling-order

//    hierarchy.
//
// IMPORTANT:
//
// CompetitionEntry
// → authoritative competition entry data
// → attempt history
//
// LiveCompetition
// → authoritative competition/session state
//
// This service does NOT:
//
// - determine eligibility
// - mutate competition state
// - assign the platform
// - change currentEntryId
// - advance the competition phase
//
// Feature 3.1
// → eligibility
//
// Feature 3.2
// → ordering
//
// Feature 3.3
// → current / next / upcoming resolution
//
// Calling-order hierarchy:
//
// Rule 1
// → Lowest applicable weight
//
// Rule 2
// → Lowest attempt number
//
// Rule 3
// → Earlier previous-attempt sequence
//
// Rule 4
// → Lower lot/start number
//
// Internal fallback
// → entryId only for deterministic
//   ordering when all authoritative
//   ordering fields tie.
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
// GET COMPETITION ENTRY
//
// Candidate contract produced by
// getEligibleQueueCandidates:
//
// candidate.competitionEntry
// → permanent competition entry
//
// Attempt history is read from this
// object.

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
// GET CURRENT ATTEMPT
//
// The current attempt is resolved from
// the authoritative CompetitionEntry
// attempt history.
//
// This service does not calculate the
// attempt number itself.
// =====================================

const getCandidateCurrentAttempt = (
    candidate,
    currentPhase
) => {

    if (
        !candidate
    ) {

        return null;

    }


    if (
        !isValidPhase(
            currentPhase
        )
    ) {

        return null;

    }


    const competitionEntry =
        getCompetitionEntry(
            candidate
        );


    if (
        !competitionEntry
    ) {

        return null;

    }


    return getCurrentAttempt(
        competitionEntry,
        currentPhase
    );

};


// =====================================
// GET APPLICABLE WEIGHT
//
// RULE 1
//
// The queue compares the applicable
// weight for the candidate's current
// attempt.
//
// Priority:
//
// 1. Backend-resolved applicableWeight
// 2. declaredWeight
// 3. attempt-1 opening weight
//
// Never invent a missing weight.
// =====================================

const getAttemptWeight = (
    candidate,
    currentAttempt
) => {

    if (
        !candidate ||
        !currentAttempt ||
        currentAttempt.completed
    ) {

        return Number.MAX_SAFE_INTEGER;

    }


    // ---------------------------------
    // Explicit applicable weight
    // ---------------------------------

    if (
        currentAttempt.applicableWeight !=
            null &&
        Number(
            currentAttempt.applicableWeight
        ) >= 0
    ) {

        return Number(
            currentAttempt.applicableWeight
        );

    }


    // ---------------------------------
    // Declared weight
    // ---------------------------------

    if (
        currentAttempt.declaredWeight !=
            null &&
        Number(
            currentAttempt.declaredWeight
        ) > 0
    ) {

        return Number(
            currentAttempt.declaredWeight
        );

    }


    // ---------------------------------
    // Attempt 1 opening weight
    //
    // Opening weights belong to the
    // permanent CompetitionEntry.
    // ---------------------------------

    if (
        Number(
            currentAttempt.attemptNo
        ) === 1
    ) {

        const competitionEntry =
            getCompetitionEntry(
                candidate
            );


        const openingWeight =
            currentAttempt.phase === "SNATCH"
                ? competitionEntry?.opening?.snatch
                : competitionEntry?.opening?.cleanJerk;


        if (
            openingWeight != null &&
            Number(
                openingWeight
            ) > 0
        ) {

            return Number(
                openingWeight
            );

        }

    }


    // ---------------------------------
    // Missing applicable weight
    //
    // Never guess.
    // ---------------------------------

    return Number.MAX_SAFE_INTEGER;

};


// =====================================
// GET PHASE ATTEMPTS
//
// Attempt history comes only from the
// authoritative CompetitionEntry.
//
// =====================================

const getPhaseAttempts = (
    candidate,
    phase
) => {

    const competitionEntry =
        getCompetitionEntry(
            candidate
        );


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
// GET PREVIOUS ATTEMPT
//
// RULE 3 uses the authoritative
// performed sequence of the applicable
// previous attempt.
//
// For attempt 1:
//
// There is no previous attempt.
//
// For attempt 2:
//
// Use attempt 1.
//
// For attempt 3:
//
// Use attempt 2.
//
// Historical data is never reconstructed
// from array/database order.
// =====================================

const getPreviousAttempt = (
    candidate,
    currentAttempt
) => {

    if (
        !candidate ||
        !currentAttempt
    ) {

        return null;

    }


    const attemptNo =
        Number(
            currentAttempt.attemptNo
        );


    if (
        !Number.isInteger(
            attemptNo
        ) ||
        attemptNo <= 1
    ) {

        return null;

    }


    const attempts =
        getPhaseAttempts(
            candidate,
            currentAttempt.phase
        );


    if (
        !attempts
    ) {

        return null;

    }


    return (
        attempts.find(
            (attempt) =>
                Number(
                    attempt?.attemptNo
                ) ===
                attemptNo - 1
        ) ??
        null
    );

};


// =====================================
// GET PREVIOUS ATTEMPT SEQUENCE
//
// RULE 3
//
// Earlier performed attempt has
// priority.
//
// Missing sequence MUST NOT be
// fabricated.
//
// MAX_SAFE_INTEGER places the
// candidate after candidates with
// valid historical sequence when
// Rules 1 and 2 are tied.
//
// =====================================

const getPreviousAttemptSequence = (
    candidate,
    currentAttempt
) => {

    const previousAttempt =
        getPreviousAttempt(
            candidate,
            currentAttempt
        );


    // ---------------------------------
    // Attempt 1
    // ---------------------------------

    if (
        !previousAttempt
    ) {

        return Number.MAX_SAFE_INTEGER;

    }


    // ---------------------------------
    // Historical sequence is required
    // for Rule 3.
    // ---------------------------------

    const sequence =
        Number(
            previousAttempt.performedSequence
        );


    if (
        !Number.isInteger(
            sequence
        ) ||
        sequence < 1
    ) {

        return Number.MAX_SAFE_INTEGER;

    }


    return sequence;

};


// =====================================
// GET LOT NUMBER
//
// RULE 4
//
// Lot/start number belongs to the
// competition-entry identity.
//
// Candidate normalization currently
// exposes:
//
// candidate.lotNumber
//
// Fallback to:
//
// candidate.competitionEntry.official.lotNumber
//
// =====================================

const getLotNumber = (
    candidate
) => {

    const lotNumber =
        candidate?.lotNumber ??
        candidate?.competitionEntry
            ?.official
            ?.lotNumber ??
        null;


    const normalizedLotNumber =
        Number(
            lotNumber
        );


    if (
        Number.isFinite(
            normalizedLotNumber
        ) &&
        normalizedLotNumber > 0
    ) {

        return normalizedLotNumber;

    }


    return Number.MAX_SAFE_INTEGER;

};


// =====================================
// COMPARE TWO QUEUE CANDIDATES
//
// Rules 1–4.
//
// IMPORTANT:
//
// This function assumes the candidates
// have already passed Feature 3.1.
//
// It does NOT perform eligibility
// filtering.
//
// =====================================

const compareQueueCandidates = (
    a,
    b,
    currentPhase
) => {

    // ---------------------------------
    // Invalid phase
    // ---------------------------------

    if (
        !isValidPhase(
            currentPhase
        )
    ) {

        return 0;

    }


    // ---------------------------------
    // Resolve current attempts
    // ---------------------------------

    const attemptA =
        getCandidateCurrentAttempt(
            a,
            currentPhase
        );

    const attemptB =
        getCandidateCurrentAttempt(
            b,
            currentPhase
        );


    // =================================
    // RULE 1
    // LOWEST APPLICABLE WEIGHT
    // =================================

    const weightA =
        getAttemptWeight(
            a,
            attemptA
        );

    const weightB =
        getAttemptWeight(
            b,
            attemptB
        );


    if (
        weightA !==
        weightB
    ) {

        return (
            weightA -
            weightB
        );

    }


    // =================================
    // RULE 2
    // LOWEST ATTEMPT NUMBER
    // =================================

    const attemptNoA =
        Number(
            attemptA?.attemptNo ??
            Number.MAX_SAFE_INTEGER
        );

    const attemptNoB =
        Number(
            attemptB?.attemptNo ??
            Number.MAX_SAFE_INTEGER
        );


    if (
        attemptNoA !==
        attemptNoB
    ) {

        return (
            attemptNoA -
            attemptNoB
        );

    }


    // =================================
    // RULE 3
    // PREVIOUS ATTEMPT SEQUENCE
    // =================================

    const sequenceA =
        getPreviousAttemptSequence(
            a,
            attemptA
        );

    const sequenceB =
        getPreviousAttemptSequence(
            b,
            attemptB
        );


    if (
        sequenceA !==
        sequenceB
    ) {

        return (
            sequenceA -
            sequenceB
        );

    }


    // =================================
    // RULE 4
    // LOWER LOT / START NUMBER
    // =================================

    const lotA =
        getLotNumber(
            a
        );

    const lotB =
        getLotNumber(
            b
        );


    if (
        lotA !==
        lotB
    ) {

        return (
            lotA -
            lotB
        );

    }


    // =================================
    // INTERNAL DETERMINISTIC FALLBACK
    //
    // entryId is NOT a competition
    // calling-order rule.
    //
    // It is used only to guarantee a
    // deterministic result when every
    // authoritative ordering field ties.
    // =================================

    const entryIdA =
        String(
            a?.entryId ??
            ""
        );

    const entryIdB =
        String(
            b?.entryId ??
            ""
        );


    return entryIdA.localeCompare(
        entryIdB
    );

};


// =====================================
// ORDER COMPLETE QUEUE
//
// Input:
//
// Feature 3.1 eligible candidates
// authoritative current phase
//
// Output:
//
// Candidates ordered according to
// the approved calling-order hierarchy.
//
// =====================================

const orderQueue = (
    entries,
    currentPhase
) => {

    if (
        !Array.isArray(
            entries
        ) ||
        entries.length === 0
    ) {

        return [];

    }


    if (
        !isValidPhase(
            currentPhase
        )
    ) {

        return [];

    }


    return [
        ...entries,
    ].sort(
        (a, b) =>
            compareQueueCandidates(
                a,
                b,
                currentPhase
            )
    );

};


// =====================================
// SELECT NEXT ATHLETE
//
// Convenience wrapper.
//
// This does NOT mutate LiveCompetition.
//
// The caller decides what to do with
// the selected candidate.
//
// =====================================

const selectNextAthlete = (
    entries,
    currentPhase
) => {

    const orderedQueue =
        orderQueue(
            entries,
            currentPhase
        );


    if (
        orderedQueue.length === 0
    ) {

        return null;

    }


    const selected =
        orderedQueue[0];


    // ---------------------------------
    // Debug information
    // ---------------------------------

    const selectedAttempt =
        getCandidateCurrentAttempt(
            selected,
            currentPhase
        );


    const selectedPreviousAttempt =
        getPreviousAttempt(
            selected,
            selectedAttempt
        );


    console.log(
        "===== QUEUE ORDERING RESULT ====="
    );


    console.log({

        name:
            selected.name,

        entryId:
            selected.entryId
                ?.toString(),

        phase:
            selectedAttempt
                ?.phase ??
            null,

        attempt:
            selectedAttempt
                ?.attemptNo ??
            null,

        applicableWeight:
            getAttemptWeight(
                selected,
                selectedAttempt
            ),

        declaredWeight:
            selectedAttempt
                ?.declaredWeight ??
            null,

        previousAttempt:
            selectedPreviousAttempt
                ?.attemptNo ??
            null,

        previousAttemptSequence:
            selectedPreviousAttempt
                ?.performedSequence ??
            null,

        lotNumber:
            getLotNumber(
                selected
            ),

    });


    return selected;

};


// =====================================
// NAMED EXPORTS
// =====================================

export {

    isValidPhase,

    getAttemptWeight,

    getPreviousAttempt,

    getPreviousAttemptSequence,

    getLotNumber,

    compareQueueCandidates,

    orderQueue,

};


// =====================================
// DEFAULT EXPORT
// =====================================

export default selectNextAthlete;