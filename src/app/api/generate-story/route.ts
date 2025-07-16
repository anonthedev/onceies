import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";
import { checkStoryLimit } from "@/lib/usage-tracking";
import { ChapterOutline } from "@/types/story";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.supabaseAccessToken) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { userInputId, outline } = await req.json();

    if (!userInputId || !outline) {
      return NextResponse.json({ error: "Missing userInputId or outline" }, { status: 400 });
    }

    // Create Supabase client with user's access token
    const supabase = supabaseClient(session.supabaseAccessToken);

    // Get user input data
    const { data: userInput, error: inputError } = await supabase
      .from('user_inputs')
      .select('*')
      .eq('id', userInputId)
      .single();

    if (inputError || !userInput) {
      return NextResponse.json({ error: "User input not found" }, { status: 404 });
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

    // Create story record first
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .insert({
        user_id: session.user.id,
        user_input_id: userInputId,
      })
      .select()
      .single();

    if (storyError) {
      console.error('Error creating story record:', storyError);
      return NextResponse.json({ error: "Failed to create story record" }, { status: 500 });
    }

    // Return story ID and chapter tasks
    return NextResponse.json({ 
      success: true,
      storyId: storyData.id,
      chapterTasks: outline.chapters.map((chapter: ChapterOutline) => ({
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        summary: chapter.summary,
        userInput: {
          ageGroup: userInput.age_group,
          characters: userInput.characters,
          plot: userInput.plot
        }
      })),
      totalChapters: outline.chapters.length
    });

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}