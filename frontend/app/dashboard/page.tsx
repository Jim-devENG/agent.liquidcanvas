'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatsCards from '@/components/StatsCards'
import LeadsTable from '@/components/LeadsTable'
import EmailsTable from '@/components/EmailsTable'
import JobStatusPanel from '@/components/JobStatusPanel'
import ActivityFeed from '@/components/ActivityFeed'
import AutomationControl from '@/components/AutomationControl'
import ManualScrape from '@/components/ManualScrape'
import WebsitesTable from '@/components/WebsitesTable'
import SystemStatus from '@/components/SystemStatus'
import Sidebar from '@/components/Sidebar'
import Pipeline from '@/components/Pipeline'
import { getStats, listJobs } from '@/lib/api'
import type { Stats, Job } from '@/lib/api'
import { 
  LayoutDashboard, 
  Globe, 
  Users, 
  Mail, 
  Settings, 
  Activity,
  AtSign,
  LogOut as LogOutIcon,
  BookOpen,
  RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pipeline' | 'leads' | 'scraped_emails' | 'emails' | 'jobs' | 'websites' | 'settings' | 'guide'
  >('pipeline')  // Pipeline-first: default to Pipeline tab

  // Track if we've already triggered refresh for completed jobs to prevent loops
  const hasTriggeredRefresh = useRef(false)

  // Check authentication on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  const loadData = useCallback(async (isInitialLoad = false) => {
    try {
      const [statsData, jobsData] = await Promise.all([
        getStats().catch(err => {
          console.warn('Failed to get stats:', err.message)
          return null
        }),
        listJobs(0, 20).catch(err => {
          console.warn('Failed to get jobs:', err.message)
          return []
        }),
      ])
      
      if (statsData) setStats(statsData)
      // Ensure jobsData is always an array
      const jobsArray = Array.isArray(jobsData) ? jobsData : []
      setJobs(jobsArray)
      
      // Check for completed discovery jobs and trigger refresh (only once on initial load)
      // This prevents infinite loops from repeated refreshes
      if (isInitialLoad && !hasTriggeredRefresh.current) {
        const completedDiscoveryJobs = jobsArray.filter(
          (job: any) => job.job_type === 'discover' && job.status === 'completed'
        )
        
        if (completedDiscoveryJobs.length > 0) {
          // Get the most recent completed discovery job
          const latestJob = completedDiscoveryJobs.sort((a: any, b: any) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
            return dateB - dateA
          })[0]
          
          console.log('🔄 Found completed discovery job, triggering refresh...', latestJob.id)
          hasTriggeredRefresh.current = true
          // Dispatch event to refresh all tables
          // Use setTimeout to ensure tables are mounted
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('jobsCompleted'))
            }
          }, 500)
        }
      }
      
      const backendResponding = statsData !== null || jobsArray.length > 0
      setConnectionError(!backendResponding)
    } catch (error: any) {
      console.error('Error loading data:', error)
      const isConnectionError = 
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('NetworkError')
      
      if (isConnectionError) {
        setConnectionError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Listen for job completion events
  useEffect(() => {
    const handleJobsCompleted = () => {
      console.log('🔄 [DASHBOARD] Jobs completed event received, refreshing data...')
      loadData(false)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('jobsCompleted', handleJobsCompleted)
      return () => {
        window.removeEventListener('jobsCompleted', handleJobsCompleted)
      }
    }
  }, [loadData])

  const refreshData = () => {
    loadData(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('outreach_type')
    router.push('/login')
  }

  const handleTabChange = (tab: string) => {
    const validTabs: Array<'overview' | 'pipeline' | 'leads' | 'scraped_emails' | 'emails' | 'jobs' | 'websites' | 'settings' | 'guide'> = [
      'overview', 'pipeline', 'leads', 'scraped_emails', 'emails', 'jobs', 'websites', 'settings', 'guide'
    ]
    if (validTabs.includes(tab as any)) {
      setActiveTab(tab as any)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: Globe },
    { id: 'websites', label: 'Websites', icon: Globe },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'scraped_emails', label: 'Scraped Emails', icon: AtSign },
    { id: 'emails', label: 'Outreach Emails', icon: Mail },
    { id: 'jobs', label: 'Jobs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'guide', label: 'Guide', icon: BookOpen },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-olive-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-olive-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-olive-50/30">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />

        {/* Main Content */}
        <main className="flex-1 px-3 sm:px-4 py-2 overflow-y-auto ml-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Liquid Canvas Outreach Studio</h1>
              <SystemStatus jobs={jobs} loading={loading} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <LogOutIcon className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Stats Cards - Full Width */}
              <div className="lg:col-span-12">
                {stats ? <StatsCards stats={stats} /> : (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
                    <p className="text-gray-500">Stats unavailable. Check backend connection.</p>
                  </div>
                )}
              </div>

              {/* Left Column - Automation & Manual Scrape */}
              <div className="lg:col-span-7 space-y-3">
                <AutomationControl />
                <ManualScrape />
              </div>

              {/* Right Column - Jobs & Activity */}
              <div className="lg:col-span-5 space-y-3">
                {Array.isArray(jobs) && jobs.length > 0 ? (
                  <JobStatusPanel jobs={jobs} onRefresh={refreshData} />
                ) : (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
                    <p className="text-gray-500">No jobs found.</p>
                  </div>
                )}
                <ActivityFeed limit={15} autoRefresh={true} />
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="max-w-7xl mx-auto">
              <Pipeline />
            </div>
          )}

          {activeTab === 'websites' && (
            <div className="max-w-7xl mx-auto">
              <WebsitesTable />
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="max-w-7xl mx-auto">
              <LeadsTable />
            </div>
          )}

          {activeTab === 'scraped_emails' && (
            <div className="max-w-7xl mx-auto">
              <LeadsTable emailsOnly={true} />
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="max-w-7xl mx-auto">
              <EmailsTable />
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="max-w-7xl mx-auto">
              {Array.isArray(jobs) && jobs.length > 0 ? (
                <JobStatusPanel jobs={jobs} onRefresh={refreshData} />
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
                  <p className="text-gray-500">No jobs found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
                <p className="text-gray-600">Settings page coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Guide</h2>
                <p className="text-gray-600">User guide coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

