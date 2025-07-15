"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { checkStoryLimit, UsageStatus, shouldShowUpgradePrompt, shouldShowUsageWarning } from "@/lib/usage-tracking";
import UpgradePrompt from "@/components/UpgradePrompt";
import { StoryFormData, StoryOutline } from "@/types/story";

enum CreationStep {
  FORM = "form",
  OUTLINE = "outline", 
  GENERATING = "generating",
  COMPLETE = "complete"
}

interface GenerationProgress {
  totalChapters: number;
  completedChapters: number;
  currentTask: string;
}

export default function CreateStory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    ageGroup: "",
    plot: "",
    characters: "",
  });
  const [currentStep, setCurrentStep] = useState<CreationStep>(CreationStep.FORM);
  const [outline, setOutline] = useState<StoryOutline | null>(null);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [userInputId, setUserInputId] = useState<string>("");
  const [storyId, setStoryId] = useState<string>("");
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    totalChapters: 0,
    completedChapters: 0,
    currentTask: ""
  });

  useEffect(() => {
    const fetchUsageStatus = async () => {
      if (!session?.supabaseAccessToken || !session?.user?.id) {
        setUsageLoading(false);
        return;
      }

      try {
        const status = await checkStoryLimit(session.user.id, session.supabaseAccessToken);
        setUsageStatus(status);
      } catch (error) {
        console.error('Error fetching usage status:', error);
        toast.error('Failed to load usage status');
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsageStatus();
  }, [session]);

  const handleInputChange = (field: keyof StoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const refreshUsageStatus = async () => {
    if (!session?.supabaseAccessToken || !session?.user?.id) return;

    try {
      const status = await checkStoryLimit(session.user.id, session.supabaseAccessToken);
      setUsageStatus(status);
    } catch (error) {
      console.error('Error refreshing usage status:', error);
    }
  };

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.ageGroup || !formData.plot || !formData.characters) {
      toast.error("Please fill in all fields");
      return;
    }

    setCurrentStep(CreationStep.OUTLINE);
    
    try {
      toast.info("Generating story outline...");
      
      const outlineResponse = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!outlineResponse.ok) {
        const errorData = await outlineResponse.json();
        if (outlineResponse.status === 403 && errorData.needsUpgrade) {
          toast.error("You've reached your story generation limit. Please upgrade to continue.");
          setCurrentStep(CreationStep.FORM);
          return;
        }
        throw new Error("Failed to generate outline");
      }

      const outlineResult = await outlineResponse.json();
      setOutline(outlineResult.outline);
      setUserInputId(outlineResult.userInputId);
      toast.success("Story outline generated! Please review and approve.");

    } catch (error) {
      console.error("Error generating outline:", error);
      toast.error("Failed to generate outline. Please try again.");
      setCurrentStep(CreationStep.FORM);
    }
  };

  const handleApproveOutline = async () => {
    if (!outline || !userInputId) return;

    setCurrentStep(CreationStep.GENERATING);
    setGenerationProgress({
      totalChapters: outline.chapters.length,
      completedChapters: 0,
      currentTask: "Creating story structure..."
    });
    
    try {
      // First, create the story record and get chapter tasks
      const storyResponse = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInputId,
          outline
        }),
      });

      if (!storyResponse.ok) {
        const errorData = await storyResponse.json();
        if (storyResponse.status === 403 && errorData.needsUpgrade) {
          toast.error("You've reached your story generation limit. Please upgrade to continue.");
          setCurrentStep(CreationStep.OUTLINE);
          return;
        }
        throw new Error("Failed to create story structure");
      }

      const storyResult = await storyResponse.json();
      setStoryId(storyResult.storyId);

      // Generate chapters with progress tracking
      setGenerationProgress(prev => ({
        ...prev,
        currentTask: "Generating chapters..."
      }));

      // Generate chapters in parallel but with progress tracking
      const chapterPromises = storyResult.chapterTasks.map(async (task: any, index: number) => {
        setGenerationProgress(prev => ({
          ...prev,
          currentTask: `Generating Chapter ${task.chapterNumber}: ${task.title}`
        }));

        const response = await fetch("/api/generate-story/chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: storyResult.storyId,
            chapterNumber: task.chapterNumber,
            title: task.title,
            summary: task.summary,
            userInput: task.userInput,
            isLastChapter: index === storyResult.chapterTasks.length - 1
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate chapter ${task.chapterNumber}: ${errorData.error}`);
        }

        // Update progress
        setGenerationProgress(prev => ({
          ...prev,
          completedChapters: prev.completedChapters + 1
        }));

        return response;
      });

      // Wait for all chapters to be generated
      await Promise.all(chapterPromises);

      // Generate cover image
      setGenerationProgress(prev => ({
        ...prev,
        currentTask: "Creating cover image..."
      }));

      const imageResponse = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          ageGroup: formData.ageGroup,
          characters: formData.characters,
          plot: formData.plot,
          storyId: storyResult.storyId,
        }),
      });

      if (!imageResponse.ok) {
        console.warn("Failed to generate cover image, but story was created successfully");
      }

      toast.success("Story and chapters generated successfully!");
      setCurrentStep(CreationStep.COMPLETE);

      // Refresh usage status after successful generation
      await refreshUsageStatus();

    } catch (error) {
      console.error("Error generating story:", error);
      toast.error("Failed to generate story. Please try again.");
      setCurrentStep(CreationStep.OUTLINE);
    }
  };

  const handleEditOutline = () => {
    setIsEditingOutline(true);
  };

  const handleSaveOutlineChanges = () => {
    setIsEditingOutline(false);
    toast.success("Outline updated successfully!");
  };

  const handleCancelOutlineEdit = () => {
    setIsEditingOutline(false);
    // Reset outline to original state by re-fetching if needed
  };

  const updateChapterTitle = (chapterIndex: number, newTitle: string) => {
    if (!outline) return;
    
    const updatedChapters = [...outline.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      title: newTitle
    };
    
    setOutline({
      ...outline,
      chapters: updatedChapters
    });
  };

  const updateChapterSummary = (chapterIndex: number, newSummary: string) => {
    if (!outline) return;
    
    const updatedChapters = [...outline.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      summary: newSummary
    };
    
    setOutline({
      ...outline,
      chapters: updatedChapters
    });
  };

  const handleViewStory = () => {
    if (storyId) {
      router.push(`/dashboard/${storyId}`);
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      title: "",
      ageGroup: "",
      plot: "",
      characters: "",
    });
    setCurrentStep(CreationStep.FORM);
    setOutline(null);
    setIsEditingOutline(false);
    setUserInputId("");
    setStoryId("");
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Story</h1>
            {/* <p className="text-gray-600">Welcome, {session?.user?.name}</p> */}
          </div>

          {usageStatus && shouldShowUpgradePrompt(usageStatus) && (
            <div className="flex justify-center">
              <UpgradePrompt variant="inline" className="max-w-2xl" />
            </div>
          )}

          {usageStatus && shouldShowUsageWarning(usageStatus) && !shouldShowUpgradePrompt(usageStatus) && (
            <div className="flex justify-center">
              <UpgradePrompt variant="banner" className="max-w-2xl" />
            </div>
          )}

          {currentStep === CreationStep.FORM && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Story Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateOutline} className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Story Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter a magical title for your story"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ageGroup" className="text-sm font-medium">
                      Age Group
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("ageGroup", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0-2 years (Toddlers)</SelectItem>
                        <SelectItem value="3-5">3-5 years (Preschoolers)</SelectItem>
                        <SelectItem value="6-8">6-8 years (Early Elementary)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="characters" className="text-sm font-medium">
                      Main Characters
                    </Label>
                    <Input
                      id="characters"
                      value={formData.characters}
                      onChange={(e) => handleInputChange("characters", e.target.value)}
                      placeholder="e.g., A brave little mouse, A friendly dragon"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="plot" className="text-sm font-medium">
                      Story Plot
                    </Label>
                    <Textarea
                      id="plot"
                      value={formData.plot}
                      onChange={(e) => handleInputChange("plot", e.target.value)}
                      placeholder="Describe the adventure, lesson, or journey you want the story to explore..."
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={usageLoading || (usageStatus ? !usageStatus.canGenerate : false)}
                  >
                    {usageLoading ? "Loading..." :
                     (usageStatus && !usageStatus.canGenerate) ? "Upgrade to Generate Stories" : 
                     "Generate Story Outline"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {currentStep === CreationStep.OUTLINE && outline && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Story Outline</CardTitle>
                <p className="text-center text-gray-600">
                  {isEditingOutline ? "Edit your story outline" : "Review your story outline and approve to continue"}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">{outline.title}</h3>
                  <div className="space-y-4">
                    {outline.chapters.map((chapter, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4">
                        {isEditingOutline ? (
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`chapter-title-${index}`} className="text-sm font-medium text-purple-700">
                                Chapter {chapter.chapter_number} Title
                              </Label>
                              <Input
                                id={`chapter-title-${index}`}
                                value={chapter.title}
                                onChange={(e) => updateChapterTitle(index, e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`chapter-summary-${index}`} className="text-sm font-medium text-purple-700">
                                Chapter Summary
                              </Label>
                              <Textarea
                                id={`chapter-summary-${index}`}
                                value={chapter.summary}
                                onChange={(e) => updateChapterSummary(index, e.target.value)}
                                className="mt-1 min-h-20"
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-medium text-purple-700">
                              Chapter {chapter.chapter_number}: {chapter.title}
                            </h4>
                            <p className="text-gray-700 text-sm mt-1">{chapter.summary}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  {isEditingOutline ? (
                    <>
                      <Button 
                        onClick={handleSaveOutlineChanges}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={handleCancelOutlineEdit}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleApproveOutline}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve & Generate Full Story
                      </Button>
                      <Button 
                        onClick={handleEditOutline}
                        variant="outline"
                      >
                        Edit Outline
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === CreationStep.GENERATING && (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Story</h3>
                <p className="text-gray-600 mb-4">{generationProgress.currentTask}</p>
                
                {generationProgress.totalChapters > 0 && (
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Chapters Progress</span>
                      <span>{generationProgress.completedChapters}/{generationProgress.totalChapters}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ 
                          width: `${(generationProgress.completedChapters / generationProgress.totalChapters) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === CreationStep.COMPLETE && storyId && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-green-600">Story Created Successfully!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-6">Your story has been generated with all chapters and is ready to read!</p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handleViewStory}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Read Your Story
                    </Button>
                    <Button 
                      onClick={handleCreateAnother}
                      variant="outline"
                    >
                      Create Another Story
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
} 