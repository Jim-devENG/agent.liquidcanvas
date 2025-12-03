'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, Mail, Loader2, CheckCircle, X, CheckSquare, Square } from 'lucide-react'
import { listProspects, getLatestDiscoveryJob, enrichProspectById, createEnrichmentJob, type Prospect, type Job } from '@/lib/api'
import { safeToFixed } from '@/lib/safe-utils'

export default function WebsitesTable() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalWithoutEmail, setTotalWithoutEmail] = useState(0)
  const [lastJobInfo, setLastJobInfo] = useState<{ saved: number; found: number } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())
  const [bulkEnriching, setBulkEnriching] = useState(false)
  const [enrichSuccess, setEnrichSuccess] = useState<string | null>(null)
  const [loadingAllWithoutEmail, setLoadingAllWithoutEmail] = useState(false)
  const limit = 10

  const loadWebsites = async () => {
    try {
      setLoading(true)
      const response = await listProspects(skip, limit)
      setProspects(response.data)
      setTotal(response.total)
      
      // Fetch total count of prospects without email
      try {
        const noEmailResponse = await listProspects(0, 1, undefined, undefined, false)
        setTotalWithoutEmail(noEmailResponse.total)
      } catch (err) {
        console.warn('Failed to fetch total without email count:', err)
      }
      
      // Fetch latest discovery job info
      const latestJob = await getLatestDiscoveryJob()
      if (latestJob && latestJob.result) {
        const result = latestJob.result as any
        const stats = result.search_statistics
        if (stats) {
          setLastJobInfo({
            saved: stats.results_saved || 0,
            found: stats.total_results_found || 0,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load websites:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWebsites()
    const interval = setInterval(() => {
      loadWebsites()
    }, 30000) // Refresh every 30 seconds (debounced to prevent loops)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleEnrichSingle = async (prospectId: string, domain: string) => {
    setEnrichingIds(prev => new Set(prev).add(prospectId))
    setEnrichSuccess(null)
    
    try {
      const result = await enrichProspectById(prospectId)
      if (result.email) {
        setEnrichSuccess(`Email found for ${domain}: ${result.email}`)
      } else {
        setEnrichSuccess(`No email found for ${domain}. It will be retried later.`)
      }
      // Refresh the list after a short delay
      setTimeout(() => {
        loadWebsites()
      }, 1500)
    } catch (error: any) {
      alert(`Failed to enrich ${domain}: ${error.message}`)
    } finally {
      setEnrichingIds(prev => {
        const next = new Set(prev)
        next.delete(prospectId)
        return next
      })
    }
  }

  const handleSelectAllNoEmail = (selectAllPages: boolean = false) => {
    if (selectAllPages) {
      // Select all prospects without email across all pages
      setLoadingAllWithoutEmail(true)
      fetchAllWithoutEmail()
        .then(allIds => {
          setSelectedIds(new Set(allIds))
          setLoadingAllWithoutEmail(false)
        })
        .catch(err => {
          console.error('Failed to fetch all prospects without email:', err)
          alert('Failed to load all prospects without email. Only selecting from current page.')
          // Fallback to current page
          const noEmailIds = prospects
            .filter(p => !p.contact_email || p.contact_email.trim() === '')
            .map(p => p.id)
          setSelectedIds(new Set(noEmailIds))
          setLoadingAllWithoutEmail(false)
        })
    } else {
      // Select only from current page
      const noEmailIds = prospects
        .filter(p => !p.contact_email || p.contact_email.trim() === '')
        .map(p => p.id)
      
      if (noEmailIds.length === 0) {
        return
      }
      
      // Toggle: if all are selected, deselect; otherwise select all
      const allSelected = noEmailIds.every(id => selectedIds.has(id))
      if (allSelected) {
        // Deselect all on current page
        setSelectedIds(prev => {
          const next = new Set(prev)
          noEmailIds.forEach(id => next.delete(id))
          return next
        })
      } else {
        // Select all on current page
        setSelectedIds(prev => {
          const next = new Set(prev)
          noEmailIds.forEach(id => next.add(id))
          return next
        })
      }
    }
  }

  const fetchAllWithoutEmail = async (): Promise<string[]> => {
    const allIds: string[] = []
    let currentSkip = 0
    const batchSize = 100
    
    while (true) {
      const response = await listProspects(currentSkip, batchSize, undefined, undefined, false)
      const batchIds = response.data
        .filter(p => !p.contact_email || p.contact_email.trim() === '')
        .map(p => p.id)
      
      allIds.push(...batchIds)
      
      if (currentSkip + batchSize >= response.total || response.data.length === 0) {
        break
      }
      
      currentSkip += batchSize
    }
    
    return allIds
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkEnrich = async () => {
    if (selectedIds.size === 0) {
      alert('Please select websites to enrich')
      return
    }

    setBulkEnriching(true)
    setEnrichSuccess(null)

    try {
      const result = await createEnrichmentJob(Array.from(selectedIds), undefined, false)
      setEnrichSuccess(`Enrichment job started for ${selectedIds.size} website(s). Check Jobs tab for progress.`)
      setSelectedIds(new Set())
      // Refresh after a moment
      setTimeout(() => {
        loadWebsites()
      }, 2000)
    } catch (error: any) {
      alert(`Failed to start enrichment job: ${error.message}`)
    } finally {
      setBulkEnriching(false)
    }
  }

  const toggleSelect = (prospectId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(prospectId)) {
        next.delete(prospectId)
      } else {
        next.add(prospectId)
      }
      return next
    })
  }

  const prospectsWithoutEmailOnPage = prospects.filter(p => !p.contact_email || p.contact_email.trim() === '').length
  const selectedOnPage = prospects.filter(p => selectedIds.has(p.id) && (!p.contact_email || p.contact_email.trim() === '')).length
  const allOnPageSelected = prospectsWithoutEmailOnPage > 0 && selectedOnPage === prospectsWithoutEmailOnPage

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Discovered Websites</h2>
        <button
          onClick={loadWebsites}
          className="flex items-center space-x-2 px-3 py-2 bg-olive-600 text-white rounded-md hover:bg-olive-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Last Discovery Job Hint */}
      {lastJobInfo && lastJobInfo.saved === 0 && lastJobInfo.found > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Last discovery job found {lastJobInfo.found} results but saved 0 new prospects.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              This usually means enrichment failed (Hunter.io rate limits or no emails found). Check the Jobs tab for details.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Enrich Actions */}
      {prospects.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSelectAllNoEmail(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                    allOnPageSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'
                  }`}
                  disabled={prospectsWithoutEmailOnPage === 0}
                >
                  {allOnPageSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    Select Page ({prospectsWithoutEmailOnPage} without email)
                  </span>
                </button>
                
                {totalWithoutEmail > prospectsWithoutEmailOnPage && (
                  <button
                    onClick={() => handleSelectAllNoEmail(true)}
                    disabled={loadingAllWithoutEmail}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                      loadingAllWithoutEmail
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                    }`}
                  >
                    {loadingAllWithoutEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-semibold">Loading...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Select All Pages ({totalWithoutEmail} total)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {selectedIds.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-300">
                  <span className="text-sm font-bold text-blue-900">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-blue-700 hover:text-blue-900 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkEnrich}
                disabled={bulkEnriching}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg ${
                  !bulkEnriching
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {bulkEnriching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Starting Enrichment...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Enrich {selectedIds.size} Website{selectedIds.size === 1 ? '' : 's'}</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {selectedIds.size > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              {selectedIds.size === 1 
                ? '1 website selected for enrichment'
                : `${selectedIds.size} websites selected for enrichment. This will create a background job.`
              }
            </p>
          </div>
          )}
        </div>
      )}

      {enrichSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">{enrichSuccess}</p>
        </div>
      )}

      {loading && prospects.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-olive-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      ) : prospects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No websites found</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={() => handleSelectAllNoEmail(false)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      title="Select all without email on this page"
                      disabled={prospectsWithoutEmailOnPage === 0}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Domain</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Page Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DA Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(prospects) ? prospects.map((prospect) => {
                  const hasNoEmail = !prospect.contact_email || prospect.contact_email.trim() === ''
                  const isSelected = selectedIds.has(prospect.id)
                  const isEnriching = enrichingIds.has(prospect.id)
                  
                  return (
                  <tr key={prospect.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4">
                      {hasNoEmail && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(prospect.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{prospect.domain}</span>
                        {prospect.page_url && (
                          <a
                            href={prospect.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-olive-600 hover:text-olive-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {prospect.contact_email ? (
                        <span className="text-sm text-green-700 font-medium">{prospect.contact_email}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No email</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{prospect.page_title || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{safeToFixed(prospect.da_est, 1)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{safeToFixed(prospect.score, 2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        prospect.outreach_status === 'sent' ? 'bg-green-100 text-green-800' :
                        prospect.outreach_status === 'replied' ? 'bg-blue-100 text-blue-800' :
                        prospect.outreach_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prospect.outreach_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEnrichSingle(prospect.id, prospect.domain)}
                        disabled={isEnriching}
                        className={`p-1.5 rounded transition-all ${
                          isEnriching
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : hasNoEmail
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={hasNoEmail ? 'Enrich email for this website' : 'Email already exists'}
                      >
                        {isEnriching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(prospect.created_at)}
                    </td>
                  </tr>
                )}) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {skip + 1}-{Math.min(skip + limit, total)} of {total}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="px-3 py-2 bg-olive-600 text-white rounded-md hover:bg-olive-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

