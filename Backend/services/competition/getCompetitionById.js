import Competition from "../../models/Competition.js";

const getCompetitionById = async (competitionId) => {

    const competition = await Competition.findById(
        competitionId
    );

    if (!competition) {
        throw new Error(
            "Competition not found."
        );
    }

    return competition;

};

export default getCompetitionById;