import { useState } from "react";
import "./DeclarationQueue.css"
const DeclarationQueue = ({
    declarationQueue,
    onSaveWeight,
}) => {

    const [weights, setWeights] = useState({});

    if (!declarationQueue?.length) {

        return (

            <div className="declaration-queue-card">

                <h2>
                    Declaration Queue
                </h2>

                <div className="declaration-queue-empty">

                    No Athletes Waiting

                </div>

            </div>

        );

    }

    return (

        <div className="declaration-queue-card">

            <div className="declaration-queue-header">

                <h2>
                    Declaration Queue
                </h2>

            </div>

            <table className="declaration-queue-table">

                <thead>

                    <tr>

                        <th>Lot</th>

                        <th>Name</th>

                        <th>Attempt</th>

                        <th>Current</th>

                        <th>New</th>

                        <th></th>

                    </tr>

                </thead>

                <tbody>

                    {declarationQueue.map((athlete) => {

                        const currentWeight =
                            athlete.currentAttempt.declaredWeight ??
                            (
                                athlete.currentAttempt.phase ===
                                "SNATCH"
                                    ? athlete.openingSnatch
                                    : athlete.openingCleanJerk
                            );

                        return (

                            <tr key={athlete.entryId}>

                                <td>{athlete.lotNumber}</td>

                                <td>{athlete.name}</td>

                                <td>

                                    {athlete.currentAttempt.phase}
                                    {" "}
                                    {athlete.currentAttempt.attemptNo}

                                </td>

                                <td>

                                    {currentWeight} kg

                                </td>

                                <td>

                                    <input
                                        className="queue-weight-input"
                                        type="number"
                                        value={
                                            weights[
                                                athlete.entryId
                                            ] ??
                                            currentWeight
                                        }
                                        onChange={(e) =>
                                            setWeights({
                                                ...weights,
                                                [athlete.entryId]:
                                                    e.target.value,
                                            })
                                        }
                                    />

                                </td>

                                <td>

                                    <button
                                        className="queue-save-btn"
                                        onClick={() =>
                                            onSaveWeight(
                                                athlete.entryId,
                                                Number(
                                                    weights[
                                                        athlete.entryId
                                                    ] ??
                                                    currentWeight
                                                )
                                            )
                                        }
                                    >

                                        Save

                                    </button>

                                </td>

                            </tr>

                        );

                    })}

                </tbody>

            </table>

        </div>

    );

};

export default DeclarationQueue;