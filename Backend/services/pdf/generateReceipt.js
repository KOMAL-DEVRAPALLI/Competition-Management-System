import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import handlebars from "handlebars";



import receiptData from "./helpers/receiptData.js";

const generateReceipt = async (athlete, outputPath) => {
console.log("PDF saved:", outputPath);
console.log("Exists:", fsSync.existsSync(outputPath));
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
    waitUntil: "networkidle0"
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

    // Generate PDF
   await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
    }
});

    await browser.close();

};

export default generateReceipt;