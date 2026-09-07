import mongoose from "mongoose";

import Athlete from "../../models/Athlete.js";
import Competition from "../../models/Competition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";


const prepareCompetition = async (competitionId) => {

    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (
        !competitionId ||
        !mongoose.Types.ObjectId.isValid(competitionId)
    ) {

        const error =
            new Error("Valid competition ID is required.");

        error.statusCode = 400;

        throw error;
    }


    const competitionObjectId =
        new mongoose.Types.ObjectId(competitionId);


    // =====================================
    // LOAD COMPETITION
    // =====================================

    const competition =
        await Competition.findById(
            competitionObjectId
        ).lean();


    if (!competition) {

        const error =
            new Error("Competition not found.");

        error.statusCode = 404;

        throw error;
    }


    // =====================================
    // FIND ALL ATHLETES FOR COMPETITION
    // =====================================

    const athletes =
        await Athlete.find({
            competition: competitionObjectId,
        }).lean();


    console.log(
        "===== PREPARE COMPETITION ====="
    );

    console.log(
        "Competition:",
        competition.competitionName
    );

    console.log(
        "Competition ID:",
        competitionId
    );

    console.log(
        "Athletes found:",
        athletes.length
    );


    // =====================================
    // COUNTERS
    // =====================================

    let created = 0;
    let skipped = 0;
    let ambiguous = 0;
    let notEligible = 0;
    let invalidDob = 0;


    const ambiguousAthletes = [];
    const notEligibleAthletes = [];
    const invalidDobAthletes = [];
    const createdAthletes = [];
    const skippedAthletes = [];


    // =====================================
    // PROCESS EACH ATHLETE
    // =====================================

    for (const athlete of athletes) {

        const athleteName =
            athlete.personalInfo?.fullName ||
            "Unknown Athlete";


        // =====================================
        // CHECK EXISTING ENTRY
        // =====================================

        const existingEntry =
            await CompetitionEntry.findOne({

                competitionId:
                    competitionObjectId,

                athleteId:
                    athlete._id,

            }).lean();


        if (existingEntry) {

            skipped++;

            skippedAthletes.push({
                athleteId: athlete._id,
                name: athleteName,
            });

            continue;
        }


        // =====================================
        // READ DOB
        // =====================================

        const dob =
            athlete.personalInfo?.dob;


        if (!dob) {

            invalidDob++;

            invalidDobAthletes.push({
                athleteId: athlete._id,
                name: athleteName,
                reason: "Date of birth is missing.",
            });

            continue;
        }


        const dateOfBirth =
            new Date(dob);


        if (
            Number.isNaN(
                dateOfBirth.getTime()
            )
        ) {

            invalidDob++;

            invalidDobAthletes.push({
                athleteId: athlete._id,
                name: athleteName,
                reason: "Invalid date of birth.",
            });

            continue;
        }


        // =====================================
        // GET ELIGIBILITY RULES
        // =====================================

        const eligibilityRules =
            competition.eligibilityRules ?? {};


        // =====================================
        // FIND ALL ELIGIBLE AGE CATEGORIES
        // =====================================

        const eligibleCategories = [];


        for (
            const [
                categoryKey,
                categoryRule
            ]
            of Object.entries(
                eligibilityRules
            )
        ) {

            if (!categoryRule) {
                continue;
            }


            const category =
                String(categoryKey)
                    .trim()
                    .toUpperCase();


            const minimumBirthYear =
                categoryRule.minBirthYear;


            const maximumBirthYear =
                categoryRule.maxBirthYear;


            const birthYear =
                dateOfBirth.getFullYear();


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
                meetsMinimum &&
                meetsMaximum
            ) {

                eligibleCategories.push(
                    category
                );

            }

        }


        // =====================================
        // NO ELIGIBLE CATEGORY
        // =====================================

        if (
            eligibleCategories.length === 0
        ) {

            notEligible++;

            notEligibleAthletes.push({

                athleteId:
                    athlete._id,

                name:
                    athleteName,

                dob:
                    dateOfBirth,

                reason:
                    "Athlete is not eligible for any configured age category.",

            });

            continue;
        }


        // =====================================
        // MORE THAN ONE CATEGORY
        //
        // DO NOT GUESS.
        // =====================================

        if (
            eligibleCategories.length > 1
        ) {

            ambiguous++;

            ambiguousAthletes.push({

                athleteId:
                    athlete._id,

                name:
                    athleteName,

                dob:
                    dateOfBirth,

                eligibleCategories,

                reason:
                    "Athlete is eligible for multiple age categories; original selection cannot be safely inferred.",

            });

            continue;
        }


        // =====================================
        // EXACTLY ONE CATEGORY
        // =====================================

        const ageCategory =
            eligibleCategories[0];


        // =====================================
        // CREATE COMPETITION ENTRY
        // =====================================

        try {

            const entry =
                await CompetitionEntry.create({

                    competitionId:
                        competitionObjectId,

                    athleteId:
                        athlete._id,

                    competitionCategory: {

                        ageCategory,

                    },

                    status:
                        "READY",

                });


            created++;


            createdAthletes.push({

                athleteId:
                    athlete._id,

                name:
                    athleteName,

                ageCategory,

                entryId:
                    entry._id,

            });


        } catch (error) {

            // =====================================
            // DUPLICATE RACE-SAFE HANDLING
            // =====================================

            if (
                error?.code === 11000
            ) {

                skipped++;

                skippedAthletes.push({

                    athleteId:
                        athlete._id,

                    name:
                        athleteName,

                    reason:
                        "CompetitionEntry already exists.",

                });

                continue;
            }


            throw error;

        }

    }


    // =====================================
    // FINAL DEBUG SUMMARY
    // =====================================

    console.log(
        "===== PREPARE COMPETITION RESULT ====="
    );

    console.log({

        competitionId,

        athletesFound:
            athletes.length,

        created,

        skipped,

        ambiguous,

        notEligible,

        invalidDob,

    });


    // =====================================
    // SHOW CREATED ATHLETES
    // =====================================

    if (
        createdAthletes.length > 0
    ) {

        console.log(
            "===== CREATED ENTRIES ====="
        );

        for (
            const athlete
            of createdAthletes
        ) {

            console.log({

                name:
                    athlete.name,

                ageCategory:
                    athlete.ageCategory,

                entryId:
                    athlete.entryId,

            });

        }

    }


    // =====================================
    // SHOW AMBIGUOUS ATHLETES
    // =====================================

    if (
        ambiguousAthletes.length > 0
    ) {

        console.log(
            "===== AMBIGUOUS ATHLETES ====="
        );

        for (
            const athlete
            of ambiguousAthletes
        ) {

            console.log({

                name:
                    athlete.name,

                dob:
                    athlete.dob,

                eligibleCategories:
                    athlete.eligibleCategories,

            });

        }

    }


    // =====================================
    // SHOW INVALID / NOT ELIGIBLE
    // =====================================

    if (
        invalidDobAthletes.length > 0
    ) {

        console.log(
            "===== INVALID DOB ATHLETES ====="
        );

        console.log(
            invalidDobAthletes
        );

    }


    if (
        notEligibleAthletes.length > 0
    ) {

        console.log(
            "===== NOT ELIGIBLE ATHLETES ====="
        );

        console.log(
            notEligibleAthletes
        );

    }


    // =====================================
    // RETURN
    // =====================================

    return {

        competitionId,

        created,

        skipped,

        ambiguous,

        notEligible,

        invalidDob,

        total:
            athletes.length,

        ambiguousAthletes,

        notEligibleAthletes,

        invalidDobAthletes,

    };

};


export default prepareCompetition;