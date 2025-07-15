import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";
import { checkStoryLimit } from "@/lib/usage-tracking";
import { StoryOutline } from "@/types/story";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.supabaseAccessToken) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { title, ageGroup, plot, characters } = await req.json();

    if (!title || !ageGroup || !plot || !characters) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check story generation limit
    const usageStatus = await checkStoryLimit(session.user.id!, session.supabaseAccessToken);
    
    if (!usageStatus.canGenerate) {
      return NextResponse.json({ 
        error: "Story generation limit reached", 
        plan: usageStatus.plan,
        remaining: usageStatus.remaining,
        needsUpgrade: true
      }, { status: 403 });
    }

    // Store user input in user_inputs table
    const supabase = supabaseClient(session.supabaseAccessToken);
    const { data: userInputData, error: inputError } = await supabase
      .from('user_inputs')
      .insert({
        title,
        age_group: ageGroup,
        plot,
        characters,
      })
      .select()
      .single();

    if (inputError) {
      console.error('Error storing user input:', inputError);
      return NextResponse.json({ error: "Failed to store user input" }, { status: 500 });
    }

    // Generate story outline using flash model for speed
    const prompt = `Create a story outline for a children's book with the following details:

    Title: ${title}
    Age Group: ${ageGroup}
    Main Characters: ${characters}
    Plot: ${plot}

    Create exactly 5-6 chapter outlines. For each chapter, provide:
    1. A catchy chapter title (3-8 words)
    2. A one-line summary (10-15 words describing what happens)

    Format your response as a JSON object like this:
    {
      "title": "${title}",
      "chapters": [
        {
          "chapter_number": 1,
          "title": "Chapter Title",
          "summary": "One line summary of what happens in this chapter."
        }
      ]
    }

    Make sure the story flows well from chapter to chapter and includes a clear beginning, middle, and satisfying conclusion appropriate for the age group.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast model for low latency
      messages: [
        {
          role: "system",
          content: "You are a professional children's book author who creates engaging story outlines. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const outlineText = completion.choices[0]?.message?.content;

    if (!outlineText) {
      return NextResponse.json({ error: "Failed to generate outline" }, { status: 500 });
    }

    let outline: StoryOutline;
    try {
      outline = JSON.parse(outlineText);
    } catch (parseError) {
      console.error('Error parsing outline JSON:', parseError);
      return NextResponse.json({ error: "Failed to parse generated outline" }, { status: 500 });
    }

    // Validate outline structure
    if (!outline.chapters || !Array.isArray(outline.chapters) || outline.chapters.length < 5 || outline.chapters.length > 6) {
      return NextResponse.json({ error: "Invalid outline structure" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      outline,
      userInputId: userInputData.id
    });

  } catch (error) {
    console.error('Outline generation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 