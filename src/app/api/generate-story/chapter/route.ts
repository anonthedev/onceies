import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";
import { incrementStoryCount } from "@/lib/usage-tracking";

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

    const { 
      storyId,
      chapterNumber,
      title,
      summary,
      userInput,
      isLastChapter
    } = await req.json();

    if (!storyId || !title || !summary || !userInput || chapterNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Supabase client with user's access token
    const supabase = supabaseClient(session.supabaseAccessToken);

    const chapterPrompt = `Write a children's book chapter in the style of *Geronimo Stilton*. The chapter should be energetic, filled with quirky characters, humorous narration, and expressive language.

    Story Details:
    - Age Group: ${userInput.ageGroup}
    - Main Characters: ${userInput.characters}
    - Overall Plot: ${userInput.plot}
    
    Chapter Details:
    - Chapter ${chapterNumber}: ${title}
    - Chapter Summary: ${summary}
    
    Requirements:
    - Chapter length should be 200-300 words
    - Make it dynamic, fast-paced, and funny
    - Include vivid imagery and exciting sound words (like ZOOM! SPLAT! WHOOSH!)
    - Use playful emphasis where appropriate (like THIS or *that*)
    - Narrator should have a strong, fun personality
    - End with a smooth transition to keep readers engaged
    
    Write the complete chapter content.`;

    const chapterCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional children's book author who creates engaging, educational, and age-appropriate story chapters. Your stories are imaginative, positive, and include valuable life lessons."
        },
        {
          role: "user",
          content: chapterPrompt
        }
      ],
      temperature: 0.8,
    });

    const chapterContent = chapterCompletion.choices[0]?.message?.content;

    if (!chapterContent) {
      return NextResponse.json({ error: `Failed to generate chapter ${chapterNumber}` }, { status: 500 });
    }

    // Generate image prompt for this chapter
    const imagePromptCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed image prompts for children's book illustrations. Create vivid, colorful, child-friendly descriptions."
        },
        {
          role: "user",
          content: `Create a detailed image prompt for an illustration for this chapter:

          Chapter Title: ${title}
          Chapter Content: ${chapterContent.substring(0, 500)}...
          
          The image should be:
          - Child-friendly and colorful
          - In a cartoon/illustration style
          - Show the main characters and key scene from this chapter
          - Engaging for children aged ${userInput.ageGroup}
          
          Provide a detailed prompt (2-3 sentences) that an AI image generator could use.`
        }
      ],
      temperature: 0.7,
    });

    const imagePrompt = imagePromptCompletion.choices[0]?.message?.content || "A colorful children's book illustration";

    // Store chapter in database
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        user_id: session.user.id,
        title: title,
        content: chapterContent,
        image_prompt: imagePrompt,
        chapter_number: chapterNumber,
      })
      .select()
      .single();

    if (chapterError) {
      console.error('Error storing chapter:', chapterError);
      return NextResponse.json({ error: `Failed to store chapter ${chapterNumber}` }, { status: 500 });
    }

    // Increment story count if this is the last chapter
    if (isLastChapter) {
      try {
        await incrementStoryCount(session.user.id!, session.supabaseAccessToken);
      } catch (countError) {
        console.error('Error incrementing story count:', countError);
        // Don't fail the request if count increment fails
      }
    }

    return NextResponse.json({ 
      success: true,
      chapter: chapterData
    });

  } catch (error) {
    console.error('Chapter generation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 