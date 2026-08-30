// =====================================
// Validate authoritative state version
// =====================================
//
// The caller supplies the version of the
// competition state it was based on.
//
// If the persisted state has changed since
// then, the action is stale and MUST NOT
// continue.
//
// This helper does not save anything.
// The caller owns persistence/transactions.
// =====================================

const assertStateVersion = (
    liveSession,
    expectedStateVersion
) => {

    // -----------------------------------
    // Validate session
    // -----------------------------------

    if (!liveSession) {
        throw new Error(
            "Live competition session is required."
        );
    }


    // -----------------------------------
    // Validate persisted stateVersion
    // -----------------------------------

    if (
        !Number.isInteger(
            liveSession.stateVersion
        ) ||
        liveSession.stateVersion < 0
    ) {
        const error =
            new Error(
                "Live competition stateVersion is invalid. Recovery required."
            );

        error.code =
            "INVALID_STATE_VERSION";

        error.statusCode =
            409;

        throw error;
    }


    // -----------------------------------
    // Validate expected version
    // -----------------------------------

    if (
        !Number.isInteger(
            expectedStateVersion
        ) ||
        expectedStateVersion < 0
    ) {
        const error =
            new Error(
                "expectedStateVersion must be a non-negative integer."
            );

        error.code =
            "INVALID_EXPECTED_STATE_VERSION";

        error.statusCode =
            400;

        throw error;
    }


    // -----------------------------------
    // Detect stale state
    // -----------------------------------

    if (
        liveSession.stateVersion !==
        expectedStateVersion
    ) {

        const error =
            new Error(
                "STALE_STATE: Competition state has changed. Refresh the Officials Screen before performing this action."
            );

        error.code =
            "STALE_STATE";

        error.statusCode =
            409;

        error.expectedStateVersion =
            expectedStateVersion;

        error.currentStateVersion =
            liveSession.stateVersion;

        throw error;
    }


    return true;
};


// =====================================
// Advance authoritative state version
// =====================================
//
// This must be called exactly once for
// each accepted state-changing transition.
//
// It does NOT save the document.
// =====================================

const advanceStateVersion = (
    liveSession
) => {

    // -----------------------------------
    // Validate session
    // -----------------------------------

    if (!liveSession) {
        throw new Error(
            "Live competition session is required."
        );
    }


    // -----------------------------------
    // Validate current version
    // -----------------------------------

    if (
        !Number.isInteger(
            liveSession.stateVersion
        ) ||
        liveSession.stateVersion < 0
    ) {
        const error =
            new Error(
                "Live competition stateVersion is invalid. Recovery required."
            );

        error.code =
            "INVALID_STATE_VERSION";

        error.statusCode =
            409;

        throw error;
    }


    // -----------------------------------
    // Prevent unsafe numeric overflow
    // -----------------------------------

    if (
        liveSession.stateVersion >=
        Number.MAX_SAFE_INTEGER
    ) {
        const error =
            new Error(
                "Live competition stateVersion has reached the maximum safe value."
            );

        error.code =
            "STATE_VERSION_EXHAUSTED";

        error.statusCode =
            409;

        throw error;
    }


    // -----------------------------------
    // Advance version
    // -----------------------------------

    liveSession.stateVersion += 1;


    return liveSession.stateVersion;
};


export {
    assertStateVersion,
    advanceStateVersion,
};