import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
    updateQueueDeclaration,
} from "../../api/axios";

import CurrentAthleteCard from "../../components/Admin/LiveScoreSheet/CurrentAthleteCard";
import NextAthleteCard from "../../components/Admin/LiveScoreSheet/NextAthleteCard";
import DeclarationQueue from "../../components/Admin/LiveScoreSheet/DeclarationQueue";
import ScoreboardTable from "../../components/Admin/LiveScoreSheet/ScoreboardTable";

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

        if (!currentAthlete) return;

        setDeclaredWeight(
            currentAthlete.currentAttempt?.declaredWeight ?? ""
        );

    }, [currentAthlete]);

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

        if (!currentAthlete) return;

        try {

            await saveDeclaredWeight({

                entryId: currentAthlete.entryId,

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
                        declaredWeight={declaredWeight}
                        setDeclaredWeight={
                            setDeclaredWeight
                        }
                        onChangeWeight={
                            handleCurrentDeclaration
                        }
                        onGoodLift={() =>
                            handleProcessLift("GOOD")
                        }
                        onNoLift={() =>
                            handleProcessLift("NO_LIFT")
                        }
                    />

                    <NextAthleteCard
                        nextAthlete={nextAthlete}
                    />

                </section>

                <section className="live-score-middle">

                    <DeclarationQueue
                        declarationQueue={
                            declarationQueue
                        }
                        onSaveWeight={
                            handleQueueDeclaration
                        }
                    />

                </section>

                <section className="live-score-bottom">

                    <ScoreboardTable
                        competitionResults={
                            competitionResults
                        }
                    />

                </section>

            </main>

        </div>

    );

};

export default LiveScore;