import getAthleteCompetitionEntries from "../competitionEntry/getAthleteCompetitionEntries.js";
import getAthleteWeighInDetails from "../athleteWeighIn/getAthleteWeighInDetails.js";

const updateOpeningLifts = async ({
    competitionId,
    athleteId,
    snatch,
    cleanJerk,
}) => {

    const competitionEntries =
        await getAthleteCompetitionEntries(
            competitionId,
            athleteId
        );

    for (const entry of competitionEntries) {

    entry.opening.snatch = snatch;
    entry.opening.cleanJerk = cleanJerk;

  if (
    entry.snatchAttempts[0].declaredWeight === null
) {
    entry.snatchAttempts[0].declaredWeight = snatch;
}

if (
    entry.cleanJerkAttempts[0].declaredWeight === null
) {
    entry.cleanJerkAttempts[0].declaredWeight = cleanJerk;
}
    await entry.save();

}

    return await getAthleteWeighInDetails({
        competitionId,
        athleteId,
    });

};

export default updateOpeningLifts;