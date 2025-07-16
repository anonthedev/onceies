"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoryFormData } from "@/types/story";

interface StoryDetailsFormProps {
  formData: StoryFormData;
  handleInputChange: (field: keyof StoryFormData, value: string) => void;
  handleGenerateOutline: (e: React.FormEvent) => void;
  usageLoading: boolean;
  //@ts-expect-error - TODO: Define the type for usageStatus
  usageStatus
}

export default function StoryDetailsForm({ formData, handleInputChange, handleGenerateOutline, usageLoading, usageStatus }: StoryDetailsFormProps) {
  return (
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
  );
}