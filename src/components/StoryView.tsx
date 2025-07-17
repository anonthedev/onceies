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
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { StoryWithChapters, Chapter } from "@/types/story";
import Loader from "./Loader";

interface StoryNotFoundProps {
  onBack: () => void;
}

function splitStoryIntoPages(
  chapters: Chapter[],
  wordsPerPage = 125
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <Loader message="Loading your magical story..." />
    </div>
  );
}

function StoryNotFound({ onBack }: StoryNotFoundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Story Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The story you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={onBack}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Return to Dashboard
          </Button>
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
      <div className="relative h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="w-full h-full rounded-r-2xl overflow-hidden shadow-2xl bg-white relative">
          {coverImage ? (
            <img
              src={coverImage || "/placeholder.svg"}
              alt={storyTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
              <div className="p-8 bg-white/20 rounded-full mb-6">
                <BookOpen className="h-20 w-20 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-center text-purple-700 px-6">
                {storyTitle}
              </h2>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </div>
        <Button
          variant="outline"
          className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm border-2 border-white/50 hover:bg-white hover:border-purple-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
      <div className="h-full py-10 px-8 flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex-grow flex flex-col justify-start">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg font-comic-neue">
              <ReactMarkdown>{storyPages[pageIndex - 1]}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 px-3 py-1 text-xs text-gray-600">
        Page {pageIndex} of {storyPages.length}
      </div>
    </div>
  );

  const renderTwoPageSpread = () => {
    if (currentPage === 0) {
      return (
        <div className="grid grid-cols-2 h-full gap-1">
          <div className="border-r border-gray-200">{renderCoverPage()}</div>
          <div>
            {storyPages.length > 0 ? (
              renderStoryPage(1)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">No content available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      const leftPageIndex = currentPage;
      const rightPageIndex = currentPage + 1;

      return (
        <div className="grid grid-cols-2 h-full gap-1">
          <div className="border-r border-gray-200">
            {leftPageIndex <= storyPages.length ? (
              renderStoryPage(leftPageIndex)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">End of story</p>
                </div>
              </div>
            )}
          </div>
          <div>
            {rightPageIndex <= storyPages.length ? (
              renderStoryPage(rightPageIndex)
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                  <p className="text-lg font-semibold">The End</p>
                  <p className="text-sm mt-2">Thank you for reading!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-300/20 to-red-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-white/50 hover:bg-white hover:border-purple-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <X className="h-4 w-4" />
            Close Book
          </Button>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/50">
              <Button
                variant={!isTwoPageView ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsTwoPageView(false)}
                className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                  !isTwoPageView
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "hover:bg-purple-50"
                }`}
              >
                <Book className="h-4 w-4" />
                Single
              </Button>
              <Button
                variant={isTwoPageView ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsTwoPageView(true)}
                className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                  isTwoPageView
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "hover:bg-purple-50"
                }`}
              >
                <BookOpenCheck className="h-4 w-4" />
                Spread
              </Button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/50">
              <span className="text-sm font-medium text-gray-700">
                {currentPage === 0
                  ? "Cover"
                  : isTwoPageView
                  ? `Pages ${currentPage}-${Math.min(
                      currentPage + 1,
                      storyPages.length
                    )} of ${storyPages.length}`
                  : `Page ${currentPage} of ${storyPages.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Book Container with Navigation */}
        <div className="flex items-center justify-center gap-8">
          {/* Enhanced Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={!canGoPrev}
            className="h-16 w-16 rounded-full shadow-xl bg-white/90 backdrop-blur-sm border-2 border-white/50 hover:bg-white hover:border-purple-300 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>

          {/* Enhanced Book */}
          <div
            className="relative"
            style={{
              maxWidth: isTwoPageView ? "1200px" : "600px",
              width: "100%",
              height: "700px",
            }}
          >
            {/* Enhanced Book Shadow */}
            <div className="absolute inset-0 bg-gray-900 rounded-r-2xl transform translate-x-2 translate-y-2 opacity-20 blur-sm"></div>

            {/* Enhanced Book */}
            <Card className="py-0 my-0 relative h-full shadow-2xl rounded-r-2xl border-l-8 border-amber-800 bg-white overflow-hidden">
              <CardContent className="h-full p-0 relative">
                {/* Enhanced book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 shadow-inner"></div>

                {/* Page content */}
                <div className="ml-3 h-full">
                  {isTwoPageView
                    ? renderTwoPageSpread()
                    : currentPage === 0
                    ? renderCoverPage()
                    : renderStoryPage(currentPage)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={!canGoNext}
            className="h-16 w-16 rounded-full shadow-xl bg-white/90 backdrop-blur-sm border-2 border-white/50 hover:bg-white hover:border-purple-300 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Enhanced Page Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50">
            {Array.from(
              { length: Math.ceil(totalPages / (isTwoPageView ? 2 : 1)) },
              (_, i) => {
                const pageIndex = i * (isTwoPageView ? 2 : 1);
                const isActive = isTwoPageView
                  ? Math.floor(currentPage / 2) === i
                  : currentPage === pageIndex;

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageIndex)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-125"
                        : "bg-gray-300 hover:bg-gray-400 hover:scale-110"
                    }`}
                    title={pageIndex === 0 ? "Cover" : `Page ${pageIndex}`}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
