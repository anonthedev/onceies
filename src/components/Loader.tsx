import type React from "react"
import { Sparkles, BookOpen, Wand2 } from "lucide-react"

interface LoaderProps {
  message?: string
  className?: string
}

const Loader: React.FC<LoaderProps> = ({ message = "Loading...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Enhanced animated loader */}
      <div className="relative mb-8">
        {/* Outer spinning ring */}
        <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>

        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Floating icons */}
        <div className="absolute -top-2 -right-2 animate-bounce delay-200">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="absolute -bottom-2 -left-2 animate-bounce delay-500">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Enhanced message */}
      <div className="text-center space-y-2">
        <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {message}
        </span>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  )
}

export default Loader
