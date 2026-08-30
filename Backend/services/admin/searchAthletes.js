import Athlete from "../../models/Athlete.js";

const searchAthletes = async (search = "") => {

    const normalizedSearch =
        String(search ?? "").trim();

    if (!normalizedSearch) {
        return [];
    }

    const escapedSearch =
        normalizedSearch.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    const searchRegex =
        new RegExp(
            escapedSearch,
            "i"
        );

    const athletes =
        await Athlete.find({
            $or: [
                {
                    "personalInfo.fullName":
                        searchRegex,
                },
                {
                    registrationNo:
                        searchRegex,
                },
            ],
        })
        .select(
            [
                "_id",
                "registrationNo",
                "personalInfo.fullName",
                "personalInfo.gender",
                "personalInfo.dob",
            ].join(" ")
        )
        .sort({
            "personalInfo.fullName": 1,
        })
        .limit(20)
        .lean();

    return athletes;
};

export default searchAthletes;