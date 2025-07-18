import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase";
import Epub from "epub-gen";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await auth();
    if (!session?.supabaseAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseClient(session.supabaseAccessToken);
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    // Fetch story data
    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .select(`*, user_inputs(*)`)
      .eq("id", storyId)
      .single();

    if (storyError || !storyData) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch chapters
    const { data: chaptersData, error: chaptersError } = await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", storyId)
      .order("chapter_number", { ascending: true });

    if (chaptersError || !chaptersData) {
      return NextResponse.json({ error: "Chapters not found" }, { status: 404 });
    }

    const story = {
      ...storyData,
      chapters: chaptersData,
    };

    const storyTitle = story?.chapters[0]?.title.replace(/^Chapter \d+:\s*/, "") || "Untitled Story";
    const author = session?.user?.name || "Unknown Author";

    const content = story.chapters.map((chapter: {title: string, content: string, chapter_number: number, story_id: string}) => ({
      title: chapter.title,
      data: `
        <div class="chapter">
          <h1 class="chapter-title">${chapter.title}</h1>
          <div class="chapter-content">
            ${chapter.content
              .split('\n\n')
              .filter((paragraph: string) => paragraph.trim())
              .map((paragraph: string) => `<p class="paragraph">${paragraph.trim()}</p>`)
              .join('')}
          </div>
        </div>
      `
    }));

    // EPUB options with enhanced styling
    const options = {
      title: storyTitle,
      author: author,
      publisher: "Onceies",
      content: content,
      cover: storyData.cover_image || undefined,
      css: `
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.8;
          margin: 2em;
          color: #2c3e50;
          background-color: #fefefe;
        }
        
        .chapter {
          margin-bottom: 2em;
        }
        
        .chapter-title {
          color: #34495e;
          border-bottom: 3px solid #3498db;
          padding-bottom: 0.5em;
          margin-bottom: 1.5em;
          font-size: 1.8em;
          font-weight: bold;
          text-align: center;
        }
        
        .chapter-content {
          text-align: justify;
          font-size: 1.1em;
        }
        
        .paragraph {
          margin-bottom: 1.2em;
          text-indent: 2em;
          word-spacing: 0.1em;
        }
        
        /* Ensure proper spacing for first paragraph */
        .paragraph:first-of-type {
          margin-top: 1em;
        }
        
        /* Responsive design for different screen sizes */
        @media (max-width: 600px) {
          body {
            margin: 1em;
            font-size: 0.9em;
          }
          
          .chapter-title {
            font-size: 1.5em;
          }
          
          .paragraph {
            text-indent: 1.5em;
          }
        }
      `
    };

    // Generate EPUB with output path
    const fileName = `${storyTitle.replace(/[^a-zA-Z0-9]/g, "_")}.epub`;
    const outputPath = `/tmp/${fileName}`;
    
    const epubBuffer = await new Promise<Buffer>((resolve, reject) => {
      new Epub(options, outputPath).promise
        .then(() => {
          const buffer = fs.readFileSync(outputPath);
          
          // Clean up the temporary file
          fs.unlinkSync(outputPath);
          
          resolve(buffer);
        })
        .catch(reject);
    });

    // Return the EPUB file as a response
    return new NextResponse(epubBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': epubBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error generating EPUB:", error);
    return NextResponse.json(
      { error: "Failed to generate EPUB" },
      { status: 500 }
    );
  }
} 