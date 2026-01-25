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
  const limit = 50
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

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Filter prospects that have drafts (draft_subject and draft_body not null)
      const response = await listProspects(skip, limit)
      const allProspects = Array.isArray(response?.data) ? response.data : []
      
      // Filter for website prospects with drafts
      const draftedProspects = allProspects.filter((p: Prospect) => 
        p.draft_subject && p.draft_body && 
        ((p as any).source_type === 'website' || !(p as any).source_type)
      )
      
      setProspects(draftedProspects)
      setTotal(draftedProspects.length)
      setError(null)
    } catch (error: any) {
      console.error('Failed to load drafts:', error)
      setError(error?.message || 'Failed to load drafts')
      setProspects([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [skip, limit])

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

    if (showConfirm && !confirm('Generate drafts for all leads with scraped emails? This will create drafts for all verified prospects.')) {
      abortControllerRef.current = null
      return
    }

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
      
      if (showConfirm) {
        alert(result.message || `Drafting job started for ${result.prospects_count} prospects`)
      }
      
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
      
      // Extract error message - backend 422 is a valid business rule, not a crash
      const errorMessage = err?.message || 'Failed to generate drafts'
      
      // Single state update: transition to error (consolidated)
      if (mountedRef.current && !abortController.signal.aborted) {
        draftStateRef.current = 'error'
        setDraftState({ status: 'error', message: errorMessage })
        setError(errorMessage)
      }
      
      if (showConfirm) {
        alert(errorMessage)
      }
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
    loadDrafts()
    
    const interval = setInterval(loadDrafts, 15000)
    
    const handleJobCompleted = () => {
      loadDrafts()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('jobsCompleted', handleJobCompleted)
    }
    
    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('jobsCompleted', handleJobCompleted)
      }
    }
  }, [skip])

  // Separate effect for auto-drafting on mount - FIXED: Completely independent, no handleAutoDraft dependency
  useEffect(() => {
    if (hasAutoDrafted) return
    
    let timeoutId: NodeJS.Timeout | null = null
    let checkTimeoutId: NodeJS.Timeout | null = null
    let isCancelled = false
    
    const checkAndAutoDraft = async () => {
      try {
        // Check if we have any drafts
        const response = await listProspects(0, 50)
        const allProspects = Array.isArray(response?.data) ? response.data : []
        const draftedProspects = allProspects.filter((p: Prospect) => 
          p.draft_subject && p.draft_body && 
          ((p as any).source_type === 'website' || !(p as any).source_type)
        )
        
        // Only proceed if component is still mounted and not cancelled
        if (!mountedRef.current || isCancelled) {
          return
        }
        
        // Auto-trigger drafting if no drafts exist
        // Inline draft logic completely to avoid ANY dependency loops
        if (draftedProspects.length === 0) {
          timeoutId = setTimeout(async () => {
            // Triple-check: mount, cancel, and current state
            if (!mountedRef.current || isCancelled) {
              return
            }
            
            // Check state via ref to avoid closure issues and React batching problems
            if (draftStateRef.current !== 'idle' || !mountedRef.current || isCancelled) {
              if (mountedRef.current && !isCancelled) {
                setHasAutoDrafted(true)
              }
              return
            }
            
            // Cancel any existing request
            if (abortControllerRef.current) {
              abortControllerRef.current.abort()
            }
            
            const abortController = new AbortController()
            abortControllerRef.current = abortController
            
            // Single state update: transition to loading
            if (mountedRef.current && !isCancelled) {
              draftStateRef.current = 'loading'
              setDraftState({ status: 'loading', message: null })
              setError(null)
            }
            
            try {
              const result = await pipelineDraft()
              
              if (abortController.signal.aborted || !mountedRef.current || isCancelled) {
                return
              }
              
              // Single state update: transition to success
              if (mountedRef.current && !isCancelled && !abortController.signal.aborted) {
                draftStateRef.current = 'success'
                setDraftState({ 
                  status: 'success', 
                  message: result.message || `Drafting job started for ${result.prospects_count} prospects`
                })
              }
              
              // Refresh after delay
              const refreshTimeoutId = setTimeout(() => {
                if (mountedRef.current && !isCancelled && !abortController.signal.aborted) {
                  loadDrafts()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('jobsCompleted'))
                  }
                }
              }, 2000)
              
              // Store timeout for cleanup (would need ref, but for now just let it run)
            } catch (err: any) {
              if (abortController.signal.aborted || !mountedRef.current || isCancelled) {
                return
              }
              
              // Single state update: transition to error
              const errorMessage = err?.message || 'Failed to generate drafts'
              if (mountedRef.current && !isCancelled && !abortController.signal.aborted) {
                draftStateRef.current = 'error'
                setDraftState({ status: 'error', message: errorMessage })
                setError(errorMessage)
              }
            } finally {
              if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null
              }
              
              if (mountedRef.current && !isCancelled) {
                setHasAutoDrafted(true)
              }
            }
          }, 1500)
        } else {
          if (mountedRef.current && !isCancelled) {
            setHasAutoDrafted(true) // Mark as checked even if drafts exist
          }
        }
      } catch (err) {
        console.error('Error checking for drafts:', err)
        // Only update state if component is still mounted
        if (mountedRef.current && !isCancelled) {
          setHasAutoDrafted(true) // Mark as checked even on error to prevent retry loops
        }
      }
    }
    
    // Delay to ensure component is mounted
    checkTimeoutId = setTimeout(checkAndAutoDraft, 500)
    
    return () => {
      isCancelled = true
      if (checkTimeoutId) {
        clearTimeout(checkTimeoutId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [hasAutoDrafted]) // ONLY depends on hasAutoDrafted - completely isolated

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
      // Export prospects with drafts (drafted status, website source type)
      const csv = await exportProspectsCSV('drafted', 'website')
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
      
      {draftState.status === 'success' && draftState.message && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
          {draftState.message}
        </div>
      )}
      
      {draftState.status === 'error' && draftState.message && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          {draftState.message}
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium mb-1">No drafts found</p>
          <p className="text-xs">Click "Generate Drafts" to create drafts for all leads with scraped emails</p>
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
                    <td className="p-2 text-gray-600">{prospect.discovery_category || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{prospect.discovery_location || 'N/A'}</td>
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

