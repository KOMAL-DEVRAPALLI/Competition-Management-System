import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
    updateQueueDeclaration,
} from "../../api/axios";

import CurrentAthleteCard from "../../components/Admin/LiveScoreSheet/CurrentLifterCard";
import PrepareNextAttemptCard from "../../components/Admin/LiveScoreSheet/PrepareNextAthleteCard";
import DeclarationQueue from "../../components/Admin/LiveScoreSheet/DeclarationQueue";
import ScoreboardTable from "../../components/Admin/LiveScoreSheet/LiveResultTable";

import "./LiveScore.css";

const LiveScore = () => {

    const { competitionId, gender } = useParams();

    const [loading, setLoading] = useState(true);

    const [liveCompetition, setLiveCompetition] =
        useState(null);

    const [declaredWeight, setDeclaredWeight] =
        useState("");

   const {
    currentAthlete,
    prepareAthlete,
    nextAthlete,
    declarationQueue,
    competitionResults,
    status,
    currentPhase,
    totalAthletes,
} = liveCompetition || {};

    useEffect(() => {

        loadLiveCompetition();

    }, []);

    useEffect(() => {

    if (!prepareAthlete) {

        setDeclaredWeight("");

        return;

    }

    setDeclaredWeight(
        prepareAthlete.currentAttempt?.declaredWeight ?? ""
    );

}, [prepareAthlete]);
const handlePrepareDeclaration = async () => {

    if (!prepareAthlete) return;

    try {

        await saveDeclaredWeight({

            entryId: prepareAthlete.entryId,

            declaredWeight: Number(declaredWeight),

        });

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

    console.log("Backend Response:");
    console.log(error.response?.data);

} finally {

            setLoading(false);

        }

    };

    const handleProcessLift = async (result) => {

        if (!currentAthlete) return;

        try {

            await processLift({

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

    const handleCurrentDeclaration = async () => {

        if (!nextAthlete) return;

        try {

            await saveDeclaredWeight({

                entryId: nextAthlete.entryId,

                declaredWeight: Number(declaredWeight),

            });

            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };

    const handleQueueDeclaration = async (
        entryId,
        declaredWeight
    ) => {

        try {

            await updateQueueDeclaration({

                entryId,

                declaredWeight,

            });

            await loadLiveCompetition();

        } catch (error) {

            console.log(error);

        }

    };

    if (loading) {

        return (
            <h2>Loading Live Competition...</h2>
        );

    }

    return (

        <div className="live-score-page">

            <header className="live-score-header">

                <h1>
                    Live Competition
                </h1>

                <div className="live-score-session">

                    <span>
                        Status : {status}
                    </span>

                    <span>
                        Phase : {currentPhase}
                    </span>

                    <span>
                        Athletes : {totalAthletes}
                    </span>

                </div>

            </header>

            <main className="live-score-content">

                <section className="live-score-top">

                    <CurrentAthleteCard
                        currentAthlete={currentAthlete}
                        onGoodLift={() =>
                            handleProcessLift("GOOD")
                        }
                        onNoLift={() =>
                            handleProcessLift("NO_LIFT")
                        }
                    />

                    <PrepareNextAttemptCard
    prepareAthlete={prepareAthlete}
    declaredWeight={declaredWeight}
    setDeclaredWeight={setDeclaredWeight}
    onSaveWeight={handlePrepareDeclaration}
/>

                </section>

                <section className="live-score-middle">

                    <DeclarationQueue
                        declarationQueue={declarationQueue}
                        onSaveWeight={handleQueueDeclaration}
                    />

                </section>

                <section className="live-score-bottom">

                    <ScoreboardTable
                        competitionResults={competitionResults}
                    />

                </section>

            </main>

        </div>

    );

};

export default LiveScore;