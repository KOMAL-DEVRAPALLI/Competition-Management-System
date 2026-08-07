import AthleteRow from "./AthleteRow";
import "./AthleteTable.css";

const AthleteTable = ({ entries }) => {

    return (

        <div className="athlete-table-wrapper">

            <table className="athlete-table">

                <thead>

                    <tr>

                        <th>#</th>
                        <th>Registration No</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {
                        entries.length === 0 ?

                            (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="empty-row"
                                    >

                                        No Athletes Found

                                    </td>

                                </tr>

                            )

                            :

                            (

                                entries.map((entry, index) => (

                                   <AthleteRow
    key={entry.athleteId._id}
    index={index}
    entry={entry}
/>

                                ))

                            )

                    }

                </tbody>

            </table>

        </div>

    );

};

export default AthleteTable;