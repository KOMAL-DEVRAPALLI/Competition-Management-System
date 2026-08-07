import "./StartCompetitionModal.css";

const StartCompetitionModal = ({
    open,
    sessionName,
    setSessionName,
    availableWeightCategories,
    selectedWeightCategories,
    setSelectedWeightCategories,
    onClose,
    onStart,
}) => {

    if (!open) return null;

    const toggleCategory = (category) => {

        if (
            selectedWeightCategories.includes(
                category
            )
        ) {

            setSelectedWeightCategories(
                selectedWeightCategories.filter(
                    (item) =>
                        item !== category
                )
            );

        } else {

            setSelectedWeightCategories([
                ...selectedWeightCategories,
                category,
            ]);

        }

    };

    const handleSelectAll = () => {

        if (
            selectedWeightCategories.length ===
            availableWeightCategories.length
        ) {

            setSelectedWeightCategories([]);

        } else {

            setSelectedWeightCategories(
                availableWeightCategories
            );

        }

    };

    return (

        <div className="start-modal-overlay">

            <div className="start-modal">

                <h2>
                    Start Live Competition
                </h2>

                <div className="start-modal-group">

                    <label>
                        Session Name
                    </label>

                    <input
                        type="text"
                        value={sessionName}
                        placeholder="Example: Women Group A"
                        onChange={(e) =>
                            setSessionName(
                                e.target.value
                            )
                        }
                    />

                </div>

                <div className="start-modal-group">

                    <label>
                        Weight Categories
                    </label>

                    <div className="category-grid">

                        {availableWeightCategories.map(
                            (category) => (

                                <label
                                    key={category}
                                    className="category-item"
                                >

                                    <input
                                        type="checkbox"
                                        checked={selectedWeightCategories.includes(
                                            category
                                        )}
                                        onChange={() =>
                                            toggleCategory(
                                                category
                                            )
                                        }
                                    />

                                    {category}

                                </label>

                            )
                        )}

                    </div>

                </div>

                <div className="select-all-row">

                    <label>

                        <input
                            type="checkbox"
                            checked={
                                selectedWeightCategories.length ===
                                availableWeightCategories.length
                            }
                            onChange={
                                handleSelectAll
                            }
                        />

                        Select All

                    </label>

                </div>

                <div className="start-modal-actions">

                    <button
                        className="cancel-btn"
                        onClick={onClose}
                    >

                        Cancel

                    </button>

                    <button
                        className="start-btn"
                        onClick={onStart}
                    >

                        Start Competition

                    </button>

                </div>

            </div>

        </div>

    );

};

export default StartCompetitionModal;