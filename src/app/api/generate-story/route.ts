import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";
import { checkStoryLimit, incrementStoryCount } from "@/lib/usage-tracking";

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

    // Create age-appropriate story prompt
    // const ageGuidelines = {
    //   "0-2": "Use very simple words, short sentences (3-5 words), repetitive sounds, and focus on basic concepts like colors, shapes, and familiar objects. Include lots of sensory descriptions.",
    //   "3-5": "Use simple vocabulary, short paragraphs, and clear moral lessons. Include interactive elements and predictable patterns. Focus on friendship, sharing, and basic emotions.",
    //   "6-8": "Use more complex vocabulary while remaining accessible, longer paragraphs, and include problem-solving elements. Can include mild adventure and more detailed character development."
    // };

    const prompt = `Write a fun, adventurous children's story in the style of *Geronimo Stilton*. The story should be energetic, filled with quirky characters, humorous narration, and expressive language. Use lots of vivid imagery, exciting sound words (like ZOOM! SPLAT! WHOOSH!), and playful fonts or emphasis where appropriate (like THIS or *that*). The narrator can break the fourth wall and be a bit dramatic or clumsy, like Geronimo himself.

    Story Details:
    - Title: ${title}
    - Main Characters: ${characters}
    - Plot Summary: ${plot}
    
    Requirements:
    - Story length should be around 800–1200 words
    - Make it dynamic, fast-paced, and funny
    - Include a clear beginning, middle, and end
    - Incorporate light moral lessons like courage, friendship, or curiosity
    - Add silly twists, dramatic expressions, and unexpected turns
    - Narrator should have a strong, fun personality — possibly getting into trouble, overreacting, and learning something by the end
    
    Please write the full story, ready to be included in a children's book.
    `;
    

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

    // Increment story count for usage tracking
    try {
      await incrementStoryCount(session.user.id!, session.supabaseAccessToken);
    } catch (countError) {
      console.error('Error incrementing story count:', countError);
      // Don't fail the request if count increment fails
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