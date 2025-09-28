import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { messages, personality } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];

    // Build conversation context
    const conversationContext = messages
      .slice(0, -1) // Exclude the latest message as it will be in the prompt
      .map(
        (msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    // Create a personality-aware system prompt
    const systemPrompt = `You are helping someone communicate who is unable to type their own responses. This person can only select from multiple choice options you provide. 

The person you're speaking for has this personality and characteristics: ${personality.description}

Your task is to generate exactly 4 different response options that this person might want to say in reply to the user's latest message. Each response should:
1. Sound like it's coming from the person described above, not from an AI assistant
2. Reflect their personality, communication style, and perspective
3. Take into account the conversation context and relationship dynamics
4. Offer different emotional tones or approaches they might choose from (e.g., more formal vs casual, enthusiastic vs measured, etc.)
5. Be authentic responses this person would actually want to communicate

Think of yourself as providing communication options for someone who knows what they want to say but needs you to articulate it in different ways they can choose from.

Format your response as a JSON array with exactly 4 strings, each representing a complete response option this person might select. Do not include any other text or formatting - just the JSON array.

Example format: ["Response option 1", "Response option 2", "Response option 3", "Response option 4"]`;

    // Build the prompt with conversation context
    let prompt = "";
    if (conversationContext) {
      prompt += `Previous conversation:\n${conversationContext}\n\n`;
    }
    prompt += `User's latest message: ${latestMessage.content}`;

    const { text } = await generateText({
      model: openai("gpt-4-turbo-preview"),
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.8, // Higher temperature for more varied responses
    });

    // Parse the response to extract the 4 options
    let options: string[];

    try {
      // Try to parse as JSON first
      options = JSON.parse(text);

      // Validate that we have exactly 4 options
      if (!Array.isArray(options) || options.length !== 4) {
        throw new Error("Invalid response format");
      }
    } catch (parseError) {
      // Fallback: try to extract responses from text
      console.warn(
        "Failed to parse JSON response, attempting fallback parsing"
      );

      // Split by common delimiters and clean up
      const lines = text
        .split(/\n|(?:\d+\.)|(?:Option \d+:)|(?:Response \d+:)/i)
        .map((line) => line.trim())
        .filter((line) => line.length > 10) // Filter out short/empty lines
        .slice(0, 4); // Take first 4 valid responses

      if (lines.length < 4) {
        // Generate fallback responses if parsing fails
        options = [
          `Based on your question about "${latestMessage.content}", here's one perspective...`,
          `Another way to think about "${latestMessage.content}" is...`,
          `From a different angle regarding "${latestMessage.content}"...`,
          `Here's an alternative approach to "${latestMessage.content}"...`,
        ];
      } else {
        options = lines;
      }
    }

    // Ensure all options are strings and not empty
    options = options
      .map((option) =>
        typeof option === "string" ? option.trim() : String(option).trim()
      )
      .filter((option) => option.length > 0);

    // If we still don't have 4 options, pad with generic responses
    while (options.length < 4) {
      options.push(
        `Here's another perspective on your question: "${latestMessage.content}"`
      );
    }

    // Limit to exactly 4 options
    options = options.slice(0, 4);

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Error in chat API:", error);

    // Return fallback responses in case of any error
    const fallbackOptions = [
      "I'd be happy to help you with that question. Let me think about the best approach...",
      "That's an interesting question! Here's one way to consider it...",
      "I can offer several perspectives on this topic...",
      "Let me provide you with a thoughtful response to your inquiry...",
    ];

    return NextResponse.json({ options: fallbackOptions });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Chat API is running" });
}
