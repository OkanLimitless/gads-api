'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, Target, Users, Zap, CheckCircle, Star, TrendingUp, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Advanced Analytics & Reporting",
      description: "Get deep insights into your campaign performance with AI-powered analytics and custom reporting dashboards."
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Smart Campaign Optimization",
      description: "Our AI automatically optimizes your campaigns for better ROI, adjusting bids and targeting in real-time."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Multi-Client Management",
      description: "Manage hundreds of client accounts from one dashboard. Perfect for agencies and marketing teams."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Automated Bid Management",
      description: "Set it and forget it. Our algorithms manage bids 24/7 to maximize your advertising budget efficiency."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Digital Marketing Pro",
      text: "AdGenius Pro increased our client ROI by 340% in just 3 months. The automation features are incredible.",
      rating: 5
    },
    {
      name: "Mike Chen",
      company: "E-commerce Solutions Inc",
      text: "Managing 50+ Google Ads accounts used to take our team weeks. Now it takes hours.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      company: "Growth Marketing Agency",
      text: "The AI-powered optimization has revolutionized how we manage campaigns. Highly recommended!",
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small businesses",
      features: [
        "Up to 5 Google Ads accounts",
        "Basic reporting & analytics",
        "Email support",
        "Campaign optimization",
        "Keyword research tools"
      ]
    },
    {
      name: "Professional",
      price: "$299",
      period: "/month",
      description: "Ideal for agencies & growing businesses",
      features: [
        "Up to 50 Google Ads accounts",
        "Advanced AI optimization",
        "Custom reporting & dashboards",
        "Priority support",
        "White-label options",
        "API access",
        "Team collaboration tools"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$999",
      period: "/month",
      description: "For large agencies & enterprises",
      features: [
        "Unlimited Google Ads accounts",
        "Custom AI models",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "Advanced security features",
        "Training & onboarding"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AdGenius Pro
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
            </nav>
            <div className="flex space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Scale Your Google Ads
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              With AI-Powered Automation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AdGenius Pro helps agencies and businesses manage thousands of Google Ads campaigns with advanced AI optimization, 
            automated bidding, and comprehensive analytics. Increase ROI by up to 340% while saving 80% of your time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8 py-4">
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">340%</div>
              <div className="text-gray-600">Average ROI Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$2.4M+</div>
              <div className="text-gray-600">Ad Spend Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">1,200+</div>
              <div className="text-gray-600">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">80%</div>
              <div className="text-gray-600">Time Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Dominate Google Ads
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines AI-powered automation with professional-grade tools 
              to help you achieve unprecedented campaign performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setActiveFeature(index)}>
                <CardHeader>
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Enterprise Security</h3>
                <p className="text-gray-600">Bank-level encryption and SOC 2 compliance to protect your data.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Clock className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">24/7 Monitoring</h3>
                <p className="text-gray-600">Round-the-clock campaign monitoring and automatic optimization.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <TrendingUp className="h-8 w-8 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Predictive Analytics</h3>
                <p className="text-gray-600">AI-powered forecasting to predict campaign performance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by 1,200+ Marketing Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what our clients say about AdGenius Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Google Ads Performance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 1,200+ marketing professionals who trust AdGenius Pro to scale their campaigns.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
            Start Your 14-Day Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-blue-100 mt-4 text-sm">
            No credit card required • Cancel anytime • 24/7 support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">AdGenius Pro</span>
              </div>
              <p className="text-gray-400">
                The most advanced Google Ads management platform for agencies and businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AdGenius Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}