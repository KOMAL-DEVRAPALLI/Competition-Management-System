import { useNavigate } from "react-router-dom";
import "./AthleteTable.css";

const AthleteRow = ({ index, entry }) => {
    const navigate = useNavigate();
    const firstEntry = entry.competitionEntries[0];
    const competitionId = firstEntry.competitionId
    const athleteId = entry.athleteId._id

    const handleManage = () => {
        navigate(`/admin/competition-entry/${competitionId}/${athleteId}`);
    };

    return (
        <tr>

            <td>{index + 1}</td>

            <td>{entry.athleteId.registrationNo}</td>

            <td>{entry.athleteId.personalInfo.fullName}</td>

           <td>
    {entry.athleteId.participations.map((p) => (
        <span
            key={p.category}
            className={`category-badge ${p.category.toLowerCase()}`}
        >
            {p.category}
        </span>
    ))}
</td>
            <td>
                <button
                    className="manage-btn"
                    onClick={handleManage}
                >
                    Manage
                </button>
            </td>

        </tr>
    );
};

export default AthleteRow;