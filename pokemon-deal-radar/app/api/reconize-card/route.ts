import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Geen afbeelding ontvangen" },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Herken deze Pokémon kaart.

Geef alleen JSON terug:
{
  "name": "kaartnaam",
  "number": "kaartnummer zonder set totaal",
  "fullNumber": "bijvoorbeeld 125/094",
  "confidence": 0-100
}

Als je het niet zeker weet, gebruik null.
              `,
            },
            {
              type: "input_image",
              image_url: image,
            },
          ],
        },
      ],
    });

    const text = response.output_text;

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json(
        { error: "Geen geldige JSON herkend", raw: text },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Kaart herkennen mislukt" },
      { status: 500 }
    );
  }
}