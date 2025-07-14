"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StoryData {
  title: string;
  ageGroup: string;
  plot: string;
  characters: string;
}

export default function CreateStory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<StoryData>({
    title: "",
    ageGroup: "",
    plot: "",
    characters: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [storyId, setStoryId] = useState<string>("");

  const handleInputChange = (field: keyof StoryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.ageGroup || !formData.plot || !formData.characters) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      // First, generate the story
      toast.info("Generating your story...");
      const storyResponse = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!storyResponse.ok) {
        throw new Error("Failed to generate story");
      }

      const storyResult = await storyResponse.json();
      setGeneratedStory(storyResult.story);
      setStoryId(storyResult.storyId);

      // Then, generate the cover image and update the story record
      toast.info("Creating your cover image...");
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
        throw new Error("Failed to generate cover image");
      }

      const imageResult = await imageResponse.json();
      setCoverImageUrl(imageResult.imageUrl);

      toast.success("Story and cover image generated successfully!");

    } catch (error) {
      console.error("Error generating story:", error);
      toast.error("Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
    setGeneratedStory("");
    setCoverImageUrl("");
    setStoryId("");
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Story</h1>
            <p className="text-gray-600">Welcome, {session?.user?.email}</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Story Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <Label htmlFor="ageGroup" className="text-sm font-medium">
                    Age Group
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("ageGroup", value)} disabled={isGenerating}>
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
                    disabled={isGenerating}
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
                    disabled={isGenerating}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Creating Your Story..." : "Generate Story & Cover"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {(generatedStory || coverImageUrl) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Your Generated Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {coverImageUrl && (
                  <div className="text-center">
                    <img 
                      src={coverImageUrl} 
                      alt="Story cover" 
                      className="mx-auto rounded-lg shadow-md max-w-sm"
                    />
                  </div>
                )}
                
                {generatedStory && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Story Preview</h3>
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
                      {generatedStory.substring(0, 300)}...
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={handleViewStory}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!storyId}
                  >
                    View Full Story
                  </Button>
                  <Button 
                    onClick={handleCreateAnother}
                    variant="outline"
                  >
                    Create Another Story
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
} 