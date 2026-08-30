import puppeteer from "puppeteer";

import {
    workingSheetTemplate,
} from "./workingSheetTemplate.js";


export const generateWorkingSheet =
    async (
        competition,
        workingSheetData,
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
                workingSheetTemplate(
                    competition,
                    workingSheetData,
                    gender,
                    ageCategory
                );


            await page.setContent(
                html,
                {
                    waitUntil:
                        "networkidle0",
                }
            );


            return await page.pdf({

                format: "A4",

                printBackground: true,

                margin: {
                    top: "10mm",
                    right: "10mm",
                    bottom: "10mm",
                    left: "10mm",
                },

            });

        } finally {

            if (browser) {

                await browser.close();

            }

        }

    };