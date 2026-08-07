import { useEffect, useState } from "react";
import { getCompetitionEntries } from "../services/competitionEntryApi";

const useCompetitionEntries = (competitionId) => {

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchEntries = async () => {

            try {

                const response =
                    await getCompetitionEntries(
                        competitionId
                    );

                setEntries(response.data);

            } catch (error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        };

    useEffect(() => {

        
        fetchEntries();

    }, [competitionId]);

    return {
        entries,
        loading,
        fetchEntries
    };

};

export default useCompetitionEntries;