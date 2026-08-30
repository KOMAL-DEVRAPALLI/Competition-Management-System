import addAthleteToCompetition
    from "../../services/admin/addAthleteToCompetition.js";


export const addAthleteController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
        } = req.params;


        const {
            fullName,
            phone,
            dob,
            schoolName,
            gender,
            ageCategory,
        } = req.body;


        const result =
            await addAthleteToCompetition({

                competitionId,

                fullName,

                phone,

                dob,

                schoolName,

                gender,

                ageCategory,

            });


        return res.status(201).json({

            success: true,

            message:
                "Athlete added to competition successfully.",

            data: {

                athlete:
                    result.athlete,

                competitionEntry:
                    result.competitionEntry,

                ageCategory:
                    result.ageCategory,

            },

        });

    } catch (error) {

        console.error(
            "Add athlete controller error:",
            error
        );


        return res.status(
            error.statusCode ?? 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to add athlete.",

        });

    }

};