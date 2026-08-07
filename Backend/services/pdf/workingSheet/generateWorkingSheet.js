

import puppeteer from "puppeteer";
import { workingSheetTemplate } from "./WorkingSheetTemplate.js";

export const generateWorkingSheet = async (
    competition,
    workingSheetData,
    gender
) => {
    
    const browser = await puppeteer.launch({

        headless: true,

        executablePath:
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",

        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],

    });

    try {

        const page = await browser.newPage();

        const html = workingSheetTemplate(
            competition,
            workingSheetData,
            gender
        );

        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        const pdf = await page.pdf({

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

        await browser.close();

    }

};