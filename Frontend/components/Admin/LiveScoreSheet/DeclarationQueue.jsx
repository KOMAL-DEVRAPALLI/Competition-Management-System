import { useState } from "react";
import "./DeclarationQueue.css";

const DeclarationQueue = ({
    declarationQueue,
    onSaveWeight,
}) => {

    const [weights, setWeights] =
        useState({});

    // -----------------------------------
    // Empty queue
    // -----------------------------------

    if (!declarationQueue?.length) {

        return (

            <div className="declaration-queue-card">

                <div className="declaration-queue-header">

                    <h2>
                        Declaration Queue
                    </h2>

                </div>

                <div className="declaration-queue-empty">

                    No Athletes

                </div>

            </div>

        );

    }

    // -----------------------------------
    // Get current displayed weight
    // -----------------------------------

    const getCurrentWeight = (
        athlete
    ) => {

        const attempt =
            athlete.currentAttempt;

        if (!attempt) {
            return null;
        }

        // -----------------------------------
        // If official declaration exists,
        // use it.
        // -----------------------------------

        if (
            attempt.declaredWeight != null &&
            attempt.declaredWeight > 0
        ) {

            return attempt.declaredWeight;

        }

        // -----------------------------------
        // Attempt 1 uses opening weight.
        // -----------------------------------

        if (
            attempt.attemptNo === 1
        ) {

            return (
                attempt.phase === "SNATCH"
                    ? athlete.openingSnatch
                    : athlete.openingCleanJerk
            );

        }

        // -----------------------------------
        // Attempt 2 / 3 without declaration
        // -----------------------------------

        return null;
    };

    // -----------------------------------
    // Handle input
    // -----------------------------------

    const handleWeightChange = (
        entryId,
        value
    ) => {

        setWeights((previous) => ({
            ...previous,
            [entryId]: value,
        }));

    };

    // -----------------------------------
    // Save declaration
    // -----------------------------------

    const handleSave = (
        athlete
    ) => {

        const currentWeight =
            getCurrentWeight(
                athlete
            );

        const enteredWeight =
            weights[athlete.entryId];

        const weight =
            enteredWeight !== undefined
                ? Number(enteredWeight)
                : currentWeight;

        if (
            weight == null ||
            Number.isNaN(weight) ||
            weight <= 0
        ) {

            return;
        }

        onSaveWeight(
            athlete.entryId,
            weight
        );

    };

    return (

        <div className="declaration-queue-card">

            <div className="declaration-queue-header">

                <h2>
                    Declaration Queue
                </h2>

                <span>
                    {declarationQueue.length} Athletes
                </span>

            </div>

            <table className="declaration-queue-table">

                <thead>

                    <tr>

                        <th>Lot</th>

                        <th>Name</th>

                        <th>Attempt</th>

                        <th>Current</th>

                        <th>New</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {declarationQueue.map(
                        (athlete) => {

                            const attempt =
                                athlete.currentAttempt;

                            const currentWeight =
                                getCurrentWeight(
                                    athlete
                                );

                            const inputValue =
                                weights[
                                    athlete.entryId
                                ] ??
                                currentWeight ??
                                "";

                            return (

                                <tr
                                    key={
                                        athlete.entryId
                                    }
                                >

                                    {/* Lot */}

                                    <td>
                                        {
                                            athlete.lotNumber
                                        }
                                    </td>

                                    {/* Name */}

                                    <td>

                                        <strong>
                                            {
                                                athlete.name
                                            }
                                        </strong>

                                    </td>

                                    {/* Attempt */}

                                    <td>

                                        {attempt?.phase}

                                        {" "}

                                        {attempt?.attemptNo}

                                    </td>

                                    {/* Current weight */}

                                    <td>

                                        {
                                            currentWeight != null
                                                ? `${currentWeight} kg`
                                                : "-"
                                        }

                                    </td>

                                    {/* New declaration */}

                                    <td>

                                        <input
                                            className="queue-weight-input"
                                            type="number"
                                            min="1"
                                            value={
                                                inputValue
                                            }
                                            placeholder="Weight"
                                            onChange={(e) =>
                                                handleWeightChange(
                                                    athlete.entryId,
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </td>

                                    {/* Save */}

                                    <td>

                                        <button
                                            className="queue-save-btn"
                                            onClick={() =>
                                                handleSave(
                                                    athlete
                                                )
                                            }
                                        >
                                            Save
                                        </button>

                                    </td>

                                </tr>

                            );

                        }
                    )}

                </tbody>

            </table>

        </div>

    );

};

export default DeclarationQueue;