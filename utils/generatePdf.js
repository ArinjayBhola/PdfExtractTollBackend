import PdfPrinter from "pdfmake";

import logoBase64 from "./icons/logoBase64.js";
import { instagramIconBase64 } from "./icons/IconBase64.js";
import { globeIconBase64 } from "./icons/IconBase64.js";
import { emailIconBase64 } from "./icons/IconBase64.js";
import { phoneIconBase64 } from "./icons/IconBase64.js";
import { locationIconBase64 } from "./icons/IconBase64.js";

const printer = new PdfPrinter({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
  },
});

function makeField(label, value) {
  return {
    text: [
      { text: `${label}: `, style: "fieldKey" },
      { text: value || "N/A", style: "fieldValue" },
    ],
    margin: [5, 10, 0, 10],
  };
}

function formatList(val) {
  if (!val) return "N/A";
  if (Array.isArray(val)) return val.map((v) => `• ${v}`).join("\n");
  if (typeof val === "object") {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }
  return val;
}

export function generateStructuredPDF(data) {
  const currentDate = () => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}/${today.getFullYear()}`;
  };

  const docDefinition = {
    content: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 595,
            h: 40,
            color: "#D32F2F",
          },
        ],
        absolutePosition: { x: 0, y: 0 },
        margin: [0, 0, 0, 45],
      },

      {
        columns: [
          {
            width: "60%",
            stack: [
              {
                image: logoBase64,
                width: 180,
                margin: [0, 6, 0, 0],
              },
              {
                text: "Nimbus Tours and Travels Pvt. Ltd.",
                margin: [90, 5, 0, 0],
                fontSize: 12,
                bold: true,
              },
            ],
          },
          {
            width: "40%",
            canvas: [
              {
                type: "polyline",
                points: [
                  { x: 0, y: 0 },
                  { x: 280, y: 0 },
                  { x: 280, y: 45 },
                  { x: 60, y: 45 },
                ],
                closePath: true,
                color: "#00332e",
              },
            ],
            height: 45,
            margin: [0, 0, 0, 0],
          },
        ],
        margin: [0, 0, 0, 10],
      },

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
      {
        text: "Voucher",
        style: "title",
        alignment: "center",
        margin: [0, 12, 0, 12],
      },

      {
        columns: [
          {
            width: "50%",
            stack: [
              makeField("Hotel", data.structuredData["Hotel Name"]),
              makeField("Address", data.structuredData["Address"]),
              makeField(
                "Contact",
                (() => {
                  const phone = Array.isArray(data.structuredData["Contact"]?.Phone)
                    ? data.structuredData["Contact"].Phone.join(", ")
                    : data.structuredData["Contact"]?.Phone || "+91-9836466860";
                  const email = data.structuredData["Contact"]?.Email;
                  return email ? `${phone} | ${email}` : phone;
                })(),
              ),
            ],
          },
          {
            width: "50%",
            stack: [
              makeField("Booking Date", data.structuredData["Booking Date"] || currentDate()),
              makeField("Hotel Confirmation", data.structuredData["Hotel Confirmation"]),
            ],
          },
        ],
        margin: [0, 10, 0, 10],
      },

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
      makeField("Guest Name", data.structuredData["Guest Name"] || data.structuredData["Guest Name(s)"]),
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 10, 0, 10] },

      {
        columns: [
          {
            width: "50%",
            stack: [
              makeField("Adults", data.structuredData["Adults"]),
              makeField("Rooms", data.structuredData["Rooms"]),
              makeField("Check in", data.structuredData["Check in date"] || data.structuredData["Check in"]),
            ],
          },
          {
            width: "50%",
            stack: [
              makeField("Child", data.structuredData["Child"]),
              makeField(
                "Nights",
                (() => {
                  const d = data.structuredData;
                  const nightsProvided = d["Nights"];
                  if (nightsProvided) return nightsProvided;

                  const checkInRaw = d["Check in date"] || d["Check in"];
                  const checkOutRaw = d["Check out date"] || d["Check out"];

                  const checkIn = new Date(checkInRaw);
                  const checkOut = new Date(checkOutRaw);

                  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return "N/A";

                  const diffTime = checkOut - checkIn;
                  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return nights > 0 ? nights : "N/A";
                })(),
              ),

              makeField("Check out", data.structuredData["Check out date"] || data.structuredData["Check in"]),
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },

      makeField("Room Category", data.structuredData["Room Category"]),
      makeField("Inclusions", formatList(data.structuredData["Inclusions"])),

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 10, 0, 10] },

      { text: "Terms and Conditions:", style: "termsHeader" },
      {
        ul: [
          "Standard Check in time is 14:00 and Standard Check out time is 12:00.",
          "Government ID is mandatory at the time of Check in.",
          "City Tax/Resort fees to be paid directly at the hotel if applicable.",
          "If a late check-in is planned, contact the property directly for their late check-in policy.",
        ],
        style: "termsList",
        margin: [0, 4, 0, 30],
      },

      {
        columns: [
          {
            width: "33%",
            stack: [
              {
                columns: [
                  {
                    image: instagramIconBase64,
                    width: 14,
                    margin: [0, 0, 6, 0],
                    alignment: "middle",
                  },
                  {
                    text: "@nimbustours.travels",
                    fontSize: 10,
                    bold: true,
                    alignment: "left",
                    margin: [10, 0, 0, 0],
                  },
                ],
                margin: [0, 0, 0, 5],
              },
              {
                columns: [
                  {
                    image: globeIconBase64,
                    width: 14,
                    margin: [0, 0, 6, 0],
                    alignment: "middle",
                  },
                  {
                    text: "nimbustours.in",
                    fontSize: 10,
                    bold: true,
                    alignment: "left",
                    margin: [10, 0, 0, 0],
                  },
                ],
                margin: [0, 0, 0, 5],
              },
            ],
          },
          {
            width: "33%",
            stack: [
              {
                columns: [
                  {
                    image: emailIconBase64,
                    width: 14,
                    margin: [0, 0, 6, 0],
                    alignment: "middle",
                  },
                  {
                    text: "hotels@nimbustours.in",
                    fontSize: 10,
                    bold: true,
                    alignment: "left",
                    margin: [10, 0, 0, 0],
                  },
                ],
                margin: [0, 0, 0, 5],
              },
              {
                columns: [
                  {
                    image: phoneIconBase64,
                    width: 14,
                    margin: [0, 0, 6, 0],
                    alignment: "middle",
                  },
                  {
                    text: "+91-9836466860",
                    fontSize: 10,
                    bold: true,
                    alignment: "left",
                    margin: [10, 0, 0, 0],
                  },
                ],
                margin: [0, 0, 0, 5],
              },
            ],
          },
          {
            width: "33%",
            stack: [
              {
                columns: [
                  {
                    image: locationIconBase64,
                    width: 14,
                    margin: [0, 0, 6, 0],
                    alignment: "middle",
                  },
                  {
                    stack: [
                      { text: "1st Floor, 8/1 Loudon Street,", fontSize: 10, bold: true },
                      { text: "Kolkata - 700017, India", fontSize: 10, bold: true },
                    ],
                    alignment: "left",
                    margin: [10, 0, 0, 0],
                  },
                ],
                margin: [0, 0, 0, 5],
              },
            ],
          },
        ],
        style: "footer",
        margin: [0, 20, 0, 10],
      },
    ],

    styles: {
      title: {
        fontSize: 20,
        bold: true,
      },
      fieldKey: {
        bold: true,
        fontSize: 14,
      },
      fieldValue: {
        fontSize: 12,
      },
      termsHeader: {
        bold: true,
        fontSize: 13,
        margin: [0, 10, 0, 5],
      },
      termsList: {
        fontSize: 11,
      },
      footer: {
        fontSize: 10,
        alignment: "center",
        color: "#555",
      },
    },

    defaultStyle: {
      font: "Helvetica",
      fontSize: 10,
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}
