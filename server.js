import express from "express";
import nodemailer from "nodemailer";
import { generateStructuredPDF } from "./utils/generatePdf.js";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const app = express();

app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Explicit OPTIONS handler (this is what fixes your error)
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

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

app.post("/extract", async (req, res) => {
  const { rawText } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const prompt = `
You are a data extraction engine.
From the following hotel voucher text, extract exactly these fields:

- Hotel Name
Contact:
  - Phone (include ANY phone numbers you find in the text, even if they appear under labels like "Agent Contact Number", "Service Operator Number", "Helpline Number", etc. Remove the labels; keep only the clean numbers.)
  - Email
- Hotel Confirmation
- Address
- Booking Date
- Guest Name(s)
- Child
- Adults
- Check in date
- Check out date
- Nights
- Rooms
- Room Category
- Inclusions

IMPORTANT:
- The 'Inclusions' field should include ONLY:
  - Meal-related items (e.g., 'Breakfast', 'Meal Plan - Breakfast', 'Half-board', 'All Meals')
  - Rate-related identifiers (e.g., 'Make My Trip - On Line Retail Rate - RB')
- Do **NOT** include:
  - Room amenities (e.g., TV, Wi-Fi, Slippers, Minibar, Towels, Safe, etc.)
  - Booking benefits (e.g., Free airport transfer, Spa sessions, Tours, etc.)
- Do not hallucinate or infer information not clearly mentioned.
- Extract data as accurately as possible, even if formatting is inconsistent.

Return the result as a JSON object with each field clearly labeled. Do not add extra fields. Only extract these exact fields.


PDF TEXT:
${rawText}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      },
    );

    const result = await response.json();
    const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("Empty response from Gemini.");

    const cleanedJson = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    res.json(JSON.parse(cleanedJson));
  } catch (err) {
    console.error("Gemini Backend Error:", err);
    res.status(500).json({ error: "Failed to extract structured data." });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
