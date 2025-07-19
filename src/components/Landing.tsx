"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Sparkles, Users, Clock, Star, ArrowRight, Check, Wand2, Heart, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function Landing() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  const features = [
    {
      icon: Wand2,
      title: "AI-Powered Stories",
      description: "Our advanced AI creates unique, engaging stories tailored to your child's interests and age group.",
    },
    {
      icon: Heart,
      title: "Age-Appropriate Content",
      description:
        "Stories are carefully crafted for different age groups, ensuring content is always suitable and engaging.",
    },
    {
      icon: Sparkles,
      title: "Beautiful Illustrations",
      description: "Every story comes with stunning AI-generated cover art that brings your tale to life.",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description: "Create complete stories in minutes, not hours. Perfect for bedtime or anytime storytelling.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Parent of 2",
      content:
        "My kids love the personalized stories! It's amazing how the AI creates tales that perfectly match their interests.",
      rating: 5,
    },
    {
      name: "Mike R.",
      role: "Teacher",
      content:
        "I use Onceies in my classroom to create custom stories for different reading levels. The kids are always excited!",
      rating: 5,
    },
    {
      name: "Emma L.",
      role: "Grandmother",
      content:
        "Creating stories for my grandchildren has never been easier. They ask for 'Grandma's special stories' every visit!",
      rating: 5,
    },
  ]

  const steps = [
    {
      step: "1",
      title: "Describe Your Story",
      description: "Tell us about the characters, plot, and age group for your story.",
    },
    {
      step: "2",
      title: "AI Creates Magic",
      description: "Our AI generates a complete story with chapters and beautiful cover art.",
    },
    {
      step: "3",
      title: "Read & Enjoy",
      description: "Share your personalized story with your children and watch their faces light up!",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-200">
              <Sparkles className="h-4 w-4 mr-1" />
              AI-Powered Story Creation
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Create Magical Stories
              <br />
              <span className="text-orange-600">In Minutes</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your ideas into beautiful, personalized children's stories with our AI-powered platform. Perfect
              for parents, teachers, and anyone who loves storytelling.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
                onClick={handleGetStarted}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Start Creating Stories
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg bg-transparent"
                onClick={() => router.push("/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Creating personalized stories has never been easier. Just follow these simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="relative bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Onceies?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with storytelling expertise to create unforgettable experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="bg-white hover:shadow-lg transition-shadow border-orange-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Parents Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of happy families who are creating magical moments with personalized stories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade when you're ready for unlimited creativity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white border-2 border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">$0</div>
                <p className="text-gray-600 mb-6">Perfect for trying out our platform</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>5 story generations</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Basic templates</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Standard images</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 bg-transparent"
                  onClick={handleGetStarted}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white transform scale-105 hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <Badge className="mb-4 bg-white text-orange-600">Most Popular</Badge>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-4">$25</div>
                <p className="opacity-90 mb-6">Lifetime access to unlimited stories</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Unlimited stories</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Premium templates</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>High-quality images</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button
                  variant="secondary"
                  className="w-full bg-white text-orange-600 hover:bg-gray-100"
                  onClick={() => router.push("/pricing")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Pro Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Your First Story?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of parents, teachers, and storytellers who are already creating magical moments with Onceies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg"
              onClick={handleGetStarted}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Start Creating Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent px-8 py-4 text-lg"
              onClick={() => router.push("/pricing")}
            >
              View All Features
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Onceies</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Creating magical, personalized stories for children using the power of AI. Making storytelling
                accessible to everyone.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Onceies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
