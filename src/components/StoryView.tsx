"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  X,
  Book,
  BookOpenCheck,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StoryWithChapters, Chapter } from "@/types/story";
import Loader from "./Loader";

interface StoryNotFoundProps {
  onBack: () => void;
}

function splitStoryIntoPages(
  chapters: Chapter[],
  wordsPerPage: number = 125
): string[] {
  if (!chapters.length) return [];

  const pages: string[] = [];
  let currentPage = "";
  let currentWordCount = 0;

  for (const chapter of chapters) {
    if (currentPage.trim()) {
      pages.push(currentPage.trim());
      currentPage = "";
      currentWordCount = 0;
    }

    const words = chapter.content.split(" ");

    for (const word of words) {
      if (currentWordCount >= wordsPerPage && currentPage.trim()) {
        pages.push(currentPage.trim());
        currentPage = "";
        currentWordCount = 0;
      }

      currentPage += word + " ";
      currentWordCount++;
    }

    currentPage += "\n\n";
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages;
}

function StoryLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Loader message="Loading your story..." />
    </div>
  );
}

function StoryNotFound({ onBack }: StoryNotFoundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Story Not Found
          </h2>
          <Button onClick={onBack}>Return to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}

export default function StoryView() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<StoryWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1+ = story pages
  const [storyPages, setStoryPages] = useState<string[]>([]);
  const [isTwoPageView, setIsTwoPageView] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageRegenerateLoading, setCoverImageRegenerateLoading] =
    useState(false);

  useEffect(() => {
    if (session?.supabaseAccessToken && storyId) {
      fetchStory();
    }
  }, [session, storyId]);

  useEffect(() => {
    if (story?.chapters && story.chapters.length > 0) {
      const pages = splitStoryIntoPages(story.chapters);
      setStoryPages(pages);
    }
  }, [story]);

  const fetchStory = async () => {
    try {
      if (!session?.supabaseAccessToken) return;

      const supabase = supabaseClient(session.supabaseAccessToken);

      // Fetch story
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select(`*, user_inputs(*)`)
        .eq("id", storyId)
        .single();

      setCoverImage(storyData.cover_image);

      console.log(storyData);

      if (storyError) {
        console.error("Error fetching story:", storyError);
        toast.error("Story not found");
        router.push("/dashboard");
        return;
      }

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: true });

      if (chaptersError) {
        console.error("Error fetching chapters:", chaptersError);
        toast.error("Failed to load story chapters");
        router.push("/dashboard");
        return;
      }

      setStory({
        ...storyData,
        chapters: chaptersData || [],
      });
    } catch (error) {
      console.error("Error fetching story:", error);
      toast.error("Failed to load story");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const goToPrevPage = () => {
    if (isTwoPageView) {
      setCurrentPage((prev) => Math.max(0, prev - 2));
    } else {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  const goToNextPage = () => {
    const maxPage = storyPages.length; // 0 = cover, 1 to storyPages.length = story pages
    if (isTwoPageView) {
      setCurrentPage((prev) => Math.min(maxPage, prev + 2));
    } else {
      setCurrentPage((prev) => Math.min(maxPage, prev + 1));
    }
  };

  const totalPages = storyPages.length + 1; // +1 for cover page

  const canGoPrev = currentPage > 0;
  const canGoNext = isTwoPageView
    ? currentPage < totalPages - 1
    : currentPage < totalPages - 1;

  if (loading) {
    return <StoryLoadingState />;
  }

  if (!story) {
    return <StoryNotFound onBack={handleBack} />;
  }

  const handleRegenerateCover = async () => {
    setCoverImageRegenerateLoading(true);
    try {
      toast.loading("Regenerating cover image...");
      const response = await fetch("/api/image-gen", {
        method: "POST",
        body: JSON.stringify({
          title: story.user_inputs?.title,
          ageGroup: story?.user_inputs?.age_group,
          characters: story?.user_inputs?.characters,
          plot: story?.user_inputs?.plot,
          storyId: story.id,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCoverImage(data.imageUrl);
        toast.success("Cover image regenerated successfully");
      }
    } catch (error) {
      console.error("Error regenerating cover:", error);
      toast.error("Failed to regenerate cover");
    } finally {
      setCoverImageRegenerateLoading(false);
    }
  };

  const renderCoverPage = () => {
    const storyTitle =
      story?.chapters[0]?.title.replace(/^Chapter \d+:\s*/, "") ||
      "Untitled Story";

    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl bg-white">
          {coverImage ? (
            <img
              src={coverImage}
              alt={storyTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-purple-200 to-blue-200">
              <BookOpen className="h-16 w-16 mb-4" />
              <h2 className="text-xl font-bold text-center text-purple-700 px-4">
                {storyTitle}
              </h2>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="absolute bottom-4 right-4 text-center text-sm text-gray-500 font-comic-neue"
          onClick={handleRegenerateCover}
          disabled={coverImageRegenerateLoading}
        >
          {coverImageRegenerateLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  const renderStoryPage = (pageIndex: number) => (
    <div className="relative h-full">
      <div className="h-fit py-8 px-8 flex flex-col bg-cream">
        <div className="flex-grow flex flex-col justify-center">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg font-comic-neue">
              <ReactMarkdown>{storyPages[pageIndex - 1]}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-4 right-4 text-center text-sm text-gray-500 font-comic-neue">
        Page {pageIndex} of {storyPages.length}
      </div>
    </div>
  );

  const renderTwoPageSpread = () => {
    if (currentPage === 0) {
      return (
        <div className="grid grid-cols-2 h-full">
          <div className="border-r border-gray-200">{renderCoverPage()}</div>
          <div>
            {storyPages.length > 0 ? (
              renderStoryPage(1)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>
      );
    } else {
      const leftPageIndex = currentPage;
      const rightPageIndex = currentPage + 1;

      return (
        <div className="grid grid-cols-2 h-full">
          <div className="border-r border-gray-200">
            {leftPageIndex <= storyPages.length ? (
              renderStoryPage(leftPageIndex)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>
          <div>
            {rightPageIndex <= storyPages.length ? (
              renderStoryPage(rightPageIndex)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="mb-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close Book
          </Button>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <Button
                variant={!isTwoPageView ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsTwoPageView(false)}
                className="flex items-center gap-1"
              >
                <Book className="h-4 w-4" />
                Single
              </Button>
              <Button
                variant={isTwoPageView ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsTwoPageView(true)}
                className="flex items-center gap-1"
              >
                <BookOpenCheck className="h-4 w-4" />
                Spread
              </Button>
            </div>

            <div className="text-sm text-gray-600 font-comic-neue">
              {currentPage === 0
                ? "Cover"
                : isTwoPageView
                ? `Pages ${currentPage}-${Math.min(
                    currentPage + 1,
                    storyPages.length
                  )} of ${storyPages.length}`
                : `Page ${currentPage} of ${storyPages.length}`}
            </div>
          </div>
        </div>

        {/* Book Container with Navigation */}
        <div className="flex items-center justify-center gap-8">
          {/* Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={!canGoPrev}
            className="h-16 w-16 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-2 hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>

          {/* Book */}
          <div
            className="relative"
            style={{
              maxWidth: isTwoPageView ? "1200px" : "600px",
              width: "100%",
              height: "700px",
            }}
          >
            {/* Book Shadow */}
            <div className="absolute inset-0 bg-gray-900 rounded-r-lg transform translate-x-1 translate-y-1 opacity-20"></div>

            {/* Book */}
            <Card className="py-0 my-0 relative h-full shadow-2xl rounded-r-lg border-l-8 border-amber-800 bg-white overflow-hidden">
              <CardContent className="h-full p-0 relative">
                {/* Book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-700 to-amber-900"></div>

                {/* Page content */}
                <div className="ml-2  h-full">
                  {isTwoPageView
                    ? renderTwoPageSpread()
                    : currentPage === 0
                    ? renderCoverPage()
                    : renderStoryPage(currentPage)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={!canGoNext}
            className="h-16 w-16 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-2 hover:scale-110 transition-transform"
          >
            <ArrowRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Page Indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {Array.from(
              { length: Math.ceil(totalPages / (isTwoPageView ? 2 : 1)) },
              (_, i) => {
                const pageIndex = i * (isTwoPageView ? 2 : 1);
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageIndex)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      (
                        isTwoPageView
                          ? Math.floor(currentPage / 2) === i
                          : currentPage === pageIndex
                      )
                        ? "bg-purple-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    title={pageIndex === 0 ? "Cover" : `Page ${pageIndex}`}
                  />
                );
              }
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => router.push("/create")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 font-comic-neue"
          >
            Create New Story
          </Button>
        </div>
      </div>
    </div>
    // </div>
  );
}
