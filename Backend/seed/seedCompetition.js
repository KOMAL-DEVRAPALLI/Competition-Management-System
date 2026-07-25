import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Competition from "../models/Competition.js"
import Counter from "../models/Counter.js";

dotenv.config({ path: "../.env" });

const seedDatabase = async () => {
    try {
        await connectDB();

        // Remove existing seed data (optional)
        await Competition.deleteMany({});
        await Counter.deleteMany({});

        // Create Competition
        await Competition.create({
            competitionName: "Surat District Weightlifting Championship",
            registrationPrefix: "SDWC2026",
            year: 2026,
            venue: "Surat",

            startDate: new Date("2026-08-20"),
            endDate: new Date("2026-08-22"),

            registrationStart: new Date("2026-07-01"),
            registrationEnd: new Date("2026-08-15"),

            instructions: [
                "Carry original Aadhaar Card.",
                "Bring your club identity card.",
                "Reporting time is 8:00 AM."
            ],

            eligibilityRules: {
                youth: {
                    minBirthYear: 2009,
                    maxBirthYear: 2013
                },
                junior: {
                    minBirthYear: 2006,
                    maxBirthYear: 2011
                },
                senior: {
                    maxBirthYear: 2011
                }
            },

            weightCategories: [
                {
                    gender: "Male",
                    category: "Youth",
                    weights: [
                        "50kg",
                        "60kg",
                        "65kg",
                        "70kg",
                        "75kg",
                        "85kg",
                        "95kg",
                        "+95kg",
                    ]
                },
                 {
                    gender: "Male",
                    category: "Junior",
                    weights: [
                        "60kg",
                        "65kg",
                        "70kg",
                        "75kg",
                        "85kg",
                        "95kg",
                        "110kg",
                        "+110kg"
                    ]
                },
                  {
                    gender: "Male",
                    category: "Senior",
                    weights: [
                        "60kg",
                        "65kg",
                        "70kg",
                        "75kg",
                        "85kg",
                        "95kg",
                        "110kg",
                        "+110kg"
                    ]
                },
                {
                    gender: "Female",
                    category: "Youth",
                    weights: [
                        "45kg",
                        "49kg",
                        "53kg",
                        "57kg",
                        "61kg",
                        "69kg",
                        "77kg",
                        "+77kg",
                    ]
                },
                {
                    gender: "Female",
                    category: "Junior",
                    weights: [
                        "49kg",
                        "53kg",
                        "57kg",
                        "61kg",
                        "69kg",
                        "86kg",
                        "+86kg",
                    ]
                },
                {
                    gender: "Female",
                    category: "Senior",
                    weights: [
                        "49kg",
                        "53kg",
                        "57kg",
                        "61kg",
                        "69kg",
                        "86kg",
                        "+86kg",
                    ]
                },
            ],

            status: "Registration Open"
        });

        // Create Counter
        await Counter.create({
            _id: "registration",
            sequence: 0
        });

        console.log("✅ Database seeded successfully.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedDatabase();