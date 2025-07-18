"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, BookOpen, Infinity, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out our story creation",
    features: [
      "5 story generations",
      "Export as PDF only",
    ],
    limitations: ["Limited to 5 stories total"],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$25",
    period: "lifetime",
    description: "Unlimited storytelling for creative minds",
    features: [
      "Unlimited story generations",
      "Export in multiple formats (coming soon).",
    ],
    limitations: [],
    buttonText: "Get Pro Access",
    buttonVariant: "default" as const,
    popular: true,
  },
]

const faqs = [
  {
    question: "What happens after I use my 5 free stories?",
    answer:
      "Once you've used your 5 free story generations, you'll need to upgrade to Pro for unlimited access. Your existing stories will always remain accessible.",
  },
  {
    question: "Is the Pro plan really lifetime access?",
    answer: "Yes! Pay once and get unlimited story generations forever. No monthly fees, no hidden costs.",
  },
  {
    question: "Can I export my stories?",
    answer:
      "Yes, both Free and Pro users can export their stories.",
  },
]

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID;

      if (!productId) {
        toast.error("Product configuration error. Please contact support.");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkoutUrl } = await response.json();

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start upgrade process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-orange-600 mr-2" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Simple Pricing</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your storytelling journey. Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular ? "ring-2 ring-orange-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  variant={plan.buttonVariant}
                  onClick={plan.popular ? handleUpgrade : undefined}
                  disabled={isLoading}
                  className={`w-full mb-6 py-3 ${
                    plan.popular
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "border-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {isLoading && plan.popular ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.popular && <Sparkles className="h-4 w-4 mr-2" />}
                      {plan.buttonText}
                    </>
                  )}
                </Button>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    What&apos;s included:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-2">Limitations:</h4>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-sm text-gray-500">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 text-gray-700">Story Generations</td>
                  <td className="py-3 px-4 text-center">5 total</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <Infinity className="h-4 w-4 text-orange-600" />
                      <span className="ml-1">Unlimited</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Story Templates</td>
                  <td className="py-3 px-4 text-center">Basic</td>
                  <td className="py-3 px-4 text-center">Premium</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Image Quality</td>
                  <td className="py-3 px-4 text-center">Standard</td>
                  <td className="py-3 px-4 text-center">High Quality</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Export Formats</td>
                  <td className="py-3 px-4 text-center">Text</td>
                  <td className="py-3 px-4 text-center">Multiple</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Support</td>
                  <td className="py-3 px-4 text-center">Community</td>
                  <td className="py-3 px-4 text-center">Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Creating?</h2>
              <p className="mb-6 opacity-90">
                Join thousands of storytellers who are already creating amazing stories with our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                  Start Free Trial
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                  View Examples
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
