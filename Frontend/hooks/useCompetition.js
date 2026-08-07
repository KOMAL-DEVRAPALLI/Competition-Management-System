import { useEffect, useState } from "react";
import { apiRequest } from "../api/axios.js";

const useCompetition = (competitionId) => {

    const [competition, setCompetition] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const fetchCompetition = async () => {

        try {

            const response =
                await apiRequest(
                    `/competition/${competitionId}`,
                    "GET"
                );

            setCompetition(response.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        if (competitionId) {

            fetchCompetition();

        }

    }, [competitionId]);

    return {

        competition,

        loading,

        fetchCompetition,

    };

};

export default useCompetition;