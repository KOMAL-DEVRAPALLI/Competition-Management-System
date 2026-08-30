import searchAthletes
    from "../../services/admin/searchAthletes.js";


// =====================================
// SEARCH EXISTING ATHLETES
//
// GET
// /api/admin/athletes/search?q=Komal
//
// Protected: Admin only
// =====================================

export const searchAthletesController =
    async (req, res) => {

        try {

            const {
                q = "",
            } = req.query;

            const athletes =
                await searchAthletes(q);

            return res.status(200).json({

                success: true,

                count:
                    athletes.length,

                data:
                    athletes,

            });

        } catch (error) {

            console.error(
                "Search athletes controller error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to search athletes.",

            });

        }
    };