import "./filterBar.css";


const FilterBar = (props) => {

    const {

        category,

        onCategoryChange,

        gender,

        onGenderChange,

        status,

        onStatusChange,

        onReset,

        ageCategories = [
            "U17",
            "U19",
        ],

    } = props;


    return (

        <div className="filter-bar">


            {/* =================================
                AGE CATEGORY
            ================================= */}

            <div className="filter-group">

                <label>
                    Age Category
                </label>


                <select

                    className="filter-select"

                    value={
                        category
                    }

                    onChange={(e) =>
                        onCategoryChange(
                            e.target.value
                        )
                    }

                >

                    <option value="">
                        All Categories
                    </option>


                    {ageCategories.map(
                        (ageCategory) => (

                            <option
                                key={
                                    ageCategory
                                }
                                value={
                                    ageCategory
                                }
                            >

                                {ageCategory}

                            </option>

                        )
                    )}

                </select>

            </div>


            {/* =================================
                GENDER
            ================================= */}

            <div className="filter-group">

                <label>
                    Gender
                </label>


                <select

                    className="filter-select"

                    value={
                        gender
                    }

                    onChange={(e) =>
                        onGenderChange(
                            e.target.value
                        )
                    }

                >

                    <option value="">
                        All Genders
                    </option>


                    <option value="Male">
                        Male
                    </option>


                    <option value="Female">
                        Female
                    </option>

                </select>

            </div>


            {/* =================================
                STATUS
            ================================= */}

            <div className="filter-group">

                <label>
                    Status
                </label>


                <select

                    className="filter-select"

                    value={
                        status
                    }

                    onChange={(e) =>
                        onStatusChange(
                            e.target.value
                        )
                    }

                >

                    <option value="">
                        All Status
                    </option>


                    <option value="PENDING">
                        Pending
                    </option>


                    <option value="WEIGHED">
                        Weighed
                    </option>


                    <option value="READY">
                        Ready
                    </option>


                    <option value="COMPETING">
                        Competing
                    </option>


                    <option value="COMPLETED">
                        Completed
                    </option>

                </select>

            </div>


            {/* =================================
                RESET
            ================================= */}

            <div className="filter-actions">

                <button

                    type="button"

                    className="reset-btn"

                    onClick={
                        onReset
                    }

                >

                    Reset Filters

                </button>

            </div>


        </div>

    );

};


export default FilterBar;