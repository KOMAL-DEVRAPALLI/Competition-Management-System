import fs from "fs";
import path from "path";

import generateReceipt from "./pdf/generateReceipt.js";

const generateRegistrationReceipt = async (athlete) => {

    const receiptsDir = path.join(process.cwd(), "receipts");

    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const fileName = `${athlete.registrationNo}.pdf`;

    const filePath = path.join(receiptsDir, fileName);

    await generateReceipt(athlete, filePath);

    return filePath;
};

export default generateRegistrationReceipt;