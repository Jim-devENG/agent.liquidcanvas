'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { FileText, RefreshCw, Send, Edit, X, Loader2, Download, Mail, CheckCircle } from 'lucide-react'
import { listProspects, pipelineDraft, pipelineSend, updateProspectDraft, exportProspectsCSV, type Prospect } from '@/lib/api'

export default function DraftsTable() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  // Use a higher limit for drafts to ensure we get all drafts, not just first 50
  const limit = 1000
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)
  const [editingProspect, setEditingProspect] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  
  // Draft request state machine: single source of truth
  const [draftState, setDraftState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    message: string | null
  }>({ status: 'idle', message: null })
  
  const [hasAutoDrafted, setHasAutoDrafted] = useState(false)
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Ref for checking state without causing re-renders or closure issues
  const draftStateRef = useRef<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  // Sync ref with state (for checking without re-renders)
  useEffect(() => {
    draftStateRef.current = draftState.status
  }, [draftState.status])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  // Track if this is the initial load to determine error handling behavior
  const isInitialLoadRef = useRef(true)
  
  const loadDrafts = useCallback(async () => {
    // Only update loading state if component is mounted
    if (!mountedRef.current) return
    
    const isInitial = isInitialLoadRef.current
    isInitialLoadRef.current = false
    
    try {
      setLoading(true)
      setError(null)
      // Load ALL prospects with a high limit to find all drafts (not just first 50)
      // This ensures drafts from leads and scraped emails are included, even if they're not in the first page
      const response = await listProspects(0, 1000)
      
      // Check if component unmounted during async operation
      if (!mountedRef.current) return
      
      const allProspects = Array.isArray(response?.data) ? response.data : []
      
      // Filter for prospects with drafts from ANY source (website, leads, scraped_emails)
      // Include all prospects that have draft_subject and draft_body, regardless of source_type
      // Check for both non-null and non-empty strings to ensure valid drafts
      const draftedProspects = allProspects.filter((p: Prospect) => {
        const hasSubject = p.draft_subject && p.draft_subject.trim().length > 0
        const hasBody = p.draft_body && p.draft_body.trim().length > 0
        return hasSubject && hasBody
      })
      
      // Debug log to help diagnose filtering issues
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 [DRAFTS] Filtered ${draftedProspects.length} drafts from ${allProspects.length} total prospects`)
        if (draftedProspects.length === 0 && allProspects.length > 0) {
          // Check if any prospects have partial drafts
          const withSubject = allProspects.filter((p: Prospect) => p.draft_subject && p.draft_subject.trim().length > 0)
          const withBody = allProspects.filter((p: Prospect) => p.draft_body && p.draft_body.trim().length > 0)
          console.log(`🔍 [DRAFTS] Debug: ${withSubject.length} with subject, ${withBody.length} with body`)
        }
      }
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setProspects(draftedProspects)
        // Total is the count of drafted prospects, not all prospects
        setTotal(draftedProspects.length)
        setError(null) // Clear error on successful load
      }
    } catch (error: any) {
      // Check if component unmounted during error handling
      if (!mountedRef.current) return
      
      console.error('Failed to load drafts:', error)
      
      // Extract error message - distinguish network errors from business logic errors
      const errorMessage = error?.message || 'Failed to load drafts'
      
      // Set error state but DO NOT clear prospects array on subsequent loads
      // This allows error message to display while preserving any previously loaded data
      setError(errorMessage)
      
      // Only clear prospects if this is the initial load (no existing data)
      // This prevents "No drafts found" from showing when there's an error
      if (isInitial && mountedRef.current) {
        setProspects([])
        setTotal(0)
      }
    } finally {
      // Only update loading state if component is still mounted
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [skip, limit]) // Remove prospects.length from dependencies to prevent loops

  const handleAutoDraft = useCallback(async (showConfirm = true) => {
    // Prevent concurrent requests - check via ref to avoid closure issues
    if (draftStateRef.current === 'loading') {
      return
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Removed confirm dialog - it's blocked by no-alert-script anyway
    // Proceed directly with draft generation

    // Single state update: transition to loading
    if (mountedRef.current) {
      draftStateRef.current = 'loading'
      setDraftState({ status: 'loading', message: null })
      setError(null)
    }
    
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      // Call pipelineDraft without prospect_ids to automatically draft for all verified prospects with emails
      const result = await pipelineDraft()
      
      // Check if request was aborted
      if (abortController.signal.aborted || !mountedRef.current) {
        return
      }
      
      // Single state update: transition to success
      if (mountedRef.current && !abortController.signal.aborted) {
        draftStateRef.current = 'success'
        setDraftState({ 
          status: 'success', 
          message: result.message || `Drafting job started for ${result.prospects_count} prospects`
        })
      }
      
      // Removed alert - it's blocked by no-alert-script anyway
      
      // Refresh after a short delay to allow job to start
      timeoutId = setTimeout(() => {
        if (mountedRef.current && !abortController.signal.aborted) {
          loadDrafts()
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jobsCompleted'))
          }
        }
      }, 2000)
    } catch (err: any) {
      // Check if request was aborted or component unmounted
      if (abortController.signal.aborted || !mountedRef.current) {
        return
      }
      
      // Extract error message - distinguish 422 (validation) from other errors
      let errorMessage = err?.message || 'Failed to generate drafts'
      
      // For 422 responses, the backend message is already in err.message
      // Ensure it's displayed prominently in the UI
      if (err?.status === 422) {
        // 422 is a validation error - show the backend's explanation
        errorMessage = err.message || 'No prospects ready for drafting. Ensure prospects have verification_status=\'verified\' and contact_email IS NOT NULL.'
      } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('network')) {
        // Network errors should be retryable
        errorMessage = 'Network error: Failed to connect to server. Please check your connection and try again.'
      }
      
      // Single state update: transition to error (consolidated)
      if (mountedRef.current && !abortController.signal.aborted) {
        draftStateRef.current = 'error'
        setDraftState({ status: 'error', message: errorMessage })
        // Also set in main error state so it shows in the error banner
        setError(errorMessage)
      }
      
      // Removed alert - it's blocked by no-alert-script anyway
    } finally {
      // Cleanup
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [loadDrafts]) // Removed draftState from dependencies to prevent recreation loop

  useEffect(() => {
    // Only run if component is mounted
    if (!mountedRef.current) return
    
    // Reset initial load flag when skip changes (new page)
    isInitialLoadRef.current = true
    
    loadDrafts()
    
    const interval = setInterval(() => {
      if (mountedRef.current) {
        loadDrafts()
      }
    }, 15000)
    
    const handleJobCompleted = () => {
      if (mountedRef.current) {
        loadDrafts()
      }
    }
    
    const handleRefreshDrafts = () => {
      if (mountedRef.current) {
        loadDrafts()
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('jobsCompleted', handleJobCompleted)
      window.addEventListener('refreshDrafts', handleRefreshDrafts)
    }
    
    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('jobsCompleted', handleJobCompleted)
        window.removeEventListener('refreshDrafts', handleRefreshDrafts)
      }
    }
  }, [skip, loadDrafts]) // Include loadDrafts explicitly to satisfy React hooks rules

  // DISABLED: Auto-draft on mount to prevent React invariant errors
  // Auto-drafting is now opt-in only via the "Generate Drafts" button
  // This prevents render loops and state update conflicts during initial render
  // useEffect(() => {
  //   // Auto-draft logic removed - user must explicitly click "Generate Drafts"
  // }, [])

  const handleSend = async () => {
    if (selected.size === 0) {
      setError('Please select at least one draft')
      return
    }

    if (!confirm(`Send ${selected.size} draft(s)?`)) {
      return
    }

    setActionLoading(true)
    setError(null)
    try {
      await pipelineSend({ prospect_ids: Array.from(selected) })
      setSelected(new Set())
      await loadDrafts()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jobsCompleted'))
      }
      alert(`Sending job started for ${selected.size} prospect(s)`)
    } catch (err: any) {
      setError(err.message || 'Failed to send emails')
      alert(err.message || 'Failed to send emails')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect.id)
    setEditSubject(prospect.draft_subject || '')
    setEditBody(prospect.draft_body || '')
  }

  const handleSaveEdit = async (prospectId: string) => {
    try {
      await updateProspectDraft(prospectId, {
        subject: editSubject,
        body: editBody
      })
      setEditingProspect(null)
      await loadDrafts()
    } catch (err: any) {
      setError(err.message || 'Failed to update draft')
    }
  }

  const handleCancelEdit = () => {
    setEditingProspect(null)
    setEditSubject('')
    setEditBody('')
  }

  const handleExport = async () => {
    try {
      // Export all prospects with drafts (regardless of source type - includes leads and scraped emails)
      const csv = await exportProspectsCSV('drafted')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `drafts-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to export drafts')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  // Extract location from domain or email TLD
  const extractLocationFromDomain = (domain?: string, email?: string): string => {
    // First, try discovery_location if available (most accurate)
    // This is handled in the component where we have access to prospect.discovery_location
    
    // Extract from domain TLD
    const domainToCheck = domain || (email ? email.split('@')[1] : '')
    if (!domainToCheck) return 'N/A'
    
    // Common TLD to country mappings
    const tldToCountry: Record<string, string> = {
      'uk': 'United Kingdom',
      'co.uk': 'United Kingdom',
      'au': 'Australia',
      'com.au': 'Australia',
      'ca': 'Canada',
      'de': 'Germany',
      'fr': 'France',
      'it': 'Italy',
      'es': 'Spain',
      'nl': 'Netherlands',
      'be': 'Belgium',
      'ch': 'Switzerland',
      'at': 'Austria',
      'se': 'Sweden',
      'no': 'Norway',
      'dk': 'Denmark',
      'fi': 'Finland',
      'ie': 'Ireland',
      'nz': 'New Zealand',
      'sg': 'Singapore',
      'jp': 'Japan',
      'cn': 'China',
      'in': 'India',
      'br': 'Brazil',
      'mx': 'Mexico',
      'za': 'South Africa',
    }
    
    // Extract TLD (last part after last dot)
    const parts = domainToCheck.toLowerCase().split('.')
    if (parts.length >= 2) {
      const tld = parts.slice(-2).join('.') // Check for two-part TLDs like .co.uk
      if (tldToCountry[tld]) {
        return tldToCountry[tld]
      }
      const singleTld = parts[parts.length - 1]
      if (tldToCountry[singleTld]) {
        return tldToCountry[singleTld]
      }
    }
    
    return 'N/A'
  }

  if (loading && prospects.length === 0) {
    return (
      <div className="glass rounded-xl shadow-lg border border-white/20 p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-olive-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl shadow-lg border border-white/20 p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">Email Drafts</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Reset state and trigger new request
              draftStateRef.current = 'idle'
              setDraftState({ status: 'idle', message: null })
              handleAutoDraft(true)
            }}
            disabled={draftState.status === 'loading'}
            className="px-3 py-1.5 text-xs font-medium bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {draftState.status === 'loading' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </>
            ) : draftState.status === 'error' ? (
              <>
                <X className="w-3 h-3" />
                <span>Retry</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3" />
                <span>Generate Drafts</span>
              </>
            )}
          </button>
          {selected.size > 0 && (
            <>
              <button
                onClick={handleSend}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send ({selected.size})</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </>
          )}
          <button
            onClick={loadDrafts}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          {error}
        </div>
      )}
      
      {/* Removed draft state success/error messages - user requested removal of "draft signal at the top" */}

      {/* Show error state if there's an error and no prospects (don't show empty state when error exists) */}
      {error && prospects.length === 0 && !loading ? (
        <div className="text-center py-8">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">Error loading drafts</p>
            <p className="text-xs text-red-700">{error}</p>
            {error.includes('Failed to fetch') || error.includes('network') || error.includes('SSL') ? (
              <button
                onClick={() => {
                  setError(null)
                  loadDrafts()
                }}
                className="mt-3 px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>
      ) : prospects.length === 0 && !loading && !error ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium mb-1">No drafts found</p>
          <p className="text-xs">Click "Generate Drafts" to create drafts for all verified leads and scraped emails</p>
        </div>
      ) : (
        <>
          <div className="mb-2 text-xs text-gray-600">
            Showing {prospects.length} of {total} drafts
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      checked={selected.size === prospects.length && prospects.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(new Set(prospects.map(p => p.id)))
                        } else {
                          setSelected(new Set())
                        }
                      }}
                      className="rounded border-gray-300 text-olive-600 focus:ring-olive-500"
                    />
                  </th>
                  <th className="text-left p-2 font-semibold text-gray-700">Domain</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Subject</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Category</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Location</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selected.has(prospect.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selected)
                          if (e.target.checked) {
                            newSelected.add(prospect.id)
                          } else {
                            newSelected.delete(prospect.id)
                          }
                          setSelected(newSelected)
                        }}
                        className="rounded border-gray-300 text-olive-600 focus:ring-olive-500"
                      />
                    </td>
                    <td className="p-2">
                      <a
                        href={prospect.page_url || `https://${prospect.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-olive-600 hover:text-olive-700 hover:underline flex items-center gap-1"
                      >
                        {prospect.domain || 'N/A'}
                        <Mail className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-2 text-gray-700">{prospect.contact_email || 'N/A'}</td>
                    <td className="p-2">
                      {editingProspect === prospect.id ? (
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          placeholder="Subject"
                        />
                      ) : (
                        <span className="text-gray-700">{prospect.draft_subject || 'N/A'}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="text-gray-700 font-medium">{prospect.discovery_category || 'N/A'}</span>
                    </td>
                    <td className="p-2">
                      <span className="text-gray-700 font-medium">
                        {prospect.discovery_location || extractLocationFromDomain(prospect.domain, prospect.contact_email) || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        {editingProspect === prospect.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(prospect.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(prospect)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editingProspect && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Draft Body:</label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded min-h-[200px]"
                placeholder="Email body"
              />
            </div>
          )}
          {prospects.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <div>
                {skip > 0 && (
                  <button
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    className="px-2 py-1 text-olive-600 hover:text-olive-700 hover:underline"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div>
                Page {Math.floor(skip / limit) + 1} of {Math.ceil(total / limit)}
              </div>
              <div>
                {skip + limit < total && (
                  <button
                    onClick={() => setSkip(skip + limit)}
                    className="px-2 py-1 text-olive-600 hover:text-olive-700 hover:underline"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

