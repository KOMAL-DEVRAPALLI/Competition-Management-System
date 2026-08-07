import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    apiRequest,
    processLift as processLiftAPI,
    saveDeclaredWeight,
    updateQueueDeclaration,
} from "../../api/axios";
import "./LiveScore.css";

const LiveScore = () => {
    const { competitionId, gender } = useParams();
    const [liveCompetition, setLiveCompetition] = useState(null);
    const [loading, setLoading] = useState(true);

    const [declaredWeight, setDeclaredWeight] = useState("");
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [editingWeight, setEditingWeight] = useState("");
    const {
        currentAthlete,
        nextLifter,
        pendingDeclarations,
        competitionResults,
    } = liveCompetition || {};

    useEffect(() => {

        loadLiveCompetition();

        const interval = setInterval(
            loadLiveCompetition,
            3000
        );

        return () => clearInterval(interval);

    }, []);
    useEffect(() => {

        if (!currentAthlete) return;

        setDeclaredWeight(
            currentAthlete.currentAttempt?.declaredWeight ?? ""
        );

    }, [currentAthlete]);
    const handleProcessLift = async (result) => {

        try {

            await processLiftAPI({
                entryId: currentAthlete.entryId,
                competitionId,
                gender,
                result,
            });

            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };
    const handleDeclaredWeight = async () => {

        if (!currentAthlete) return;

        const weight = Number(declaredWeight);

        if (!weight || weight <= 0) {
            alert("Enter a valid declared weight.");
            return;
        }

        try {

            await saveDeclaredWeight({
                entryId: currentAthlete.entryId,
                competitionId,
                gender,
                declaredWeight: weight,
            });

            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };
    const handleQueueDeclaration = async (
        athlete
    ) => {

        const weight =
    Number(editingWeight);

        if (!weight || weight <= 0) {
            alert("Enter a valid weight.");
            return;
        }

        try {

            await updateQueueDeclaration({

                entryId: athlete.entryId,

                competitionId,

                gender,

                declaredWeight: weight,

            });

            // Editing is finished
            setEditingEntryId(null);
            setNextWeights((prev) => ({
                ...prev,
                [athlete.entryId]: weight,
            }));
            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };
    const loadLiveCompetition = async () => {

        try {

            const response = await apiRequest(
                `/live-competition/${competitionId}/${gender}`,
                "GET"
            );

            setLiveCompetition(response.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };
    const handleStartCompetition = async () => {

        try {

            await apiRequest(
                "/live-competition/start",
                "POST",
                {
                    competitionId,
                    gender,
                }
            );

            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };
    if (loading) {
        return <h2>Loading Live Competition...</h2>;
    }
    const isFirstAttempt =
        currentAthlete?.currentAttempt?.attemptNo === 1;
    return (

        <div className="live-score-page">

            <button onClick={handleStartCompetition}>
                Start Competition
            </button>

            <header className="live-header">

                <h1>Live Competition</h1>

                <p>
                    Competition : {competitionId} |{" "}
                    {gender === "female" ? "Women" : "Men"}
                </p>

            </header>

            <div className="live-top">

                <section className="panel">

                    <h2>Current Athlete</h2>

                    <p>
                        <strong>Name:</strong>{" "}
                        {currentAthlete?.name}
                    </p>

                    <p>
                        <strong>Lot:</strong>{" "}
                        {currentAthlete?.lotNumber}
                    </p>

                    <p>
                        <strong>Attempt:</strong>{" "}
                        {currentAthlete?.currentAttempt?.phase}{" "}
                        {currentAthlete?.currentAttempt?.attemptNo}
                    </p>

                    <p>
                        <strong>Current Weight:</strong>{" "}
                        {
                            currentAthlete?.currentAttempt
                                ?.declaredWeight ??
                            (
                                currentAthlete?.currentAttempt
                                    ?.phase === "SNATCH"
                                    ? currentAthlete?.openingSnatch
                                    : currentAthlete?.openingCleanJerk
                            )
                        }{" "}
                        kg
                    </p>
                    <div className="live-middle">

                        <section className="panel">
                            <div>

                                <label>Declared Weight (kg)</label>

                                <input
                                    type="number"
                                    style={{
                                        width: "120px",
                                        fontSize: "20px",
                                        padding: "8px",
                                    }}
                                    value={declaredWeight ?? ""}
                                    disabled={
                                        !currentAthlete ||
                                        isFirstAttempt
                                    }
                                    onChange={(e) =>
                                        setDeclaredWeight(e.target.value)
                                    }
                                />

                            </div>

                            <div className="control-buttons">

                                <button className="good-btn"
                                    onClick={() => handleProcessLift("GOOD")}
                                >
                                    GOOD LIFT
                                </button>

                                <button
                                    style={{
                                        background: "#dc3545",
                                        color: "white",
                                        fontSize: "22px",
                                        padding: "18px 35px",
                                        borderRadius: "8px",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                    disabled={!currentAthlete}
                                    onClick={() => handleProcessLift("NO_LIFT")}
                                >
                                    NO LIFT
                                </button>


                                <button
                                    disabled={!currentAthlete}
                                    onClick={handleDeclaredWeight}
                                >
                                    Change Weight
                                </button>


                            </div>

                        </section>



                    </div>

                </section>

            </div>

            <section className="entries-panel">

                <h2>Live Results</h2>

                <table>

                    <thead>

                        <tr>
                            <th>Lot</th>
                            <th>Name</th>
                            <th>Snatch</th>
                            <th>Clean & Jerk</th>
                            <th>Total</th>
                            <th>Next Weight</th>
                            <th>Action</th>
                        </tr>


                    </thead>

                    <tbody>
                        {competitionResults?.map((athlete) => (
                            <tr key={athlete.entryId}>

                                <td>{athlete.lotNumber}</td>

                                <td>{athlete.name}</td>

                                <td>
                                    {athlete.bestSnatch > 0
                                        ? athlete.bestSnatch
                                        : athlete.openingSnatch}
                                </td>

                                <td>
                                    {athlete.bestCleanJerk > 0
                                        ? athlete.bestCleanJerk
                                        : athlete.openingCleanJerk}
                                </td>

                                <td>{athlete.total}</td>

                                <td>
                                    {athlete.currentAttempt?.completed ? (
                                        <span className="completed">
                                            COMPLETED
                                        </span>
                                    ) : athlete.entryId?.toString() ===
                                        currentAthlete?.entryId?.toString() ? (
                                        <span className="on-platform">
                                            ON PLATFORM
                                        </span>
                                    ) : (
                                        <>
                                            <input
                                                className="declared-weight-input"
                                                type="number"
                                                value={
                                                    editingEntryId === athlete.entryId
                                                        ? editingWeight
                                                        : athlete.currentAttempt?.declaredWeight ??
                                                        athlete.currentAttempt?.previousDeclaredWeight ??
                                                        ""
                                                }
                                                onFocus={() => {

                                                    setEditingEntryId(athlete.entryId);

                                                    setEditingWeight(

                                                        athlete.currentAttempt?.declaredWeight ??

                                                        athlete.currentAttempt?.previousDeclaredWeight ??

                                                        ""

                                                    );

                                                }} onBlur={() => setEditingEntryId(null)}
                                                onChange={(e) =>
    setEditingWeight(e.target.value)
}
                                            />

                                            {athlete.entryId?.toString() ===
                                                nextLifter?.entryId?.toString() && (
                                                    <div
                                                        style={{
                                                            color: "#f59e0b",
                                                            fontWeight: "bold",
                                                            marginTop: "6px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        NEXT
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </td>

                                <td>
                                    {athlete.entryId?.toString() ===
                                        currentAthlete?.entryId?.toString() ? (
                                        "-"
                                    ) : (
                                        <button
                                            onClick={() =>
                                                handleQueueDeclaration(
                                                    athlete
                                                )
                                            }
                                        >
                                            Save
                                        </button>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>

            </section>

            <footer className="live-footer">

                <span>Competition Status : Ready</span>

                <span>
                    Athletes : {liveCompetition?.totalAthletes}
                </span>

            </footer>
        </div>
    );
};

export default LiveScore;