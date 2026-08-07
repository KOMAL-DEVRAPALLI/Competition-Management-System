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
    } = props;

    return (

        <div className="filter-bar">

            <div className="filter-group">

                <label>Category</label>

                <select
                    className="filter-select"
                    value={category}
                    
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="Youth">Youth</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                </select>

            </div>

            <div className="filter-group">

                <label>Gender</label>

                <select
                    className="filter-select"
                    value={gender}
                    onChange={(e) => onGenderChange(e.target.value)}
                >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>

            </div>



            <div className="filter-actions">

                <button
                    className="reset-btn"
                    onClick={onReset}
                >
                    Reset Filters
                </button>

            </div>

        </div>

    );

};

export default FilterBar;