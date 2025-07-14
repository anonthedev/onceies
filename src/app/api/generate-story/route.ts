import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    console.log(session);
    if (!session || !session.user || !session.supabaseAccessToken) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { title, ageGroup, plot, characters } = await req.json();

    if (!title || !ageGroup || !plot || !characters) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create age-appropriate story prompt
    const ageGuidelines = {
      "0-2": "Use very simple words, short sentences (3-5 words), repetitive sounds, and focus on basic concepts like colors, shapes, and familiar objects. Include lots of sensory descriptions.",
      "3-5": "Use simple vocabulary, short paragraphs, and clear moral lessons. Include interactive elements and predictable patterns. Focus on friendship, sharing, and basic emotions.",
      "6-8": "Use more complex vocabulary while remaining accessible, longer paragraphs, and include problem-solving elements. Can include mild adventure and more detailed character development."
    };

    const prompt = `Write a children's story for ages ${ageGroup} with the following details:

Title: ${title}
Characters: ${characters}
Plot: ${plot}

Guidelines for age ${ageGroup}: ${ageGuidelines[ageGroup as keyof typeof ageGuidelines]}

Requirements:
- Make it engaging and age-appropriate
- Include a clear beginning, middle, and end
- Incorporate a positive message or lesson
- Use vivid, child-friendly descriptions
- Keep it between 200-500 words depending on age group
- Make it suitable for reading aloud

Please write the complete story:`;

    // Generate story with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional children's book author who creates engaging, educational, and age-appropriate stories for kids. Your stories are imaginative, positive, and include valuable life lessons."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const generatedStory = completion.choices[0]?.message?.content;

    if (!generatedStory) {
      return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
    }

    // Create Supabase client with user's access token
    const supabase = supabaseClient(session.supabaseAccessToken);

    // Save story to database
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title,
        age_group: ageGroup,
        plot,
        characters,
        story: generatedStory,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: "Failed to save story to database" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      story: generatedStory,
      storyId: data.id
    });

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}