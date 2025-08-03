import express from "express";
import nodemailer from "nodemailer";
import { generateStructuredPDF } from "./utils/generatePdf.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.post("/send-pdf", async (req, res) => {
  try {
    const data = req.body;

    const pdfBuffer = await generateStructuredPDF(data);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: data.email,
      subject: `Your Hotel Voucher – ${data.structuredData["Hotel Name"]} | ${
        data.structuredData["Check in date"] || data.structuredData["Check in"]
      }`,
      text: `Dear Sir/Madam,
Greetings from Nimbus Tours & Travels!

Please find the attached voucher with all the necessary details for your check-in.

Kindly present this voucher at the time of check-in. 

Should you require any assistance during your trip, feel free to contact our support team.

We wish you a pleasant and memorable stay!

Regards,
Team Nimbus Tours & Travels
+91-9836466860

This is an automated email and the inbox is not monitored. Kindly do not reply to this email.`,
      attachments: [
        {
          filename: `${data.structuredData["Hotel Name"]}_voucher.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true, message: "Email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send email." });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
