"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Crown, Sparkles } from "lucide-react"

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out our story creation",
      features: [
        { text: "5 story generations", included: true },
        { text: "Basic story templates", included: true },
        { text: "Standard support", included: true },
        { text: "Unlimited stories", included: false },
        { text: "Priority support", included: false },
        { text: "Early access to features", included: false },
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: "$25",
      period: "lifetime",
      description: "Unlimited creativity for storytellers",
      features: [
        { text: "Unlimited story generations", included: true },
        { text: "All story templates", included: true },
        { text: "Priority support", included: true },
        { text: "Early access to new features", included: true },
        { text: "Custom story themes", included: true },
        { text: "Export to PDF", included: true },
      ],
      buttonText: "Get Pro Access",
      buttonVariant: "default" as const,
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start creating magical stories for free, or unlock unlimited creativity with Pro
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative shadow-lg hover:shadow-xl transition-shadow ${
                plan.popular ? "border-2 border-orange-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-4 py-1 text-sm font-semibold">
                    <Crown className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/ {plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-gray-700" : "text-gray-400"}>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full py-3 text-lg ${
                    plan.popular
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  disabled={plan.name === "Free"}
                >
                  {plan.popular && <Sparkles className="h-5 w-5 mr-2" />}
                  {plan.buttonText}
                </Button>

                {plan.popular && (
                  <p className="text-xs text-gray-500 text-center">
                    One-time payment • No recurring charges • 30-day money-back guarantee
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">What happens after I use my 5 free stories?</h3>
              <p className="text-gray-600">
                You can upgrade to Pro for unlimited story generation, or wait for your monthly limit to reset.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is the Pro plan really lifetime access?</h3>
              <p className="text-gray-600">
                Yes! Pay once and enjoy unlimited story creation forever. No monthly or yearly fees.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my Pro subscription?</h3>
              <p className="text-gray-600">
                There&apos;s no subscription to cancel! Pro is a one-time purchase with lifetime access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
