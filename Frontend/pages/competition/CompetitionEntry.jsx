import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getAthleteWeighInDetails } from "../../services/competitionEntryApi";

import "./CompetitionEntry.css";

import AthleteInformation from "../../components/Admin/competitionEntry/AthleteInformation";
import WeighInSection from "../../components/Admin/competitionEntry/WeightIn";
import OpeningLiftSection from "../../components/Admin/competitionEntry/OpeningLiftSection";
import ActionButtons from "../../components/Admin/competitionEntry/ActionButtons";

const CompetitionEntry = () => {

    const { competitionId, athleteId } = useParams();

    const [athlete, setAthlete] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchAthleteWeighInDetails = async () => {

            try {

                const response =
                    await getAthleteWeighInDetails({ competitionId, athleteId });

                setAthlete(response.data.athlete);

            }
            catch (error) {

                console.log(error);

            }
            finally {

                setLoading(false);

            }

        };

        fetchAthleteWeighInDetails()

    }, [competitionId, athleteId]);

    if (loading) {

        return (
            <div className="loading-page">
                Loading...
            </div>
        );

    }

    if (!athlete) {

        return (
            <div className="error-page">
                Athlete Not Found!
            </div>
        );

    }

    return (

        <div className="competition-entry-page">

            <div className="competition-entry-header">

                <div>

                    <h1 className="page-title">
                        Athlete Weigh-In
                    </h1>

                    <p className="page-subtitle">
                        Manage athlete weigh-in and weight category assignment
                    </p>

                </div>

                <div className="registration-badge">
                    {athlete.registrationNo}
                </div>

            </div>

            <div className="competition-entry-content">

                <AthleteInformation
                    athlete={athlete}
                />

                <WeighInSection
                    athlete={athlete}
                    setAthlete={setAthlete}
                />

                <OpeningLiftSection
                     athlete={athlete}
                    setAthlete={setAthlete}
                />

                <ActionButtons
                    athlete={athlete}
                />

            </div>

        </div>

    );

};

export default CompetitionEntry;