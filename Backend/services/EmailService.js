import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendRegistrationEmail = async (
    athlete,
    pdfPath
) => {
const mailOptions = {
    from: process.env.EMAIL_USER,

    to: athlete.personalInfo.email,
subject: `Registration Successful - ${athlete.registrationNo}`,

    html: `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">

    <div style="background:#0d6efd; color:white; padding:20px; text-align:center;">
        <h1 style="margin:0;">Surat District Weightlifting Association</h1>
        <p style="margin:5px 0 0;">Athlete Registration Confirmation</p>
    </div>

    <div style="padding:30px;">

        <h2 style="color:#28a745;">
            Registration Successful 🎉
        </h2>

        <p>
            Dear <strong>${athlete.personalInfo.fullName}</strong>,
        </p>

        <p>
Your registration has been successfully received for the
<strong>Surat District Weightlifting Championship 2026–27</strong>.        </p>

        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Registration Number</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${athlete.registrationNo}</td>
            </tr>

            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Name</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${athlete.personalInfo.fullName}</td>
            </tr>

            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Gender</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${athlete.personalInfo.gender}</td>
            </tr>

            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Date of Birth</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${new Date(
                  athlete.personalInfo.dob
                ).toLocaleDateString()}</td>
            </tr>

            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Phone</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${athlete.personalInfo.phone}</td>
            </tr>

            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Email</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${athlete.personalInfo.email}</td>
            </tr>
        </table>

        <h3>Participations</h3>

        <ul>
            ${athlete.participations
              .map(
                (item) => `
                <li>
    <strong>${item.category}</strong>
</li>
            `
              )
              .join("")}
        </ul>

        <p>
            Your registration receipt is attached with this email as a PDF.
        </p>

        <p>
            Please keep your registration number safe for future reference.
        </p>

        <hr>

        <p style="font-size:14px; color:#666;">
            Thank you for registering with the
            <strong>Surat District Weightlifting Association</strong>.
        </p>

    </div>

    <div style="background:#f8f9fa; padding:15px; text-align:center; font-size:13px; color:#666;">
        © ${new Date().getFullYear()} Surat District Weightlifting Association
    </div>

</div>
`,

    attachments: [
        {
            filename: `${athlete.registrationNo}.pdf`,
            path: pdfPath,
        },
    ],
};
try {
    await transporter.verify();
    console.log("SMTP connection successful");

    const info = await transporter.sendMail(mailOptions);

    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);

    return info;
} catch (err) {
    console.error("Email Error:", err);
    throw err;
}
};

export default sendRegistrationEmail;