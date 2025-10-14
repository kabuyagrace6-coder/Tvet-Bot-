import express from "express";
import bodyParser from "body-parser";
import { Twilio } from "twilio";
import puppeteer from "puppeteer";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio credentials (from your Twilio Console)
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body.trim().toLowerCase();

  console.log("Received message:", body);

  if (body.includes("past paper")) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://www.tvetpapers.co.za", { waitUntil: "domcontentloaded" });

    const links = await page.$$eval("a", (a) =>
      a.map((el) => el.href).filter((href) => href.endsWith(".pdf"))
    );
    await browser.close();

    const message = links.length
      ? `📄 Found some papers:\n${links.slice(0, 5).join("\n")}`
      : "Sorry, couldn’t find any papers right now.";

    await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox number
      to: from,
      body: message,
    });
  } else {
    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: from,
      body: "👋 Hi! Send me a message like: 'Past Paper N1 Maths' to get exam papers.",
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("✅ Bot running on port 3000"));
