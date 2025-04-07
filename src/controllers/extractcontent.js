const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extract_content(content_text) {
  try {
    console.log(content_text);
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "system",
          content:
            "Je bent een secretariaatsmedewerker op de dienst cardiologie die vanuit audiotranscripties de aanwezigheid van bepaalde basisblokken dient te identificeren en indien aanwezig deze in een gestructureerd formaat dient te exporteren.\nDe audiotranscripties kunnen 1 of meer van de volgende elementen bevatten, maar niet noodzakelijk altijd dezelfde of dezelfde combinaties:\n- echocardiografie beschrijving\n- protocol van een holter: dit bestaat uit de beschrijving van de holterresultaten, gevolgd door een besluit van het onderzoek\n- protocol van een 24h bloeddrukmeting: dit bestaat uit de beschrijving van de meetresultaten, gevolgd door een besluit van het onderzoek\n- protocol van medische beeldvorming\n- algemeen besluit van het medisch verslag\nJe dient de aanwezigheid van deze blokken te identificeren en de inhoud ervan in een JSON formaat te exporteren",
        },
        {
          role: "user",
          content:
            "extraheer de aanwezige blokken in volgende transcriptie: " +
            content_text,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "medical_report_blocks",
          schema: {
            type: "object",
            required: [
              "echocardiography_description",
              "holter_protocol",
              "bloeddrukmeting_protocol",
              "medisch_besluit",
              "nota",
            ],
            properties: {
              holter_protocol: {
                type: "object",
                required: ["is_present", "details"],
                properties: {
                  details: {
                    type: "string",
                    description: "The content of the Holter protocol.",
                  },
                  is_present: {
                    type: "boolean",
                    description:
                      "Indicates whether the Holter protocol block is present in the report.",
                  },
                },
                additionalProperties: false,
              },
              medisch_besluit: {
                type: "object",
                required: ["is_present", "details"],
                properties: {
                  details: {
                    type: "string",
                    description:
                      "The content of the general conclusion of a medical report. Is identified by a longer body of text describing the problems, findings and proposed treatments, in contrast to the shorter conclusions of technical examinations",
                  },
                  is_present: {
                    type: "boolean",
                    description:
                      "Indicates whether a general conclusion of the medical report is present in the report.",
                  },
                },
                additionalProperties: false,
              },
              bloeddrukmeting_protocol: {
                type: "object",
                required: ["is_present", "details"],
                properties: {
                  details: {
                    type: "string",
                    description:
                      "The content of the ambulatory bloodpressure measurement protocol.",
                  },
                  is_present: {
                    type: "boolean",
                    description:
                      "Indicates whether the ambulatory bloodpressure measurement protocol block is present in the report.",
                  },
                },
                additionalProperties: false,
              },
              echocardiography_description: {
                type: "object",
                required: ["is_present", "details"],
                properties: {
                  details: {
                    type: "string",
                    description:
                      "The content of the echocardiography description.",
                  },
                  is_present: {
                    type: "boolean",
                    description:
                      "Indicates whether the echocardiography description block is present in the report.",
                  },
                },
                additionalProperties: false,
              },
              nota: {
                type: "object",
                required: ["is_present", "details"],
                properties: {
                  details: {
                    type: "string",
                    description: "The content of the transcripted note.",
                  },
                  is_present: {
                    type: "boolean",
                    description:
                      "Indicates whether a short note, not related to the other blocks, is present in the report.",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      },
      reasoning: {},
      tools: [],
      temperature: 1,
      max_output_tokens: 2048,
      top_p: 1,
      store: true,
    });

    return JSON.parse(response.output_text);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  extract_content: extract_content,
};
