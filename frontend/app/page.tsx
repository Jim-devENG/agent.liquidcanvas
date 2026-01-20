'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Globe, Users, Zap, Shield, BarChart3, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      const outreachType = typeof window !== 'undefined' ? localStorage.getItem('outreach_type') : null
      if (outreachType === 'social') {
        router.push('/socials')
      } else {
        router.push('/dashboard')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-olive-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-olive-600 to-olive-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-white text-3xl font-bold">LC</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-olive-700 to-olive-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              Liquid Canvas
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-semibold">
              Outreach Studio
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover prospects, automate outreach, and scale your business with intelligent automation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-olive-600 to-olive-700 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 font-semibold text-lg flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://liquidcanvas.art"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 glass border-2 border-olive-500 text-olive-700 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold text-lg"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshot Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Dashboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your outreach campaigns in one place
            </p>
          </div>
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-white/50">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {/* Dashboard Screenshot - Replace with actual image */}
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-gradient-to-br from-olive-500 to-olive-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
                <p className="text-gray-600 font-medium">
                  Dashboard Preview
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Replace with dashboard-screenshot.png
                </p>
              </div>
              {/* Uncomment when you have the screenshot */}
              {/* <Image
                src="/dashboard-screenshot.png"
                alt="Liquid Canvas Dashboard"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
                priority
              /> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features to streamline your outreach workflow
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Website Discovery</h3>
              <p className="text-gray-600">
                Automatically discover websites and prospects based on your criteria
              </p>
            </div>
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Social Outreach</h3>
              <p className="text-gray-600">
                Connect with prospects on Instagram, Facebook, TikTok, and LinkedIn
              </p>
            </div>
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Workflows</h3>
              <p className="text-gray-600">
                Set up automated pipelines for discovery, enrichment, and outreach
              </p>
            </div>
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with encrypted data storage
              </p>
            </div>
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics & Insights</h3>
              <p className="text-gray-600">
                Track performance with detailed analytics and reporting
              </p>
            </div>
            <div className="glass rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Integration</h3>
              <p className="text-gray-600">
                Connect your social accounts and email services seamlessly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses using Liquid Canvas to scale their outreach
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-olive-600 to-olive-700 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 font-semibold text-lg"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://liquidcanvas.art"
              target="_blank"
              rel="noopener noreferrer"
              className="text-olive-600 font-semibold hover:underline"
            >
              liquidcanvas.art
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
