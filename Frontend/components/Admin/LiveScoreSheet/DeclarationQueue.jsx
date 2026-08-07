import { useState } from "react";

const DeclarationQueue = ({
    declarationQueue,
    onSaveWeight,
}) => {

    const [queueWeights, setQueueWeights] =
        useState({});

    if (!declarationQueue.length) {
        return (
            <div className="declaration-queue">

                <div className="declaration-queue-header">
                    <h2>Declaration Queue</h2>
                </div>

                <p>No Athletes Waiting</p>

            </div>
        );
    }

    return (

        <div className="declaration-queue">

            <div className="declaration-queue-header">

                <h2>Declaration Queue</h2>

            </div>

            <table className="declaration-queue-table">

                <thead>

                    <tr>

                        <th>Lot</th>

                        <th>Name</th>

                        <th>Attempt</th>

                        <th>Current Weight</th>

                        <th>New Weight</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {declarationQueue.map(
                        (athlete) => (

                            <tr key={athlete.entryId}>

                                <td>
                                    {athlete.lotNumber}
                                </td>

                                <td>
                                    {athlete.name}
                                </td>

                                <td>
                                    {athlete.currentAttempt.phase}
                                    {" "}
                                    {athlete.currentAttempt.attemptNo}
                                </td>

                                <td>
                                    {athlete.currentAttempt
                                        .declaredWeight ??
                                        (
                                            athlete.currentAttempt.phase ===
                                            "SNATCH"
                                                ? athlete.openingSnatch
                                                : athlete.openingCleanJerk
                                        )}
                                </td>

                                <td>

                                    <input
                                        className="declaration-queue-input"
                                        type="number"
                                        value={
                                            queueWeights[
                                                athlete.entryId
                                            ] ?? ""
                                        }
                                        onChange={(e) =>
                                            setQueueWeights({
                                                ...queueWeights,
                                                [athlete.entryId]:
                                                    e.target.value,
                                            })
                                        }
                                    />

                                </td>

                                <td>

                                    <button
                                        className="declaration-queue-save-btn"
                                        onClick={() =>
                                            onSaveWeight(
                                                athlete.entryId,
                                                Number(
                                                    queueWeights[
                                                        athlete.entryId
                                                    ]
                                                )
                                            )
                                        }
                                    >
                                        Save
                                    </button>

                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>

    );

};

export default DeclarationQueue;