"use client"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StoryFormData } from "@/types/story"
import { Sparkles, Users, Lightbulb } from "lucide-react"

interface StoryDetailsFormProps {
  formData: StoryFormData
  handleInputChange: (field: keyof StoryFormData, value: string) => void
  handleGenerateOutline: (e: React.FormEvent) => void
  usageLoading: boolean
  //@ts-expect-error - TODO: Define the type for usageStatus
  usageStatus
}

export default function StoryDetailsForm({
  formData,
  handleInputChange,
  handleGenerateOutline,
  usageLoading,
  usageStatus,
}: StoryDetailsFormProps) {
  return (
    <Card className="p-0 m-0 shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      {/* <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center space-x-3">
            <BookOpen className="h-8 w-8" />
            <span>Story Details</span>
          </CardTitle>
          <p className="text-center text-purple-100 mt-2">Tell us about your magical story idea</p>
        </div>
      </CardHeader> */}
      <CardContent className="p-8">
        <form onSubmit={handleGenerateOutline} className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>Story Title</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter a magical title for your story..."
              className="h-12 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-purple-50 to-pink-50"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="ageGroup" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Age Group</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange("ageGroup", value)}>
              <SelectTrigger className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <SelectValue placeholder="Select age group for your story..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0-2" className="text-lg py-3">
                  <div className="flex items-center space-x-2">
                    <span>👶</span>
                    <span>0-2 years (Toddlers)</span>
                  </div>
                </SelectItem>
                <SelectItem value="3-5" className="text-lg py-3">
                  <div className="flex items-center space-x-2">
                    <span>🧒</span>
                    <span>3-5 years (Preschoolers)</span>
                  </div>
                </SelectItem>
                <SelectItem value="6-8" className="text-lg py-3">
                  <div className="flex items-center space-x-2">
                    <span>👦</span>
                    <span>6-8 years (Early Elementary)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="characters" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span>Main Characters</span>
            </Label>
            <Input
              id="characters"
              value={formData.characters}
              onChange={(e) => handleInputChange("characters", e.target.value)}
              placeholder="e.g., A brave little mouse, A friendly dragon..."
              className="h-12 text-lg border-2 border-green-200 focus:border-green-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-50"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="plot" className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Story Plot</span>
            </Label>
            <Textarea
              id="plot"
              value={formData.plot}
              onChange={(e) => handleInputChange("plot", e.target.value)}
              placeholder="Describe the adventure, lesson, or journey you want the story to explore..."
              className="min-h-32 text-lg border-2 border-yellow-200 focus:border-yellow-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-yellow-50 to-orange-50 resize-none"
              rows={4}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              disabled={usageLoading || (usageStatus ? !usageStatus.canGenerate : false)}
            >
              {usageLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : usageStatus && !usageStatus.canGenerate ? (
                "Upgrade to Generate Stories"
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Story Outline</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
