"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Crown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpgradePromptProps {
  variant?: "modal" | "inline" | "banner";
  onUpgrade?: () => void;
  className?: string;
}

export default function UpgradePrompt({ 
  variant = "modal", 
  onUpgrade,
  className = "" 
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // You'll need to set your actual Polar product ID here
      const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID;
      
      if (!productId) {
        toast.error("Product configuration error. Please contact support.");
        return;
      }

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Polar checkout
      window.location.href = checkoutUrl;
      
      if (onUpgrade) {
        onUpgrade();
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error("Failed to start upgrade process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited story generation",
    "No daily limits",
    "Priority support",
    "Early access to new features"
  ];

  if (variant === "banner") {
    return (
      <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
        <Crown className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium text-orange-800">
              You've reached your story limit!
            </span>
            <span className="text-orange-700 ml-2">
              Upgrade to Pro for unlimited stories.
            </span>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white ml-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Upgrade Now"
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`shadow-lg border-2 border-purple-200 ${className}`}>
      <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-center mb-2">
          <Crown className="h-8 w-8 text-purple-600 mr-2" />
          <Badge variant="secondary" className="bg-purple-600 text-white">
            Pro Plan
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Unlock Unlimited Stories
        </CardTitle>
        <p className="text-gray-600 mt-2">
          You've reached your free story limit. Upgrade to continue creating amazing stories!
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-purple-600">$25</span>
            <span className="text-gray-600 ml-2">one-time payment</span>
          </div>
          <p className="text-sm text-gray-500">No recurring charges, lifetime access</p>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Upgrade to Pro
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Polar • 30-day money-back guarantee
        </p>
      </CardContent>
    </Card>
  );
} 