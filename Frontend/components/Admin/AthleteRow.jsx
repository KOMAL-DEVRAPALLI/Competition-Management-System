import { useNavigate } from "react-router-dom";
import "./AthleteTable.css";

const AthleteRow = ({
    index,
    entry,
}) => {

    const navigate =
        useNavigate();


    // =====================================
    // ATHLETE
    // =====================================

    const athlete =
        entry?.athleteId;


    // =====================================
    // COMPETITION ENTRIES
    //
    // U17 / U19 is stored here.
    // =====================================

    const competitionEntries =
        entry?.competitionEntries ?? [];


    // =====================================
    // PRIMARY ENTRY
    //
    // The current table represents one
    // athlete row, so use the first
    // competition entry for navigation.
    // =====================================

    const firstEntry =
        competitionEntries[0];


    const competitionId =
        firstEntry?.competitionId;


    const athleteId =
        athlete?._id;


    // =====================================
    // AGE CATEGORIES
    //
    // IMPORTANT:
    //
    // Do NOT use:
    // athlete.participations
    //
    // Competition-specific U17/U19 comes
    // from CompetitionEntry.
    // =====================================

    const ageCategories = [

        ...new Set(

            competitionEntries

                .map(
                    (competitionEntry) =>
                        competitionEntry
                            ?.competitionCategory
                            ?.ageCategory
                            ?.trim()
                            .toUpperCase()
                )

                .filter(Boolean)

        ),

    ];


    // =====================================
    // MANAGE
    // =====================================

    const handleManage = () => {

        if (
            !competitionId ||
            !athleteId
        ) {

            console.error(
                "Unable to manage athlete: missing competition or athlete ID.",
                {
                    competitionId,
                    athleteId,
                }
            );

            return;
        }


        navigate(
            `/admin/competition-entry/${competitionId}/${athleteId}`
        );

    };


    // =====================================
    // RENDER
    // =====================================

    return (

        <tr>

            <td>
                {index + 1}
            </td>


            <td>
                {athlete?.registrationNo || "—"}
            </td>


            <td>
                {
                    athlete
                        ?.personalInfo
                        ?.fullName || "—"
                }
            </td>


            <td>

                {ageCategories.length === 0 ? (

                    <span className="category-badge">
                        —
                    </span>

                ) : (

                    ageCategories.map(
                        (ageCategory) => (

                            <span
                                key={ageCategory}
                                className={
                                    `category-badge ${ageCategory.toLowerCase()}`
                                }
                            >

                                {ageCategory}

                            </span>

                        )
                    )

                )}

            </td>


            <td>

                <button
                    type="button"
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