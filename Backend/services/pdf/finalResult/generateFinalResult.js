import puppeteer from "puppeteer";

import {
    finalResultTemplate,
} from "./finalResultTemplate.js";


// =====================================
// GENERATE FINAL RESULT PDF
// =====================================

const generateFinalResult = async (
    competition,
    resultRows,
    gender,
    ageCategory
) => {

    let browser;


    try {

        const launchOptions = {

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],

        };


        if (
            process.env
                .PUPPETEER_EXECUTABLE_PATH
        ) {

            launchOptions.executablePath =
                process.env
                    .PUPPETEER_EXECUTABLE_PATH;

        }


        browser =
            await puppeteer.launch(
                launchOptions
            );


        const page =
            await browser.newPage();


        const html =
            finalResultTemplate(
                competition,
                resultRows,
                gender,
                ageCategory
            );


        await page.setContent(
    html,
    {
        waitUntil:
            "domcontentloaded",
    }
);


        return await page.pdf({

            format:
                "A4",

            printBackground:
                true,

            margin: {

                top:
                    "10mm",

                right:
                    "10mm",

                bottom:
                    "10mm",

                left:
                    "10mm",

            },

        });

    } finally {

        if (browser) {

            await browser.close();

        }

    }

};


export default generateFinalResult;