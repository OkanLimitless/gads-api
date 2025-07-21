import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Target, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const team = [
    {
      name: "Alex Johnson",
      role: "CEO & Founder",
      bio: "Former Google Ads Product Manager with 8+ years of experience in digital advertising optimization.",
      image: "👨‍💼"
    },
    {
      name: "Sarah Chen",
      role: "CTO",
      bio: "AI/ML expert specializing in automated bidding algorithms and campaign optimization systems.",
      image: "👩‍💻"
    },
    {
      name: "Mike Rodriguez",
      role: "Head of Customer Success",
      bio: "Digital marketing veteran helping agencies scale their Google Ads management operations.",
      image: "👨‍🎯"
    }
  ]

  const milestones = [
    {
      year: "2022",
      title: "Company Founded",
      description: "AdGenius Pro was founded to solve the complexity of large-scale Google Ads management."
    },
    {
      year: "2023",
      title: "AI Engine Launch",
      description: "Released our proprietary AI optimization engine, achieving 340% average ROI improvement."
    },
    {
      year: "2024",
      title: "1,000+ Clients",
      description: "Reached over 1,200 active clients managing $2.4M+ in monthly ad spend."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AdGenius Pro
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About AdGenius Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to democratize advanced Google Ads management through AI-powered automation, 
            helping agencies and businesses achieve unprecedented campaign performance at scale.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Target className="h-6 w-6 mr-2" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800">
                To empower marketing professionals with AI-driven tools that automate complex Google Ads management, 
                enabling them to focus on strategy while our technology handles optimization, bidding, and performance monitoring.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <Award className="h-6 w-6 mr-2" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800">
                To become the leading AI-powered Google Ads management platform, trusted by agencies worldwide 
                to deliver exceptional ROI and campaign performance for their clients.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 mb-6">
              AdGenius Pro was born out of frustration with the complexity of managing large-scale Google Ads campaigns. 
              Our founder, Alex Johnson, spent years at Google working on the Ads platform and witnessed firsthand 
              how agencies struggled to efficiently manage hundreds of client accounts.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Traditional Google Ads management required countless hours of manual optimization, bid adjustments, 
              and performance monitoring. Even with Google's automation tools, agencies needed something more sophisticated 
              - a platform that could understand the nuances of different industries, client goals, and market conditions.
            </p>
            <p className="text-lg text-gray-600">
              That's when we decided to build AdGenius Pro - combining advanced AI algorithms with deep Google Ads expertise 
              to create the most powerful campaign management platform for agencies and businesses.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="text-6xl mb-4">{member.image}</div>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription className="text-blue-600 font-semibold">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Company Milestones */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Journey</h2>
          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-8">
                <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold mr-6 flex-shrink-0">
                  {milestone.year}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">AdGenius Pro by the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1,200+</div>
              <div className="text-blue-100">Active Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2.4M+</div>
              <div className="text-blue-100">Monthly Ad Spend</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">340%</div>
              <div className="text-blue-100">Avg ROI Increase</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Client Success</h3>
              <p className="text-gray-600">
                Your success is our success. We're committed to delivering measurable results that grow your business.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously push the boundaries of what's possible with AI and automation in digital advertising.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-gray-600">
                We maintain the highest standards in everything we do, from our technology to our customer support.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Google Ads?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of agencies and businesses using AdGenius Pro to scale their campaigns.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}