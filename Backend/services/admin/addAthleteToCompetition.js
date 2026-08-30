import mongoose from "mongoose";

import Athlete from "../../models/Athlete.js";
import Competition from "../../models/Competition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";


// =====================================
// ADD ATHLETE TO COMPETITION
//
// School Games admin-entry workflow.
//
// Athlete information:
// - Full Name
// - Mobile Number
// - Date of Birth
// - School Name
// - Gender
//
// Competition-specific information:
// - U17 / U19
//
// IMPORTANT:
// U17/U19 belongs to CompetitionEntry,
// NOT the Athlete master information.
//
// Only the SELECTED age category is
// created.
// =====================================

const addAthleteToCompetition = async ({
    competitionId,
    fullName,
    phone,
    dob,
    schoolName,
    gender,
    ageCategory,
}) => {

    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (
        !competitionId ||
        !mongoose.Types.ObjectId.isValid(
            competitionId
        )
    ) {

        const error =
            new Error(
                "Valid competition ID is required."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // NORMALIZE INPUT
    // =====================================

    const normalizedName =
        String(fullName ?? "").trim();

    const normalizedPhone =
        String(phone ?? "").trim();

    const normalizedDob =
        String(dob ?? "").trim();

    const normalizedSchoolName =
        String(schoolName ?? "").trim();

    const normalizedGender =
        String(gender ?? "").trim();

    const normalizedAgeCategory =
        String(ageCategory ?? "")
            .trim()
            .toUpperCase();


    // =====================================
    // VALIDATE FULL NAME
    // =====================================

    if (!normalizedName) {

        const error =
            new Error(
                "Athlete full name is required."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // VALIDATE PHONE
    // =====================================

    if (!normalizedPhone) {

        const error =
            new Error(
                "Mobile number is required."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // VALIDATE GENDER
    // =====================================

    if (
        ![
            "Male",
            "Female",
        ].includes(
            normalizedGender
        )
    ) {

        const error =
            new Error(
                "Gender must be Male or Female."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // VALIDATE DOB
    // =====================================

    if (!normalizedDob) {

        const error =
            new Error(
                "Date of birth is required."
            );

        error.statusCode = 400;

        throw error;
    }


    const dateOfBirth =
        new Date(normalizedDob);


    if (
        Number.isNaN(
            dateOfBirth.getTime()
        )
    ) {

        const error =
            new Error(
                "Invalid date of birth."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // VALIDATE SCHOOL NAME
    // =====================================

    if (!normalizedSchoolName) {

        const error =
            new Error(
                "School name is required."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // VALIDATE AGE CATEGORY
    // =====================================

    if (
        ![
            "U17",
            "U19",
        ].includes(
            normalizedAgeCategory
        )
    ) {

        const error =
            new Error(
                "Age category must be U17 or U19."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // LOAD COMPETITION
    // =====================================

    const competition =
        await Competition.findById(
            competitionId
        );


    if (!competition) {

        const error =
            new Error(
                "Competition not found."
            );

        error.statusCode = 404;

        throw error;
    }


    // =====================================
    // DETERMINE SELECTED CATEGORY
    // ELIGIBILITY
    //
    // The administrator chooses U17/U19.
    //
    // We still validate that the athlete's
    // DOB is actually eligible for the
    // selected category.
    // =====================================

    const birthYear =
        dateOfBirth.getFullYear();

    const eligibilityRules =
        competition.eligibilityRules ?? {};

    const selectedCategoryRule =
        eligibilityRules[
            normalizedAgeCategory.toLowerCase()
        ];


    if (!selectedCategoryRule) {

        const error =
            new Error(
                `${normalizedAgeCategory} is not configured for this competition.`
            );

        error.statusCode = 400;

        throw error;
    }


    const minimumBirthYear =
        selectedCategoryRule.minBirthYear;


    const maximumBirthYear =
        selectedCategoryRule.maxBirthYear;


    const meetsMinimum =
        minimumBirthYear == null ||
        birthYear >=
            Number(
                minimumBirthYear
            );


    const meetsMaximum =
        maximumBirthYear == null ||
        birthYear <=
            Number(
                maximumBirthYear
            );


    if (
        !meetsMinimum ||
        !meetsMaximum
    ) {

        const error =
            new Error(
                `Athlete is not eligible for ${normalizedAgeCategory}.`
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // PREVENT DUPLICATE ATHLETE
    //
    // An athlete with the same identifying
    // information cannot be added twice to
    // the same competition.
    // =====================================

    const existingAthlete =
        await Athlete.findOne({

            competition:
                competitionId,

            "personalInfo.fullName":
                normalizedName,

            "personalInfo.gender":
                normalizedGender,

            "personalInfo.dob":
                dateOfBirth,

        });


    if (existingAthlete) {

        const error =
            new Error(
                "This athlete is already added to this competition."
            );

        error.statusCode = 409;

        throw error;
    }


    // =====================================
    // CREATE ADMIN ATHLETE
    // =====================================

    const athlete =
        await Athlete.create({

            source:
                "ADMIN",

            competition:
                competitionId,

            personalInfo: {

                fullName:
                    normalizedName,

                gender:
                    normalizedGender,

                dob:
                    dateOfBirth,

                phone:
                    normalizedPhone,

            },

            competitionInfo: {

                schoolName:
                    normalizedSchoolName,

                competitionName:
                    competition.competitionName,

                venue:
                    competition.venue,

                startDate:
                    competition.startDate,

                endDate:
                    competition.endDate,

            },

            participations: [],

            documents: undefined,

            verification: {

                status:
                    "Verified",

                verifiedBy:
                    null,

                verifiedAt:
                    null,

                rejectionReason:
                    null,

            },

        });


    // =====================================
    // CREATE ONE COMPETITION ENTRY
    //
    // IMPORTANT:
    //
    // We DO NOT create both U17 and U19.
    //
    // Only the category selected by the
    // official is stored.
    // =====================================

    const competitionEntry =
        await CompetitionEntry.create({

            competitionId,

            athleteId:
                athlete._id,

            competitionCategory: {

                ageCategory:
                    normalizedAgeCategory,

            },

            status:
                "READY",

        });


    // =====================================
    // RETURN
    // =====================================

    return {

        athlete,

        competitionEntry,

        ageCategory:
            normalizedAgeCategory,

    };

};


export default addAthleteToCompetition;