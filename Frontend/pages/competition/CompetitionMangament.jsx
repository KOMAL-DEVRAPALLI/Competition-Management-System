import { useNavigate, useParams } from "react-router-dom";

import "./CompetitionManagement.css";


const CompetitionManagement = () => {

    const {
        competitionId,
    } = useParams();

    const navigate =
        useNavigate();


    return (

        <div className="competition-management-page">

            <div className="competition-management-header">

                <h1>
                    Competition Management
                </h1>

                <p>
                    Select a session to manage athletes.
                </p>

            </div>


            <div className="competition-management-actions">

                <button
                    onClick={() =>
                        navigate(
                            `/admin/competition/${competitionId}/athletes/male`
                        )
                    }
                >
                    Men's Session
                </button>


                <button
                    onClick={() =>
                        navigate(
                            `/admin/competition/${competitionId}/athletes/female`
                        )
                    }
                >
                    Women's Session
                </button>

            </div>

        </div>

    );

};


export default CompetitionManagement;