"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoryOutline } from "@/types/story";

interface StoryOutlineReviewProps {
  outline: StoryOutline;
  isEditingOutline: boolean;
  updateChapterTitle: (chapterIndex: number, newTitle: string) => void;
  updateChapterSummary: (chapterIndex: number, newSummary: string) => void;
  handleApproveOutline: () => void;
  handleEditOutline: () => void;
  handleSaveOutlineChanges: () => void;
  handleCancelOutlineEdit: () => void;
}

export default function StoryOutlineReview({ outline, isEditingOutline, updateChapterTitle, updateChapterSummary, handleApproveOutline, handleEditOutline, handleSaveOutlineChanges, handleCancelOutlineEdit }: StoryOutlineReviewProps) {
  return (
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
  );
}