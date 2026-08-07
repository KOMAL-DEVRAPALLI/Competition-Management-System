import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/axios";

import "./StartList.css";

const StartList = () => {

    const { competitionId, gender: sessionGender } = useParams();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const downloadPDF = () => {

        window.open(
            `${import.meta.env.VITE_API_URL}/working-sheet/${competitionId}/${sessionGender}`,
            "_blank"
        );

    };
    const displayEntries = entries;

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const response = await apiRequest(
                `/working-sheet/data/${competitionId}/${sessionGender}`,
                "GET"
            );



            setEntries(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {

        return (
            <div className="loading-page">
                Loading Start List...
            </div>
        );

    }
   
    return (

        <div className="start-list-page">

            <div className="start-list-header">

                <div>

                    <h1 className="page-title">
                        {sessionGender === "female"
                            ? "Women's Start List"
                            : "Men's Start List"}
                    </h1>

                    <p className="page-subtitle">
                        Competition ID : {competitionId}
                    </p>

                </div>

            </div>
            <div className="start-list-actions">


                <button
                    className="pdf-btn"
                    onClick={downloadPDF}
                >
                    📄 Download PDF
                </button>
                
            </div>
            <div className="table-wrapper">

                <table className="start-table">

                    <thead>

                        <tr>

                            <th>Lot</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Body Weight</th>
                            <th>Weight Category</th>
                            <th>Opening Snatch</th>
                            <th>Opening C&J</th>
                            <th>Status</th>

                        </tr>

                    </thead>

                    <tbody>

                        {entries.map((entry) => (

                            <tr key={entry.entryId}>

                                <td>{entry.lotNumber}</td>

                                <td>{entry.name}</td>

                                <td>{entry.gender}</td>

                                <td>{entry.bodyWeight}</td>

                                <td>{entry.displayWeightCategory}</td>

                                <td>{entry.openingSnatch}</td>

                                <td>{entry.openingCleanJerk}</td>

                                <td>READY</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

};

export default StartList;