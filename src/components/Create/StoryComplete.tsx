"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StoryCompleteProps {
  handleViewStory: () => void;
  handleCreateAnother: () => void;
}

export default function StoryComplete({ handleViewStory, handleCreateAnother }: StoryCompleteProps) {
  return (
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
  );
}
