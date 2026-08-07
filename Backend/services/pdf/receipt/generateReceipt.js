import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import fsSync from "fs";


import receiptData from "../helpers/receiptData.js";

const generateReceipt = async (athlete, outputPath) => {

    // Prepare template data
    const data = receiptData(athlete);

    // Read Handlebars template
    const templatePath = path.resolve(
        "services/pdf/templates/receipt.hbs"
    );

    const templateSource = await fs.readFile(templatePath, "utf-8");

    // Compile template
    const template = handlebars.compile(templateSource);

    const html = template(data);

   const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
    ]
});
    const page = await browser.newPage();

await page.setContent(html, {
    waitUntil: "domcontentloaded"
});

await page.waitForSelector(".receipt");

await page.evaluate(async () => {
    const images = Array.from(document.images);

    await Promise.all(
        images.map((img) => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        })
    );
});
try{
      await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
    },
});


if (fsSync.existsSync(outputPath)) {
    console.log("Size:", fsSync.statSync(outputPath).size);
}

    await browser.close();
}
 catch(err){console.log("error",err);
    throw err
 }

};

export default generateReceipt;