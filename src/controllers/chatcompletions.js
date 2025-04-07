const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function format_holter(input_text) {
  try {
    // Format the transcription using OpenAI's chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content: `Je bent een secretariaatsmedewerker op een cardiologische dienst.
Je dient het audiotranscript van een holter in het gewenste formaat om te zetten.
Het sjabloon dat dient ingevuld te worden is:

"Holter:
datum: [datum van het onderzoek]
duur: [24h, 48h, weekholter]
basisritme: [sinusaal, VKF, AT, VKFlutter]
Grenzen van het hartritme: [min]/[max]/[gemiddeld]

Ventriculaire extrasystolen:
[aantal] VESsen op [duur van de holter], [aantal] couplets, [aantal triplets]

Supraventriculaire extrasystolen:
[aantal] SVESsen

Brady-aritmieën:
[geen, of volgens audiotranscript]

Tachy-aritmieën:
[geen, of volgens audiotranscript]

Besluit:
[volgens audiotranscript]"

Courant gebruikte afkortingen zijn:
- VESsen: ventriculaire extrasystolen
- SVESsen: supraventriculaire extrasystolen
- nsVT: non-sustained VT
- IVR: idioventriculair ritme
- VKF: voorkamerfibrillatie
- AT: atriale tachycardie
- VKFlutter: voorkamerflutter
- Cfr. : confer (verwijzing naar vorig verslag, vaak gebruikt in de context van "Cfr. vorig verslag")
Probeer de volledig uitgesproken vormen te vervangen door hun afkortingen`,
        },
        {
          role: "user",
          content: `Maak een verslag van deze holter: ${input_text}`,
        },
      ],
      temperature: 0.8,
      n: 1,
      store: true,
      metadata: {
        model: "gpt-4o",
        category: "holter_report",
      },
    });
    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
}
async function format_besluit(input_text) {
  try {
    // Format the transcription using OpenAI's chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
        Dit is een voorbeeld van de behandeling.`,
        },
        {
          role: "user",
          content: `Formateer de volgende audiotranscriptie volgens de opgegeven instructies: ${input_text}`,
        },
      ],
      temperature: 0.4,
      n: 1,
      store: true,
      metadata: {
        model: "gpt-4o",
        category: "medical_report",
      },
    });
    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
}
async function format_nota(input_text) {
  try {
    // Format the transcription using OpenAI's chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content: `Je bent een medewerker op een secretariaat cardiologie en dient een audiotranscriptie van een nota/addendum om te zetten in een logische, goed samenhangende structuur.
          Probeer de tekst zoveel mogelijk letterlijk te volgen, maar indien er onwaarschijnlijke termen in staan kijk of er dan geen medische term bestaat die hier beter bij aansluit en mogelijks verkeerd getranscribeerd is.`,
        },
        {
          role: "user",
          content: `Formateer de volgende audiotranscriptie volgens de opgegeven instructies: ${input_text}`,
        },
      ],
      temperature: 0.8,
      n: 1,
      store: true,
      metadata: {
        model: "gpt-4o",
        category: "nota",
      },
    });
    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
}
async function format_bloeddrukmeting(input_text) {}
async function format_echocardiografie(input_text) {}
module.exports = {
  format_holter: format_holter,
  format_besluit: format_besluit,
  format_bloeddrukmeting: format_bloeddrukmeting,
  format_echocardiografie: format_echocardiografie,
  format_nota: format_nota,
};
