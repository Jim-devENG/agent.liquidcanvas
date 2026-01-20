'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { 
  Globe, 
  Users, 
  Lock, 
  User, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [outreachType, setOutreachType] = useState<'website' | 'social' | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outreachType) {
      setError('Please select an outreach type')
      return
    }
    
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)
      localStorage.setItem('auth_token', result.access_token)
      localStorage.setItem('outreach_type', outreachType)
      
      // Navigate to dashboard for both website and social
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-olive-50/30 relative overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(95, 112, 71, 0.15), transparent 80%)`
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-olive-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive-600 to-olive-700 flex items-center justify-center shadow-xl">
                  <span className="text-white text-xl font-bold">LC</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Liquid Canvas</h1>
                  <p className="text-gray-600">Outreach Studio</p>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome Back
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Sign in to access your outreach automation platform
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                { icon: Sparkles, text: 'AI-powered lead discovery' },
                { icon: Globe, text: 'Automated email outreach' },
                { icon: Users, text: 'Social media integration' },
                { icon: CheckCircle2, text: 'Real-time analytics' }
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-olive-100 to-olive-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-olive-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full animate-fade-in animation-delay-200">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-8 lg:p-10">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">LC</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Liquid Canvas</h1>
                    <p className="text-sm text-gray-600">Outreach Studio</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600">Access your dashboard</p>
              </div>

              {/* Outreach Type Selection */}
              {!outreachType ? (
                <div className="animate-slide-up">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Choose Your Outreach Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setOutreachType('website')}
                      className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-olive-500 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Website</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Discover websites, scrape emails, and send outreach
                      </p>
                    </button>
                    <button
                      onClick={() => setOutreachType('social')}
                      className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-olive-500 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Social</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Discover profiles on LinkedIn, Instagram, TikTok, Facebook
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected Outreach Type Badge */}
                  <div className="mb-6 animate-slide-up">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-olive-50 to-olive-100 rounded-xl border border-olive-200">
                      <div className="flex items-center gap-3">
                        {outreachType === 'social' ? (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Selected Mode</p>
                          <p className="font-bold text-olive-700">
                            {outreachType === 'social' ? 'Social Outreach' : 'Website Outreach'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOutreachType(null)
                          setError('')
                        }}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Change outreach type"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-slide-up">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !outreachType}
                  className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 px-6 rounded-xl hover:from-olive-700 hover:to-olive-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
                </>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Powered by{' '}
                  <a 
                    href="https://liquidcanvas.art" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-olive-600 font-semibold hover:text-olive-700 hover:underline transition-colors"
                  >
                    liquidcanvas.art
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
