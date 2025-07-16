"use client";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "../Loader";

interface GenerationProgressProps {
  generationProgress: {
    totalChapters: number;
    completedChapters: number;
    currentTask: string;
  };
}

export default function GenerationProgress({ generationProgress }: GenerationProgressProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="text-center py-12">
        <Loader message={generationProgress.currentTask || "Generating..."} />
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
  );
}