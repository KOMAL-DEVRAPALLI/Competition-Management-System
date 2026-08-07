import Athlete from "../../models/Athlete.js";
import generateRegistrationNumber from "./RegistrationNumberService.js";
import calculateEligibility from "../eligibility/EligibilityService.js";
import cloudinary from "../../config/cloudinary.js";
import generateRegistrationPDF from "../pdfService/PdfService.js";
import sendRegistrationEmail from "../email/EmailService.js";
import fs from "fs-extra";
import nodeFs from "fs";
import path from "path";


const registerAthlete = async (athleteData, files) => {
    // Transform request data
    const personalInfo = {
        fullName: athleteData.fullName,
        gender: athleteData.gender,
        dob: athleteData.dob,
        age: athleteData.age,
        phone: athleteData.phone,
        email: athleteData.email,
        address: athleteData.address,
    };
 const { eligibleCategories, competition } =
            await calculateEligibility(personalInfo.dob);
   const competitionInfo = {
    club: athleteData.club,
    coach: athleteData.coach,
    coachPhone: athleteData.coachPhone,

    competitionName: competition.competitionName,
    venue: competition.venue,
    startDate: competition.startDate,
    endDate: competition.endDate,
};

    const participations = athleteData.participations;

    // Multer temporary files
    const passportPhoto = files.passportPhoto[0];

const abs = path.resolve(passportPhoto.path);


    const localPassportPhotoPath = passportPhoto.path;
    const aadharCard = files.aadharCard[0];
    const birthCertificate = files.birthCertificate[0];
    const iwlfCard = files.iwlfCard?.[0];
    let pdfPath = null;
 let passportPhotoUpload;
let aadharCardUpload;
let birthCertificateUpload;
let iwlfCardUpload;
    try {
        // ==========================
        // Eligibility Validation
        // ==========================

       

        for (const participation of participations) {
            if (!eligibleCategories.includes(participation.category)) {
                throw new Error(
                    `Athlete is not eligible for ${participation.category}.`
                );
            }

           /*  const weightRule = competition.weightCategories.find(
                (item) =>
                    item.gender === gender &&
                    item.category === participation.category
            );

            if (!weightRule) {
                throw new Error(
                    `Weight categories not found for ${gender} ${participation.category}.`
                );
            }

            if (!weightRule.weights.includes(participation.weightCategory)) {
                throw new Error(
                    `Invalid weight category "${participation.weightCategory}" for ${participation.category}.`
                );
            } */
        }

        // ==========================
        // Upload Documents (Parallel)
// ==========================

 passportPhotoUpload = await cloudinary.uploader.upload(
    passportPhoto.path,
    {
        folder: "competition-management-system/passport-photos",
        resource_type: "image",
    }
);
 aadharCardUpload = await cloudinary.uploader.upload(
    aadharCard.path,
    {
        folder: "competition-management-system/aadhar-cards",
    }
);
birthCertificateUpload = await cloudinary.uploader.upload(
    birthCertificate.path,
    {
        folder: "competition-management-system/birth-certificates",
    }
);
 iwlfCardUpload = null;

if (iwlfCard) {

    iwlfCardUpload = await cloudinary.uploader.upload(
        iwlfCard.path,
        {
            folder: "competition-management-system/iwlf-cards",
        }
    );

}

        
        // ==========================
        // Registration Number
        // ==========================

        const {
            registrationNumber,
            competition: activeCompetition,
        } = await generateRegistrationNumber();

        // ==========================
        // Save Athlete
        // ==========================

        const athlete = new Athlete({
            competition: activeCompetition._id,
            registrationNo: registrationNumber,

            personalInfo,
            competitionInfo,
            participations,

        documents: {
    passportPhoto: {
        url: passportPhotoUpload.secure_url,
        publicId: passportPhotoUpload.public_id,
    },

    aadhaar: {
        url: aadharCardUpload.secure_url,
        publicId: aadharCardUpload.public_id,
    },

    birthCertificate: {
        url: birthCertificateUpload.secure_url,
        publicId: birthCertificateUpload.public_id,
    },

    iwlfCard: iwlfCardUpload
        ? {
              url: iwlfCardUpload.secure_url,
              publicId: iwlfCardUpload.public_id,
          }
        : {
              url: null,
              publicId: null,
          },
},

            verification: {
                status: "Pending",
                verifiedBy: null,
                verifiedAt: null,
                rejectionReason: null,
            },
        });

       await athlete.save();
athlete.localPassportPhotoPath = localPassportPhotoPath;

pdfPath = await generateRegistrationPDF(athlete);

// NOW remove temporary files
await Promise.allSettled([
    fs.remove(passportPhoto.path),
    fs.remove(aadharCard.path),
    fs.remove(birthCertificate.path),
    iwlfCard?.path && fs.remove(iwlfCard.path),
]);

        // ==========================
        // Send Email
        // ==========================

        try {
            await sendRegistrationEmail(athlete, pdfPath);
        } catch (error) {
            console.error(
                "Failed to send registration email:",
                error.message
            );
        } finally {
            if (pdfPath) {
                await fs.remove(pdfPath);
            }
        }

        return athlete;
    } catch (error) {
       
        if (passportPhotoUpload) {
    await cloudinary.uploader.destroy(passportPhotoUpload.public_id);
}

if (aadharCardUpload) {
    await cloudinary.uploader.destroy(aadharCardUpload.public_id);
}

if (birthCertificateUpload) {
    await cloudinary.uploader.destroy(birthCertificateUpload.public_id);
}

if (iwlfCardUpload) {
    await cloudinary.uploader.destroy(iwlfCardUpload.public_id);
}
        // Cleanup Multer temp files if they still exist
        await Promise.allSettled([
            passportPhoto?.path && fs.remove(passportPhoto.path),
            aadharCard?.path && fs.remove(aadharCard.path),
            birthCertificate?.path && fs.remove(birthCertificate.path),
            pdfPath && fs.remove(pdfPath),
            iwlfCard?.path && fs.remove(iwlfCard.path),
        ]);
       
        throw error;
    }
};

export default registerAthlete;