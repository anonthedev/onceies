"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";
import { checkStoryLimit, UsageStatus, shouldShowUpgradePrompt, shouldShowUsageWarning } from "@/lib/usage-tracking";
import UpgradePrompt from "./UpgradePrompt";
import { StoryWithChapters } from "@/types/story";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<StoryWithChapters[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    if (session?.supabaseAccessToken) {
      fetchUserStories();
      fetchUsageStatus();
    }
  }, [session]);

  const fetchUserStories = async () => {
    try {
      if (!session?.supabaseAccessToken) return;

      const supabase = supabaseClient(session.supabaseAccessToken);
      
      // Fetch stories with their chapters
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, cover_image, created_at, user_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        toast.error('Failed to load stories');
        return;
      }

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        return;
      }

      // Fetch chapters for each story
      const storiesWithChapters: StoryWithChapters[] = [];
      
      for (const story of storiesData) {
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('story_id', story.id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) {
          console.error('Error fetching chapters:', chaptersError);
          continue;
        }
        
        storiesWithChapters.push({
          ...story,
          chapters: chaptersData || []
        });
      }

      setStories(storiesWithChapters);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStatus = async () => {
    try {
      if (!session?.supabaseAccessToken || !session?.user?.id) return;

      const status = await checkStoryLimit(session.user.id, session.supabaseAccessToken);
      setUsageStatus(status);
    } catch (error) {
      console.error('Error fetching usage status:', error);
      toast.error('Failed to load usage status');
    } finally {
      setUsageLoading(false);
    }
  };

  const handleStoryClick = (storyId: string) => {
    router.push(`/dashboard/${storyId}`);
  };

  const handleCreateNew = () => {
    router.push('/create');
  };

  if (loading || usageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your stories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Story Library</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>

          {/* {usageStatus && (
            <div className="flex justify-center">
              <PlanStatus usage={usageStatus} variant="card" className="max-w-sm" />
            </div>
          )} */}

          {usageStatus && shouldShowUpgradePrompt(usageStatus) && (
            <div className="flex justify-center">
              <UpgradePrompt variant="inline" className="max-w-2xl" />
            </div>
          )}

          {/* Usage Warning for users close to limit */}
          {usageStatus && shouldShowUsageWarning(usageStatus) && !shouldShowUpgradePrompt(usageStatus) && (
            <div className="flex justify-center">
              <UpgradePrompt variant="banner" className="max-w-2xl" />
            </div>
          )}

          {/* <div className="flex justify-center">
            <Button 
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
              disabled={usageStatus ? !usageStatus.canGenerate : false}
            >
              {usageStatus && !usageStatus.canGenerate ? 'Upgrade to Create Stories' : 'Create New Story'}
            </Button>
          </div> */}

          {stories.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h3>
                <p className="text-gray-600 mb-6">Create your first magical story to get started!</p>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Create Your First Story
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stories.map((story) => {
                const storyTitle = story.chapters.length > 0 ? 
                  story.chapters[0].title.replace(/^Chapter \d+:\s*/, '') : 
                  'Untitled Story';
                
                return (
                  <Card 
                    key={story.id} 
                    className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => handleStoryClick(story.id)}
                  >
                    <CardContent className="">
                      <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                        {story.cover_image ? (
                          <img 
                            src={story.cover_image} 
                            alt={storyTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {storyTitle}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Chapters: {story.chapters.length}</p>
                        {story.chapters.length > 0 && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {story.chapters[0].content.substring(0, 80)}...
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created: {new Date(story.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
