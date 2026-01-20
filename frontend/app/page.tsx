'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ArrowRight, 
  CheckCircle, 
  Globe, 
  Users, 
  Mail, 
  Zap, 
  Shield, 
  TrendingUp,
  Play,
  Star,
  BarChart3,
  Sparkles,
  Rocket,
  Target,
  Award
} from 'lucide-react'
import Link from 'next/link'
import DashboardPreview from '@/components/DashboardPreview'

export default function HomePage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const features = [
    {
      icon: Globe,
      title: 'Website Discovery',
      description: 'Automatically discover and categorize relevant websites in your industry',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Lead Management',
      description: 'Organize and manage your prospects with intelligent categorization',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Mail,
      title: 'Email Outreach',
      description: 'Streamline your email campaigns with automated drafting and sending',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Automation',
      description: 'Set up automated workflows to scale your outreach efforts',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Verification',
      description: 'Verify leads and ensure data quality before outreach',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Track performance and optimize your outreach strategy',
      gradient: 'from-red-500 to-rose-500'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Websites Discovered', icon: Globe },
    { value: '50K+', label: 'Leads Generated', icon: Users },
    { value: '95%', label: 'Success Rate', icon: Award },
    { value: '24/7', label: 'Automation', icon: Zap }
  ]

  const benefits = [
    { icon: Rocket, text: '10x faster lead generation' },
    { icon: Target, text: 'Precision targeting' },
    { icon: Sparkles, text: 'AI-powered insights' },
    { icon: CheckCircle, text: 'Enterprise-grade security' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-olive-50/30 overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(95, 112, 71, 0.15), transparent 80%)`
        }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-sm font-bold">LC</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-olive-700 to-olive-600 bg-clip-text text-transparent">
                Liquid Canvas
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link 
                href="/login"
                className="text-gray-700 hover:text-olive-700 transition-colors font-medium hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-olive-600 to-olive-700 text-white rounded-xl hover:from-olive-700 hover:to-olive-800 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-olive-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-olive-100 text-olive-700 rounded-full text-sm font-semibold mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Outreach Automation</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight animate-slide-up">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-olive-600 via-olive-700 to-olive-600 bg-clip-text text-transparent animate-gradient">
                Outreach Strategy
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
              Liquid Canvas Outreach Studio helps you discover leads, manage prospects, 
              and automate your email campaigns—all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up animation-delay-400">
              <Link
                href="/login"
                className="group px-8 py-4 bg-gradient-to-r from-olive-600 to-olive-700 text-white rounded-xl hover:from-olive-700 hover:to-olive-800 transition-all shadow-2xl hover:shadow-olive-500/50 font-semibold text-lg flex items-center gap-2 transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl font-semibold text-lg flex items-center gap-2 border-2 border-gray-200 hover:border-olive-300 transform hover:scale-105">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Dashboard Preview */}
            <div className="relative max-w-6xl mx-auto animate-fade-in animation-delay-600 transform hover:scale-[1.02] transition-transform duration-500">
              <div className="relative">
                {/* Decorative glow behind dashboard */}
                <div className="absolute -inset-4 bg-gradient-to-r from-olive-600/20 via-purple-600/20 to-blue-600/20 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                
                {/* Dashboard Preview Component */}
                <div className="relative transform perspective-1000">
                  <DashboardPreview />
                </div>
                
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
                  Live Demo
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                  Real-time Data
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in animation-delay-800">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div 
                  key={index} 
                  className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-olive-300 hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-olive-100 to-olive-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-olive-600" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-olive-600 to-olive-700 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(95, 112, 71) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-olive-100 text-olive-700 rounded-full text-sm font-semibold mb-4">
              Powerful Features
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-olive-600 to-olive-700 bg-clip-text text-transparent"> Scale</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your outreach workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-olive-300 hover:shadow-2xl transition-all bg-white transform hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-olive-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-olive-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-olive-100 text-olive-700 rounded-full text-sm font-semibold mb-4">
                Why Choose Us
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Built for
                <span className="bg-gradient-to-r from-olive-600 to-olive-700 bg-clip-text text-transparent"> Success</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of businesses using Liquid Canvas to scale their outreach and grow their customer base.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-olive-300 hover:shadow-lg transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{benefit.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <DashboardPreview />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 blur-2xl animate-pulse animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-olive-600 via-olive-700 to-olive-600 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            animation: 'float 20s infinite linear'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Outreach?
          </h2>
          <p className="text-xl text-olive-100 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses using Liquid Canvas to scale their outreach
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-olive-600 rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:shadow-white/50 font-bold text-xl transform hover:scale-105"
          >
            Start Free Trial
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">LC</span>
                </div>
                <span className="text-white font-bold text-lg">Liquid Canvas</span>
              </div>
              <p className="text-sm leading-relaxed">
                Transform your outreach with intelligent automation
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="https://liquidcanvas.art" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">liquidcanvas.art</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Liquid Canvas. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-20px);
          }
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
