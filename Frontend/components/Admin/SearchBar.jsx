import "./SearchBar.css";

const SearchBar = ({ value, onChange, placeholder }) => {

    return (

        <div className="search-bar">

            <span className="search-icon">
                🔍
            </span>

            <input
                type="text"
                className="search-input"
                placeholder={placeholder || "Search..."}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

        </div>

    );

};

export default SearchBar;