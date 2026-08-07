import fs from "fs";
import path from "path";

const receiptData = (athlete) => {

    const formatDate = (date) =>
        new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(new Date(date));

    const logoPath = path.resolve("services/pdf/assets/new-logo.png");

    const logoBase64 = fs.readFileSync(
        logoPath,
        "base64"
    );
    return {

    logo: `data:image/png;base64,${logoBase64}`,

    photo: athlete.documents?.passportPhoto?.url || "",

    registrationNo: athlete.registrationNo,

    registrationDate: formatDate(athlete.createdAt),

    competitionName: athlete.competitionInfo.competitionName,

    venue: athlete.competitionInfo.venue,

    competitionDates: "01-02 August 2026",

    fullName: athlete.personalInfo.fullName,

    gender: athlete.personalInfo.gender,

    dob: formatDate(athlete.personalInfo.dob),

    mobile: athlete.personalInfo.phone,

    email: athlete.personalInfo.email,

    participations: athlete.participations.map((item) => ({
        category: item.category,
    })),

    registrationFee: athlete.participations.length * 100,

    requiredPhotos: athlete.participations.length + 1,

    generatedDate: new Date().toLocaleDateString()

};
}
export default receiptData;