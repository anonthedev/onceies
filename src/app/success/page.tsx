"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { getUserPlanDetails, PlanDetails } from "@/lib/usage-tracking";
import { toast } from "sonner";

function SuccessPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionRetryCount, setSessionRetryCount] = useState(0);

  const hasCustomerSessionToken = searchParams.get('customer_session_token');

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (status === 'loading') {
        return;
      }

      if (!session?.user?.id && hasCustomerSessionToken && sessionRetryCount < 3) {
        console.log(`Waiting for session to load, retry ${sessionRetryCount + 1}/3...`);
        setSessionRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchPlanDetails();
        }, 2000);
        return;
      }

      if (!session?.user?.id) {
        setError("Please sign in to continue");
        setLoading(false);
        return;
      }

      try {
        if (!session?.supabaseAccessToken) {
          console.log("No supabase token, fetching via API...");
          const response = await fetch('/api/user/plan');
          if (response.ok) {
            const details = await response.json();
            setPlanDetails(details);
            
            if (details.plan === 'pro') {
              toast.success("Welcome to Pro! You now have unlimited story generation.");
            }
          } else {
            throw new Error('Failed to fetch plan details');
          }
        } else {
          const details = await getUserPlanDetails(session.user.id, session.supabaseAccessToken);
          setPlanDetails(details);
          
          if (details.plan === 'pro') {
            toast.success("Welcome to Pro! You now have unlimited story generation.");
          }
        }
      } catch (err) {
        console.error("Error fetching plan details:", err);
        setError("Failed to load plan details");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [session, status, hasCustomerSessionToken, sessionRetryCount]);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleCreateStory = () => {
    router.push("/create");
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {hasCustomerSessionToken ? "Processing your payment..." : "Loading your account details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome to the Pro experience
          </p>
        </div>

        {/* Plan Status Card */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle className="text-2xl text-gray-900">
                    Pro Plan Active
                  </CardTitle>
                  <p className="text-gray-600">
                    {planDetails?.upgradedAt && (
                      `Upgraded on ${new Date(planDetails.upgradedAt).toLocaleDateString()}`
                    )}
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-600 text-white">
                Unlimited
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  What&apos;s Included:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Unlimited story generation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">No daily limits</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Early access to new features</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Your Stats:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <span className="text-gray-700">
                      {planDetails?.storyCount || 0} stories created
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="text-gray-700">
                      Unlimited stories remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleCreateStory}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Create Your First Pro Story
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            onClick={handleContinue}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-3 text-lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            View Your Library
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            Thank you for upgrading to Pro! Questions? Contact our support team.
          </p>
          <p>
            Receipt and invoice have been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
} 