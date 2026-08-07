import { useState, useEffect } from "react";
import { previewWeighIn, saveWeighIn } from "../../../api/axios.js";
import "./WeighIn.css";

const WeighInSection = ({ athlete, setAthlete }) => {
    const [saving, setSaving] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [official, setOfficial] = useState({
        bodyWeight: "",
        lotNumber: "",
    });

    const [previewEntries, setPreviewEntries] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setOfficial((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Load existing official values when athlete changes
    useEffect(() => {
        if (!athlete?.competitionEntries?.length) return;

        const firstEntry = athlete.competitionEntries[0];

        setOfficial({
            bodyWeight: firstEntry?.official?.bodyWeight || "",
            lotNumber: firstEntry?.official?.lotNumber || "",
        });
    }, [athlete]);

    // Preview weight category whenever body weight changes
    useEffect(() => {
        if (!athlete || !official.bodyWeight) {
            setPreviewEntries([]);
            return;
        }

        const fetchEligibleCategories = async () => {
            try {
                setLoadingCategories(true);

                const previewData = {
                    competitionId: athlete.competition,
                    athleteId: athlete._id,
                    bodyWeight: Number(official.bodyWeight),
                };

                const response = await previewWeighIn(previewData);

                setPreviewEntries(response.data);


            } catch (error) {
                console.error(error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchEligibleCategories();
    }, [official.bodyWeight, athlete]);

    const handleSave = async () => {
        try {
            setSaving(true)
            const selectedCategories = previewEntries.reduce((acc, entry) => {
                acc[entry.entryId] = entry.assignedCategory
                return acc
            }, {})
            const saveData = {
                competitionId: athlete.competition,
                athleteId: athlete._id,
                bodyWeight: Number(official.bodyWeight),
                lotNumber: Number(official.lotNumber),
                selectedCategories,
            };
            const response = await saveWeighIn(saveData)
            setAthlete(response.data.athlete)
            
            alert("Weigh-in saved successfully!")
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                error.message
            );
        }
        finally {
            setSaving(false)
        }
    };

    return (

        <div className="entry-card">
            <div className="entry-card-header success-header">
                <h2 className="entry-card-title">
                    Official Weigh-In
                </h2>
            </div>

            <div className="entry-card-body">
                <div className="form-grid">

                    <div className="form-group">
                        <label>Body Weight (kg)</label>

                        <input
                            type="number"
                            min="1"
                            step="0.001"
                            name="bodyWeight"
                            value={official.bodyWeight}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Lot Number</label>

                        <input
                            type="number"
                            min="1"
                            name="lotNumber"
                            value={official.lotNumber}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        {previewEntries.map((previewEntry) => (
                            <div key={previewEntry.entryId} className="preview-entry">
                                <h4>{previewEntry.ageCategory}</h4>

                                <label>Weight Categories</label>
                                {previewEntry.requiresSelection ? (
                                    <select
                                        value={previewEntry.assignedCategory || ""}
                                        onChange={(e) => {
                                            setPreviewEntries((prevEntries) =>
                                                prevEntries.map((entry) => {
                                                    if (entry.entryId === previewEntry.entryId) {
                                                        return {
                                                            ...entry,
                                                            assignedCategory: e.target.value
                                                        }
                                                    }

                                                    return entry
                                                })
                                            );
                                        }}
                                    >
                                        {previewEntry.eligibleCategories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >

                                                {category}
                                            </option>

                                        ))}

                                    </select>
                                ) : (
                                    <input
                                        readOnly
                                        value={previewEntry.assignedCategory}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                </div>

                <div className="form-actions">
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={saving || loadingCategories}
                    >
                        {saving ? "Saving..." : "Save Weigh-In"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WeighInSection;