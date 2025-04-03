const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');
const crypto = require('crypto'); // For generating unique IDs


const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        console.log(req.file); // Debugging: Check if the file is received
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate a unique ID for this transcription
        const uniqueId = crypto.randomUUID();

        // Create the transcriptions folder if it doesn't exist
        const transcriptionsFolder = path.join(__dirname, '../../transcriptions');
        if (!fs.existsSync(transcriptionsFolder)) {
            fs.mkdirSync(transcriptionsFolder);
        }

        // Rename the uploaded file to ensure it has the correct .ogg extension
        const originalFilePath = path.join(__dirname, '../..', req.file.path);
        const audioFilePath = path.join(transcriptionsFolder, `${uniqueId}.webm`);
        fs.renameSync(originalFilePath, audioFilePath);

        // Use OpenAI's transcription API
        const transcription = await openai.audio.transcriptions.create({
            language: "nl", // Specify the language code
            prompt: "Maak een transcriptie van deze audio, dewelke een dictaat is dat medische termen bevat.",
            file: fs.createReadStream(audioFilePath),
            model: "whisper-1", // Use the correct model name
        });
        console.log(transcription); // Debugging: Check the transcription result
         // Save the transcription result to a text file
         const transcriptionFilePath = path.join(transcriptionsFolder, `${uniqueId}_transcript.txt`);
         fs.writeFileSync(transcriptionFilePath, transcription.text, 'utf8');
        console.log(`Transcription saved to ${transcriptionFilePath}`);

        // Format the transcription using OpenAI's chat completion
        const response = await openai.chat.completions.create({
            model: "ft:gpt-4o-mini-2024-07-18:personal:seppe:BHuycZUe",
            messages: [
                {
                    role: "developer",
                    content: `Formateer de volgende audiotranscriptie naar correcte structuur en interpunctie. 
De meeste dictaten maken gebruik van genummerde paragrafen. Dit wordt altijd duidelijk aangegeven in de transcriptie met de woordengroep "punt 1", "punt 2", enz...
De eerste zin van elke paragraaf is de titel van de paragraaf.
De rest van de tekst van deze paragraaf is de inhoud en dient te beginnen op de volgende regel.
De inhoud van de paragraaf bevat meestal een probleemstelling, diagnostiek, besluit en behandelingsplan. Probeer deze categoriën te onderscheiden en begin elk van deze categoriën op een nieuwe regel.

Indien er geen cues voor genummerde paragrafen in het dictaat aanwezig zijn moeten er geen paragrafen of titels verzonnen worden. Het onderscheid in de inhoud in categorieën zoals probleemstelling, diagnostiek, besluit en behandelingsplan moeten zo mogelijk wel nog gemaakt worden en iedere categorie dient op een nieuwe regel te beginnen.

Probeer zoveel mogelijk de gedicteerde tekst te volgen zonder teveel aanpassingen aan woordkeuze of stijl. Corrigeer enkel grammaticale fouten. 

Gedicteerde afkortingen moeten als afkortingen worden neergeschreven zonder volledige vorm.
Probeer zoveel mogelijk voluit geschreven vormen te vervangen door hun afkortingen 
bv Mild MI graad 1/4

Gebruik het volgende als voorbeeld voor de structuur:
1. Voorbeeld titel. 
Dit is een voorbeeld van beschrijving. 
Dit is een voorbeeld van onderzoeksresultaten. 
Dit is een voorbeeld van conclusie.
Dit is een voorbeeld van de behandeling.`
                },
                {
                    role: "user",
                    content: `Formateer de volgende audiotranscriptie volgens de opgegeven instructies: ${transcription.text}`
                },
            ],
            temperature: 0.4,
            n: 1,
            store: true,
        });

        // Save the formatted result to a text file
        const formattedFilePath = path.join(transcriptionsFolder, `${uniqueId}_formatted.txt`);
        fs.writeFileSync(formattedFilePath, response.choices[0].message.content, 'utf8');

        // Send the transcription result
        res.json({
            formatted_transcription: response.choices[0].message.content,
            unique_id: uniqueId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});
router.post('/save-corrected', async (req, res) => {
    try {
        const { unique_id, corrected_text } = req.body;

        if (!unique_id || !corrected_text) {
            return res.status(400).json({ error: 'Missing unique_id or corrected_text' });
        }

        // Create the transcriptions folder if it doesn't exist
        const transcriptionsFolder = path.join(__dirname, '../../transcriptions');
        if (!fs.existsSync(transcriptionsFolder)) {
            fs.mkdirSync(transcriptionsFolder);
        }

        // Save the corrected transcription to a file
        const correctedFilePath = path.join(transcriptionsFolder, `${unique_id}_corrected.txt`);
        fs.writeFileSync(correctedFilePath, corrected_text, 'utf8');

        res.json({ message: 'Corrected transcription saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save corrected transcription' });
    }
});
module.exports = router;