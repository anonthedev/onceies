"use client"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { StoryFormData } from "@/types/story"
import { Sparkles, Users, Lightbulb } from "lucide-react"

// Zod schema for form validation
const storyFormSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(35, "Title must be no more than 35 characters"),
  ageGroup: z.string().min(1, "Please select an age group"),
  characters: z.string()
    .min(1, "Please enter at least one character")
    .max(50, "Characters description must be no more than 50 characters")
    .refine((val) => {
      const characterList = val.split(',').map(c => c.trim()).filter(c => c.length > 0)
      return characterList.length <= 3
    }, "You can have a maximum of 3 main characters"),
  plot: z.string()
    .min(100, "Plot description must be at least 100 characters")
    .max(1000, "Plot description must be no more than 1000 characters"),
})

type StoryFormValues = z.infer<typeof storyFormSchema>

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
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: formData.title,
      ageGroup: formData.ageGroup,
      characters: formData.characters,
      plot: formData.plot,
    },
  })

  const onSubmit = (data: StoryFormValues) => {
    // Update the parent component's form data
    Object.entries(data).forEach(([key, value]) => {
      handleInputChange(key as keyof StoryFormData, value)
    })
    
    // Create a synthetic event for the existing handler
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent
    
    handleGenerateOutline(syntheticEvent)
  }

  return (
    <Card className="p-0 m-0 shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span>Story Title</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter a magical title for your story..."
                      className="h-12 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-purple-50 to-pink-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>Age Group</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                        <SelectValue placeholder="Select age group for your story..." />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="characters"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <span>Main Characters</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., A brave little mouse, A friendly dragon..."
                      className="h-12 text-lg border-2 border-green-200 focus:border-green-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plot"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span>Story Plot</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the adventure, lesson, or journey you want the story to explore..."
                      className="min-h-32 text-lg border-2 border-yellow-200 focus:border-yellow-500 rounded-xl transition-all duration-300 bg-gradient-to-r from-yellow-50 to-orange-50 resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </CardContent>
    </Card>
  )
}
