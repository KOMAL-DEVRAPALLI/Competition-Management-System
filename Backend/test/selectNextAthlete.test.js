import test from "node:test";
import assert from "node:assert/strict";

import {
    compareQueueCandidates,
    orderQueue,
} from "../services/liveCompetition/selectNextAthlete.js";
// =====================================
// TEST DATA BUILDER
// =====================================

const createCandidate = ({
    entryId,
    name,
    lotNumber,
    attemptNo = 1,
    declaredWeight,
    performedSequence = null,
}) => {

    const snatchAttempts = [
        {
            attemptNo: 1,
            declaredWeight:
                attemptNo === 1
                    ? declaredWeight
                    : 50,
            result:
                attemptNo === 1
                    ? "PENDING"
                    : "GOOD",
            performedSequence:
                attemptNo === 1
                    ? performedSequence
                    : 10,
        },

        {
            attemptNo: 2,
            declaredWeight:
                attemptNo === 2
                    ? declaredWeight
                    : null,
            result:
                attemptNo === 2
                    ? "PENDING"
                    : "PENDING",
            performedSequence:
                attemptNo === 2
                    ? performedSequence
                    : null,
        },

        {
            attemptNo: 3,
            declaredWeight:
                attemptNo === 3
                    ? declaredWeight
                    : null,
            result: "PENDING",
            performedSequence: null,
        },
    ];


    return {

        entryId,

        name,

        lotNumber,

        competitionEntry: {

            opening: {
                snatch: declaredWeight,
                cleanJerk: 80,
            },

            snatchAttempts,

            cleanJerkAttempts: [
                {
                    attemptNo: 1,
                    declaredWeight: 80,
                    result: "PENDING",
                },
                {
                    attemptNo: 2,
                    declaredWeight: null,
                    result: "PENDING",
                },
                {
                    attemptNo: 3,
                    declaredWeight: null,
                    result: "PENDING",
                },
            ],
        },
    };
};


// =====================================
// RULE 1
// LOWER WEIGHT FIRST
// =====================================

test(
    "Feature 3.2 - Rule 1: lower applicable weight has priority",
    () => {

        const athlete50 =
            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 1,
                declaredWeight: 50,
            });

        const athlete51 =
            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 1,
                declaredWeight: 51,
            });


        assert.ok(
            compareQueueCandidates(
                athlete50,
                athlete51
            ) < 0
        );

        assert.ok(
            compareQueueCandidates(
                athlete51,
                athlete50
            ) > 0
        );

    }
);


// =====================================
// RULE 2
// LOWER ATTEMPT NUMBER FIRST
// =====================================

test(
    "Feature 3.2 - Rule 2: lower attempt number has priority when weight is equal",
    () => {

        const athleteAttempt1 =
            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 1,
                declaredWeight: 50,
            });

        const athleteAttempt2 =
            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 2,
                declaredWeight: 50,
            });


        assert.ok(
            compareQueueCandidates(
                athleteAttempt1,
                athleteAttempt2
            ) < 0
        );

        assert.ok(
            compareQueueCandidates(
                athleteAttempt2,
                athleteAttempt1
            ) > 0
        );

    }
);


// =====================================
// RULE 3
// EARLIER PREVIOUS-ATTEMPT SEQUENCE
// =====================================

test(
    "Feature 3.2 - Rule 3: earlier previous-attempt sequence has priority",
    () => {

        const athleteSequence4 =
            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 4,
            });

        const athleteSequence7 =
            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 7,
            });


        assert.ok(
            compareQueueCandidates(
                athleteSequence4,
                athleteSequence7
            ) < 0
        );

        assert.ok(
            compareQueueCandidates(
                athleteSequence7,
                athleteSequence4
            ) > 0
        );

    }
);


// =====================================
// RULE 4
// LOWER LOT NUMBER FIRST
// =====================================

test(
    "Feature 3.2 - Rule 4: lower lot number breaks complete comparison tie",
    () => {

        const athleteLot101 =
            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 4,
            });

        const athleteLot102 =
            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 4,
            });


        assert.ok(
            compareQueueCandidates(
                athleteLot101,
                athleteLot102
            ) < 0
        );

        assert.ok(
            compareQueueCandidates(
                athleteLot102,
                athleteLot101
            ) > 0
        );

    }
);


// =====================================
// INPUT ORDER MUST NOT MATTER
// =====================================

test(
    "Feature 3.2 - ordering is independent of input order",
    () => {

        const athlete50 =
            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 1,
                declaredWeight: 50,
            });

        const athlete51 =
            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 1,
                declaredWeight: 51,
            });


        const firstOrder =
            [
                athlete50,
                athlete51,
            ].sort(
                compareQueueCandidates
            );

        const reversedOrder =
            [
                athlete51,
                athlete50,
            ].sort(
                compareQueueCandidates
            );


        assert.equal(
            firstOrder[0].entryId,
            "A"
        );

        assert.equal(
            reversedOrder[0].entryId,
            "A"
        );

    }
);


// =====================================
// FULL HIERARCHY TEST
//
// Weight → Attempt → Sequence → Lot
// =====================================

test(
    "Feature 3.2 - complete Rules 1-4 hierarchy",
    () => {

        const candidates = [

            createCandidate({
                entryId: "D",
                name: "Athlete D",
                lotNumber: 104,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 8,
            }),

            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 1,
                declaredWeight: 60,
            }),

            createCandidate({
                entryId: "C",
                name: "Athlete C",
                lotNumber: 103,
                attemptNo: 2,
                declaredWeight: 60,
                performedSequence: 4,
            }),

            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 1,
                declaredWeight: 50,
            }),
        ];


        const ordered =
            [...candidates].sort(
                compareQueueCandidates
            );


        assert.deepEqual(
            ordered.map(
                (candidate) =>
                    candidate.entryId
            ),
            [
                "A",
                "B",
                "C",
                "D",
            ]
        );

    }
);
test(
    "Feature 3.2 - orderQueue returns the complete queue in Rules 1-4 order",
    () => {

        const candidates = [

            createCandidate({
                entryId: "C",
                name: "Athlete C",
                lotNumber: 103,
                attemptNo: 1,
                declaredWeight: 60,
            }),

            createCandidate({
                entryId: "A",
                name: "Athlete A",
                lotNumber: 101,
                attemptNo: 1,
                declaredWeight: 50,
            }),

            createCandidate({
                entryId: "B",
                name: "Athlete B",
                lotNumber: 102,
                attemptNo: 1,
                declaredWeight: 55,
            }),

        ];


        const ordered =
            orderQueue(candidates);


        assert.deepEqual(
            ordered.map(
                (candidate) =>
                    candidate.entryId
            ),
            [
                "A",
                "B",
                "C",
            ]
        );

    }
);