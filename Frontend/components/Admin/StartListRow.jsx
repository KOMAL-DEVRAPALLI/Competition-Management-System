import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/axios";

const StartList = () => {
    const { competitionId } = useParams();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const response = await apiRequest(
    `/competition-entry/competition/${competitionId}`,
    "GET"
);

const groupedEntries = Object.values(
    response.data.reduce((acc, entry) => {
        const athleteId = entry.athleteId._id;

        if (!acc[athleteId]) {
            acc[athleteId] = {
                ...entry,
                competitionEntries: [entry],
            };
        } else {
            acc[athleteId].competitionEntries.push(entry);
        }

        return acc;
    }, {})
);

setEntries(groupedEntries);
                
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [competitionId]);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div>
            <h1>Start List</h1>

            <pre>
                {JSON.stringify(entries, null, 2)}
            </pre>
        </div>
    );
};

export default StartList;