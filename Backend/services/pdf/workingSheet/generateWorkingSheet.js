import puppeteer from "puppeteer";
import { workingSheetTemplate } from "./workingSheetTemplate.js";

export const generateWorkingSheet = async (
    competition,
    workingSheetData,
    gender
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

        /*
         * Optional browser executable.
         *
         * If PUPPETEER_EXECUTABLE_PATH is configured,
         * Puppeteer will use it.
         *
         * Otherwise Puppeteer uses its bundled browser.
         *
         * This allows:
         *
         * Local Windows:
         * PUPPETEER_EXECUTABLE_PATH can point to
         * Chrome/Edge if required.
         *
         * Render/Linux:
         * Leave it unset and use Puppeteer's
         * installed browser.
         */
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {

            launchOptions.executablePath =
                process.env.PUPPETEER_EXECUTABLE_PATH;

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
                gender
            );

        await page.setContent(
            html,
            {
                waitUntil: "networkidle0",
            }
        );

        const pdf =
            await page.pdf({

                format: "A4",

                printBackground: true,

                margin: {
                    top: "10mm",
                    right: "10mm",
                    bottom: "10mm",
                    left: "10mm",
                },

            });

        return pdf;

    } finally {

        if (browser) {

            await browser.close();

        }

    }

};