"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, BookOpen, Plus, Sparkles, PartyPopper } from "lucide-react"

interface StoryCompleteProps {
  handleViewStory: () => void
  handleCreateAnother: () => void
}

export default function StoryComplete({ handleViewStory, handleCreateAnother }: StoryCompleteProps) {
  return (
    <Card className="p-0 m-0 shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      {/* <CardHeader className="py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-full">
              <PartyPopper className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Story Created Successfully!</CardTitle>
          <p className="text-green-100 mt-2">Your magical story is ready to enchant readers!</p>
        </div>
      </CardHeader> */}
      <CardContent className="p-8 space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800">🎉 Congratulations!</h3>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              Your story has been generated with all chapters and is ready to read! Time to dive into your magical
              creation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleViewStory}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="h-6 w-6 mr-3" />
              Read Your Story
            </Button>
            <Button
              onClick={handleCreateAnother}
              variant="outline"
              className="border-2 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-800 hover:bg-purple-50 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-transparent"
            >
              <Plus className="h-6 w-6 mr-3" />
              Create Another Story
            </Button>
          </div>

          {/* Celebration elements */}
          <div className="flex justify-center space-x-4 mt-8">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            <Sparkles className="h-8 w-8 text-pink-500 animate-pulse delay-200" />
            <Sparkles className="h-6 w-6 text-blue-500 animate-pulse delay-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
