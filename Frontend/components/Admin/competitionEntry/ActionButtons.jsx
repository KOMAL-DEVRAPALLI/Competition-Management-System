import { useNavigate } from "react-router-dom";
import "./ActionButtons.css"
const ActionButtons = ({ athlete }) => {

    const navigate = useNavigate();

    const handleBack = () => {
    const gender = athlete.personalInfo.gender.toLowerCase();

    navigate(
        `/admin/competition/${athlete.competition}/athletes/${gender}`,
        {
            replace: true,
        }
    );
};

  
    return (

        <div className="entry-card">

            <div className="entry-card-header dark-header">

                <h2 className="entry-card-title">
                    Actions
                </h2>

            </div>

            <div className="entry-card-body">

                <div className="action-buttons">

                    <button
                        className="secondary-btn"
                        onClick={handleBack}
                    >
                        ← Back to Athlete List
                    </button>

                </div>

            </div>

        </div>

    );

};

export default ActionButtons;