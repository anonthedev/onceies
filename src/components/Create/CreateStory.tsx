"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  checkStoryLimit,
  type UsageStatus,
  shouldShowUpgradePrompt,
  shouldShowUsageWarning,
} from "@/lib/usage-tracking"
import UpgradePrompt from "@/components/UpgradePrompt"
import type { StoryFormData, StoryOutline } from "@/types/story"
import StoryDetailsForm from "./StoryDetailsForm"
import StoryOutlineReview from "./StoryOutlineReview"
import GenerationProgressComponent from "./GenerationProgress"
import StoryComplete from "./StoryComplete"
import Loader from "../Loader"

enum CreationStep {
  FORM = "form",
  OUTLINE = "outline",
  GENERATING = "generating",
  COMPLETE = "complete",
}

interface GenerationProgress {
  totalChapters: number
  completedChapters: number
  currentTask: string
}

export default function CreateStory() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    ageGroup: "",
    plot: "",
    characters: "",
  })
  const [currentStep, setCurrentStep] = useState<CreationStep>(CreationStep.FORM)
  const [outline, setOutline] = useState<StoryOutline | null>(null)
  const [isEditingOutline, setIsEditingOutline] = useState(false)
  const [userInputId, setUserInputId] = useState<string>("")
  const [storyId, setStoryId] = useState<string>("")
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    totalChapters: 0,
    completedChapters: 0,
    currentTask: "",
  })

  useEffect(() => {
    const fetchUsageStatus = async () => {
      if (!session?.supabaseAccessToken || !session?.user?.id) {
        setUsageLoading(false)
        return
      }

      try {
        const status = await checkStoryLimit(session.user.id, session.supabaseAccessToken)
        setUsageStatus(status)
      } catch (error) {
        console.error("Error fetching usage status:", error)
        toast.error("Failed to load usage status")
      } finally {
        setUsageLoading(false)
      }
    }

    fetchUsageStatus()
  }, [session])

  if (usageLoading) {
    return <Loader message="Checking usage..." />
  }

  const handleInputChange = (field: keyof StoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const refreshUsageStatus = async () => {
    if (!session?.supabaseAccessToken || !session?.user?.id) return

    try {
      const status = await checkStoryLimit(session.user.id, session.supabaseAccessToken)
      setUsageStatus(status)
    } catch (error) {
      console.error("Error refreshing usage status:", error)
    }
  }

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.ageGroup || !formData.plot || !formData.characters) {
      toast.error("Please fill in all fields")
      return
    }

    setCurrentStep(CreationStep.OUTLINE)

    try {
      toast.info("Generating story outline...")

      const outlineResponse = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!outlineResponse.ok) {
        const errorData = await outlineResponse.json()
        if (outlineResponse.status === 403 && errorData.needsUpgrade) {
          toast.error("You've reached your story generation limit. Please upgrade to continue.")
          setCurrentStep(CreationStep.FORM)
          return
        }
        throw new Error("Failed to generate outline")
      }

      const outlineResult = await outlineResponse.json()
      setOutline(outlineResult.outline)
      setUserInputId(outlineResult.userInputId)
      toast.success("Story outline generated! Please review and approve.")
    } catch (error) {
      console.error("Error generating outline:", error)
      toast.error("Failed to generate outline. Please try again.")
      setCurrentStep(CreationStep.FORM)
    }
  }

  const handleApproveOutline = async () => {
    if (!outline || !userInputId) return

    setCurrentStep(CreationStep.GENERATING)
    setGenerationProgress({
      totalChapters: outline.chapters.length,
      completedChapters: 0,
      currentTask: "Creating story structure...",
    })

    try {
      const storyResponse = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInputId,
          outline,
        }),
      })

      if (!storyResponse.ok) {
        const errorData = await storyResponse.json()
        if (storyResponse.status === 403 && errorData.needsUpgrade) {
          toast.error("You've reached your story generation limit. Please upgrade to continue.")
          setCurrentStep(CreationStep.OUTLINE)
          return
        }
        throw new Error("Failed to create story structure")
      }

      const storyResult = await storyResponse.json()
      setStoryId(storyResult.storyId)

      setGenerationProgress((prev) => ({
        ...prev,
        currentTask: "Generating chapters...",
      }))

      const chapterPromises = storyResult.chapterTasks.map(
        //@ts-expect-error - TODO: fix this
        async (task, index: number) => {
          setGenerationProgress((prev) => ({
            ...prev,
            currentTask: `Generating Chapters...`,
          }))

          const response = await fetch("/api/generate-story/chapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId: storyResult.storyId,
              chapterNumber: task.chapterNumber,
              title: task.title,
              summary: task.summary,
              userInput: task.userInput,
              isLastChapter: index === storyResult.chapterTasks.length - 1,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Failed to generate chapter ${task.chapterNumber}: ${errorData.error}`)
          }

          setGenerationProgress((prev) => ({
            ...prev,
            completedChapters: prev.completedChapters + 1,
          }))

          return response
        },
      )

      await Promise.all(chapterPromises)

      setGenerationProgress((prev) => ({
        ...prev,
        currentTask: "Creating cover image...",
      }))

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
      })

      if (!imageResponse.ok) {
        console.warn("Failed to generate cover image, but story was created successfully")
      }

      toast.success("Story and chapters generated successfully!")
      setCurrentStep(CreationStep.COMPLETE)
      await refreshUsageStatus()
    } catch (error) {
      console.error("Error generating story:", error)
      toast.error("Failed to generate story. Please try again.")
      setCurrentStep(CreationStep.OUTLINE)
    }
  }

  const handleEditOutline = () => {
    setIsEditingOutline(true)
  }

  const handleSaveOutlineChanges = () => {
    setIsEditingOutline(false)
    toast.success("Outline updated successfully!")
  }

  const handleCancelOutlineEdit = () => {
    setIsEditingOutline(false)
  }

  const updateChapterTitle = (chapterIndex: number, newTitle: string) => {
    if (!outline) return

    const updatedChapters = [...outline.chapters]
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      title: newTitle,
    }

    setOutline({
      ...outline,
      chapters: updatedChapters,
    })
  }

  const updateChapterSummary = (chapterIndex: number, newSummary: string) => {
    if (!outline) return

    const updatedChapters = [...outline.chapters]
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      summary: newSummary,
    }

    setOutline({
      ...outline,
      chapters: updatedChapters,
    })
  }

  const handleViewStory = () => {
    if (storyId) {
      router.push(`/dashboard/${storyId}`)
    }
  }

  const handleCreateAnother = () => {
    setFormData({
      title: "",
      ageGroup: "",
      plot: "",
      characters: "",
    })
    setCurrentStep(CreationStep.FORM)
    setOutline(null)
    setIsEditingOutline(false)
    setUserInputId("")
    setStoryId("")
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Story</h1>
            <p className="text-gray-600">Transform your ideas into magical children&apos;s stories</p>
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
            <StoryDetailsForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerateOutline={handleGenerateOutline}
              usageLoading={usageLoading}
              usageStatus={usageStatus}
            />
          )}

          {currentStep === CreationStep.OUTLINE && !outline && (
            <div className="flex justify-center items-center h-full">
              <Loader message="Generating story outline..." />
            </div>
          )}

          {currentStep === CreationStep.OUTLINE && outline && (
            <StoryOutlineReview
              outline={outline}
              isEditingOutline={isEditingOutline}
              updateChapterTitle={updateChapterTitle}
              updateChapterSummary={updateChapterSummary}
              handleApproveOutline={handleApproveOutline}
              handleEditOutline={handleEditOutline}
              handleSaveOutlineChanges={handleSaveOutlineChanges}
              handleCancelOutlineEdit={handleCancelOutlineEdit}
            />
          )}

          {currentStep === CreationStep.GENERATING && (
            <GenerationProgressComponent generationProgress={generationProgress} />
          )}

          {currentStep === CreationStep.COMPLETE && storyId && (
            <StoryComplete handleViewStory={handleViewStory} handleCreateAnother={handleCreateAnother} />
          )}
        </div>
      </div>
    </>
  )
}
