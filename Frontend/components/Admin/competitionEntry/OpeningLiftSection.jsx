import { useEffect, useState } from "react";
import { saveOpeningLifts } from "../../../api/axios";
import "./OpeningLiftSection.css"
const OpeningLiftSection = ({ athlete, setAthlete }) => {

    const [opening, setOpening] = useState({
        snatch: "",
        cleanJerk: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (!athlete?.competitionEntries?.length) return;

        const firstEntry = athlete.competitionEntries[0];

        setOpening({
            snatch: firstEntry.opening?.snatch || "",
            cleanJerk: firstEntry.opening?.cleanJerk || "",
        });

    }, [athlete]);
    const handleChange = (e) => {

        const { name, value } = e.target;

        setOpening((prev) => ({
            ...prev,
            [name]: value,
        }));

    };

    const handleSave = async () => {

        try {
            setLoading(true)
            const saveData = {
                competitionId: athlete.competition,
                athleteId: athlete._id,
                snatch: Number(opening.snatch),
                cleanJerk: Number(opening.cleanJerk),
            };
            const response = await saveOpeningLifts(saveData)
            setAthlete(response.data.athlete)
            alert("Opening lifts added successfully!");
        } catch (error) {

            console.error(error);
            alert(
                error.response?.data?.message ||
                error.message
            );
        }
        finally {
            setLoading(false)
        }
    };

    return (

        <div className="entry-card">

            <div className="entry-card-header warning-header">

                <h2 className="entry-card-title">
                    Opening Lifts
                </h2>

            </div>

            <div className="entry-card-body">

                <div className="form-grid">

                    <div className="form-group">

                        <label>Opening Snatch</label>

                        <input
                            type="number"
                            name="snatch"
                            value={opening.snatch}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group">

                        <label>Opening Clean & Jerk</label>

                        <input
                            type="number"
                            name="cleanJerk"
                            value={opening.cleanJerk}
                            onChange={handleChange}
                        />

                    </div>

                </div>

                <div className="form-actions">

                    <button
                        className="warning-btn"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : "Save Opening Lifts"}
                    </button>

                </div>

            </div>

        </div>

    );

};

export default OpeningLiftSection;