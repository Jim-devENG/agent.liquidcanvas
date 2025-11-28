'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listJobs, createDiscoveryJob, createEnrichmentJob, createScoringJob, createSendJob, createFollowupJob, type Job } from '@/lib/api'
import { Search, RefreshCw, Mail, TrendingUp, Send, Clock } from 'lucide-react'
import ProspectTable from '@/components/ProspectTable'
import JobList from '@/components/JobList'

export default function Dashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('usa')

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const loadJobs = async () => {
    try {
      const jobList = await listJobs(0, 10)
      setJobs(jobList)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const handleDiscover = async () => {
    if (!keywords.trim()) {
      alert('Please enter keywords')
      return
    }
    setLoading(true)
    try {
      await createDiscoveryJob(keywords, location)
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to start discovery: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrich = async () => {
    setLoading(true)
    try {
      await createEnrichmentJob()
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to start enrichment: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleScore = async () => {
    setLoading(true)
    try {
      await createScoringJob()
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to start scoring: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('Send emails to prospects with drafts?')) return
    setLoading(true)
    try {
      await createSendJob(undefined, 50, false) // Manual review mode
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to start send job: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowup = async () => {
    setLoading(true)
    try {
      await createFollowupJob(7, 3, 50)
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to start follow-up job: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Art Outreach Automation</h1>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token')
                router.push('/login')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Controls</h2>
          
          {/* Discovery */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Website Discovery</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords (e.g., home decor blog)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
              />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
              >
                <option value="usa">USA</option>
                <option value="canada">Canada</option>
                <option value="uk_london">UK/London</option>
                <option value="germany">Germany</option>
                <option value="france">France</option>
                <option value="europe">Europe</option>
              </select>
              <button
                onClick={handleDiscover}
                disabled={loading}
                className="px-4 py-2 bg-olive-600 text-white rounded-md hover:bg-olive-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Discover
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleEnrich}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Enrich
            </button>
            <button
              onClick={handleScore}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Score
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={handleFollowup}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Follow-up
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="mb-8">
          <JobList jobs={jobs} onRefresh={loadJobs} />
        </div>

        {/* Prospects Table */}
        <ProspectTable />
      </main>
    </div>
  )
}

