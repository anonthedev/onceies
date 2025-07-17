"use client"
import { Card, CardContent } from "@/components/ui/card"
import Loader from "../Loader"
import { Sparkles, BookOpen, Wand2 } from "lucide-react"

interface GenerationProgressProps {
  generationProgress: {
    totalChapters: number
    completedChapters: number
    currentTask: string
  }
}

export default function GenerationProgress({ generationProgress }: GenerationProgressProps) {
  const progressPercentage =
    generationProgress.totalChapters > 0
      ? (generationProgress.completedChapters / generationProgress.totalChapters) * 100
      : 0

  return (
    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="text-center py-16 px-8">
        {/* Animated icons */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg animate-bounce">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full shadow-lg animate-bounce delay-200">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full shadow-lg animate-bounce delay-400">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>

        <Loader message={generationProgress.currentTask || "Generating..."} />

        {generationProgress.totalChapters > 0 && (
          <div className="max-w-md mx-auto mt-8 space-y-4">
            <div className="flex justify-between text-lg font-semibold text-gray-700">
              <span>Chapters Progress</span>
              <span className="text-purple-600">
                {generationProgress.completedChapters}/{generationProgress.totalChapters}
              </span>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {/* Chapter indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: generationProgress.totalChapters }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i < generationProgress.completedChapters
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"
                      : i === generationProgress.completedChapters
                        ? "bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse shadow-lg"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
