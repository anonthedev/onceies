import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.supabaseAccessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { title, ageGroup, characters, plot, storyId } = await req.json();

    if (!title || !ageGroup || !characters || !plot || !storyId) {
      return NextResponse.json(
        { error: "Missing required story details or storyId" },
        { status: 400 }
      );
    }

    // Create age-appropriate and engaging cover image prompt
    const ageStyles = {
      "0-2":
        "bright primary colors, simple shapes, very cute and friendly style, board book illustration style, chunky characters",
      "3-5":
        "vibrant colors, cartoon style, whimsical and magical, picture book illustration, friendly characters with big expressions",
      "6-8":
        "detailed illustration, adventure book style, dynamic composition, chapter book cover style, more sophisticated character design",
    };

    const coverPrompt = `Create a beautiful children's book cover illustration for "${title}".

Story details:
- Characters: ${characters}
- Plot: ${plot}
- Age group: ${ageGroup}

Style requirements for age ${ageGroup}: ${
      ageStyles[ageGroup as keyof typeof ageStyles]
    }

Cover design specifications:
- Professional children's book cover illustration
- Include the main characters prominently
- Show a scene that captures the essence of the story
- Child-friendly and appealing to both kids and parents
- High quality, publishable illustration style
- Warm, inviting, and engaging composition
- No text or title on the image (just the illustration)
- Safe and appropriate content for children

Make it look like a professional children's book cover that would stand out on a bookshelf.`;

    // Generate image with OpenAI
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: coverPrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    const imageData = result.data[0];
    let imageBuffer: ArrayBuffer;

    if (imageData.url) {
      const imageResponse = await fetch(imageData.url);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch generated image" },
          { status: 500 }
        );
      }
      imageBuffer = await imageResponse.arrayBuffer();
    } else if (imageData.b64_json) {
      const base64Data = imageData.b64_json;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    } else {
      return NextResponse.json(
        { error: "No image data received from OpenAI" },
        { status: 500 }
      );
    }

    const fileName = `cover-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.png`;

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from("cover-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to save image to storage" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("cover-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // Create authenticated Supabase client to update story record
    const userSupabase = supabaseClient(session.supabaseAccessToken);

    // Update the existing story record with cover image
    const { error: updateError } = await userSupabase
      .from("stories")
      .update({ cover_image: imageUrl })
      .eq("id", storyId)
      .eq("user_id", session.user.id); // Ensure user owns this story

    if (updateError) {
      console.error("Failed to update story with cover image:", updateError);
      return NextResponse.json(
        { error: "Failed to update story with cover image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
