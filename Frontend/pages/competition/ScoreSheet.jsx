import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/axios";

const ScoreSheet = () => {

    const { entryId } = useParams();

    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchEntry();

    }, [entryId]);

    const fetchEntry = async () => {

        try {

            const response = await apiRequest(
                `/competition-entry/entry/${entryId}`,
                "GET"
            );

            setEntry(response.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {
        return <h3 className="text-center mt-5">Loading...</h3>;
    }

    return (

        <div className="container mt-4">

            <h2>Score Sheet</h2>

            <hr />

            <h4>{entry.athleteId.personalInfo.fullName}</h4>

            <p>
                Registration :
                {entry.athleteId.registrationNo}
            </p>

            <p>
                Body Weight :
                {entry.official.bodyWeight}
            </p>

            <p>
                Opening Snatch :
                {entry.opening.snatch}
            </p>

            <p>
                Opening Clean & Jerk :
                {entry.opening.cleanJerk}
            </p>

        </div>

    );

};

export default ScoreSheet;