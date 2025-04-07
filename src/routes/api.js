const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");
const crypto = require("crypto"); // For generating unique IDs
const {
  format_holter,
  format_besluit,
  format_bloeddrukmeting,
  format_echocardiografie,
  format_nota,
} = require("../controllers/chatcompletions");
const { extract_content } = require("../controllers/extractcontent");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    console.log(req.file); // Debugging: Check if the file is received
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a unique ID for this transcription
    const uniqueId = crypto.randomUUID();

    // Create the transcriptions folder if it doesn't exist
    const transcriptionsFolder = path.join(__dirname, "../../transcriptions");
    if (!fs.existsSync(transcriptionsFolder)) {
      fs.mkdirSync(transcriptionsFolder);
    }

    // Rename the uploaded file to ensure it has the correct .ogg extension
    const originalFilePath = path.join(__dirname, "../..", req.file.path);
    const audioFilePath = path.join(transcriptionsFolder, `${uniqueId}.webm`);
    fs.renameSync(originalFilePath, audioFilePath);

    // Use OpenAI's transcription API
    const transcription = await openai.audio.transcriptions.create({
      language: "nl", // Specify the language code
      prompt:
        "Maak een transcriptie van deze audio, dewelke een dictaat is dat medische termen bevat.",
      file: fs.createReadStream(audioFilePath),
      model: "gpt-4o-mini-transcribe", // Use the correct model name
    });

    const extracted_content = await extract_content(transcription.text);
    let returnvalue = "";
    if (extracted_content.holter_protocol.is_present) {
      const holter_report = await format_holter(
        extracted_content.holter_protocol.details
      );
      returnvalue += holter_report + "\n\n";
    }
    if (extracted_content.medisch_besluit.is_present) {
      const medisch_besluit = await format_besluit(
        extracted_content.medisch_besluit.details
      );
      returnvalue += "Algemeen besluit:\n" + medisch_besluit + "\n\n";
    }
    if (extracted_content.nota.is_present) {
        const nota = await format_nota(
          extracted_content.nota.details
        );
        returnvalue += "Nota:\n" + nota + "\n\n";
      }
    if (returnvalue == "") {
      returnvalue = await format_besluit(transcription.text);
    }
    // Send the transcription result
    res.json({
      formatted_transcription: returnvalue,
      unique_id: uniqueId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});
router.post("/save-corrected", async (req, res) => {
  try {
    const { unique_id, corrected_text } = req.body;

    if (!unique_id || !corrected_text) {
      return res
        .status(400)
        .json({ error: "Missing unique_id or corrected_text" });
    }

    // Create the transcriptions folder if it doesn't exist
    const transcriptionsFolder = path.join(__dirname, "../../transcriptions");
    if (!fs.existsSync(transcriptionsFolder)) {
      fs.mkdirSync(transcriptionsFolder);
    }

    // Save the corrected transcription to a file
    const correctedFilePath = path.join(
      transcriptionsFolder,
      `${unique_id}_corrected.txt`
    );
    fs.writeFileSync(correctedFilePath, corrected_text, "utf8");

    res.json({ message: "Corrected transcription saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save corrected transcription" });
  }
});
module.exports = router;
