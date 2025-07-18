"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, BookOpen, Sparkles } from "lucide-react";
import { UsageStatus } from "@/lib/usage-tracking";

interface PlanStatusProps {
  usage: UsageStatus;
  variant?: "card" | "badge" | "inline";
  className?: string;
}

export default function PlanStatus({ 
  usage, 
  variant = "card", 
  className = "" 
}: PlanStatusProps) {
  
  if (variant === "badge") {
    return (
      <Badge 
        variant={usage.plan === 'pro' ? 'default' : 'secondary'} 
        className={`${usage.plan === 'pro' 
          ? 'bg-purple-600 text-white hover:bg-purple-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
      >
        {usage.plan === 'pro' ? (
          <>
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </>
        ) : (
          <>
            <BookOpen className="h-3 w-3 mr-1" />
            Free
          </>
        )}
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge 
          variant={usage.plan === 'pro' ? 'default' : 'secondary'} 
          className={usage.plan === 'pro' 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-100 text-gray-700'
          }
        >
          {usage.plan === 'pro' ? (
            <>
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </>
          ) : (
            <>
              <BookOpen className="h-3 w-3 mr-1" />
              Free
            </>
          )}
        </Badge>
        <span className="text-sm text-gray-600">
          {usage.plan === 'pro' 
            ? `${usage.storyCount} stories generated` 
            : `${usage.remaining} stories remaining`
          }
        </span>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={`${className} m-0 p-0`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {usage.plan === 'pro' ? (
              <Crown className="h-5 w-5 text-purple-600" />
            ) : (
              <BookOpen className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-semibold text-gray-900">
              {usage.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </span>
          </div>
          <Badge 
            variant={usage.plan === 'pro' ? 'default' : 'secondary'}
            className={usage.plan === 'pro' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700'
            }
          >
            {usage.plan === 'pro' ? 'Unlimited' : `${usage.remaining} left`}
          </Badge>
        </div>

        {usage.plan === 'pro' ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">
                {usage.storyCount} stories generated
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Unlimited story generation
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stories used</span>
                <span className="font-medium">{usage.storyCount}/5</span>
              </div>
              <Progress 
                value={(usage.storyCount / 5) * 100} 
                className="h-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                usage.canGenerate ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {usage.canGenerate 
                  ? `${usage.remaining} stories remaining` 
                  : 'Story limit reached'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 