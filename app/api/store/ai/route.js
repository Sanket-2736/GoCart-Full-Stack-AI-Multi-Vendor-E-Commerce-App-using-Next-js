import openai from "@/configs/openai";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function main(base64Image, mimeType) {
  console.log("🔍 Entered main() with image and mimeType:", mimeType);

  const messages = [
    {
      role: "system",
      content: `
        You are a product listing assistant for an e-commerce store. Your job is to analyze an image of
        a product and generate structured data.
        Respond ONLY with a raw JSON (no code block, no markdown, no explanation).
        The JSON must strictly follow this schema:
        {
            "name": string,     // short product name
            "description": string  // marketing-friendly description of the product
        }
      `,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyse this image and return name + description.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  console.log("🧠 Sending request to OpenAI model:", process.env.OPENAI_MODEL);

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages,
  });

  console.log("✅ Raw OpenAI response:", JSON.stringify(response, null, 2));

  const raw = response.choices[0]?.message?.content;
  console.log("📝 Raw message content:", raw);

  if (!raw) {
    throw new Error("No response content from OpenAI!");
  }

  const cleaned = raw.replace(/```json|```/g, "").trim();
  console.log("🧹 Cleaned content:", cleaned);

  try {
    const parsed = JSON.parse(cleaned);
    console.log("✅ Parsed JSON:", parsed);
    return parsed; // ✅ <--- important: return the parsed JSON
  } catch (error) {
    console.error("❌ JSON parsing error:", error.message);
    throw new Error("AI didn't provide valid JSON!");
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    console.log("👤 Authenticated user:", userId);

    const isSeller = await authSeller(userId);
    console.log("🛒 Seller authorization:", isSeller);

    if (!isSeller) {
      return NextResponse.json({ error: "Unauthorised!" }, { status: 401 });
    }

    const { base64Image, mimeType } = await req.json();
    console.log("📸 Received image and mimeType:", { mimeType });

    const res = await main(base64Image, mimeType);
    console.log("🎯 Final AI result:", res);

    return NextResponse.json({ ...res });
  } catch (error) {
    console.error("🔥 Error in POST:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
