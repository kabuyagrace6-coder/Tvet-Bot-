import express from "express";
import axios from "axios";
import puppeteer from "puppeteer";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));

// Twilio credentials from .env
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ✅ Basic route to check app is running
app.get("/", (req, res) => {
  res.send("TVET WhatsApp Bot is running ✅");
});

// ✅ WhatsApp Webhook (Twilio sends incoming messages here)
app.post("/whatsapp", async (req, res) => {
  const message = req.body.Body?.toLowerCase().trim();
  const from = req.body.From;

  console.log(`📩 Message from ${from}: ${message}`);

  // If user says "hi" or "hello"
  if (message === "hi" || message === "hello") {
    await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox number
      to: from,
      body: "👋 Hello! Send me a subject name (e.g. 'Electrical Engineering N3') and I’ll fetch the latest past paper for you."
    });
    return res.sendStatus(200);
  }

  // Otherwise, try to fetch a paper
  try {
    const searchUrl = `https://tvetpapers.co.za/?s=${encodeURIComponent(message)}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    const resultLink = await page.$eval(".entry-title a", a => a.href);
    await browser.close();

    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: from,
      body: `Here’s the latest ${message} paper 📘: ${resultLink}`
    });
  } catch (err) {
    console.error("Error:", err.message);
    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: from,
      body: "⚠️ Sorry, I couldn’t find that paper. Try another subject or N-level (e.g. 'Mathematics N2')."
    });
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
