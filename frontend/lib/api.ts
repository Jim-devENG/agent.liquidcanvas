/**
 * API client for backend communication
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

// Auto-detect domain in production
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Production - use current domain
    const protocol = window.location.protocol
    API_BASE.replace('http://localhost:8000/api', `${protocol}//${hostname}/api`)
  }
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Authenticated fetch wrapper
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

// Types
export interface Prospect {
  id: string
  domain: string
  page_url?: string
  page_title?: string
  contact_email?: string
  contact_method?: string
  da_est?: number
  score?: number
  outreach_status: string
  last_sent?: string
  followups_sent: number
  draft_subject?: string
  draft_body?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  job_type: string
  status: string
  params?: any
  result?: any
  error_message?: string
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  prospect_id: string
  subject: string
  body: string
  response?: any
  sent_at: string
}

// Jobs API
export async function createDiscoveryJob(keywords: string, location?: string, maxResults?: number, categories?: string[]): Promise<Job> {
  const res = await authenticatedFetch(`${API_BASE}/jobs/discover`, {
    method: 'POST',
    body: JSON.stringify({
      keywords,
      location,
      max_results: maxResults || 100,
      categories,
    }),
  })
  if (!res.ok) throw new Error('Failed to create discovery job')
  return res.json()
}

export async function createEnrichmentJob(prospectIds?: string[], maxProspects?: number): Promise<{ job_id: string; status: string }> {
  const params = new URLSearchParams()
  if (prospectIds) params.append('prospect_ids', prospectIds.join(','))
  if (maxProspects) params.append('max_prospects', maxProspects.toString())
  
  const res = await authenticatedFetch(`${API_BASE}/prospects/enrich?${params}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create enrichment job')
  return res.json()
}

export async function createScoringJob(prospectIds?: string[], maxProspects?: number): Promise<Job> {
  const params = new URLSearchParams()
  if (prospectIds) params.append('prospect_ids', prospectIds.join(','))
  if (maxProspects) params.append('max_prospects', maxProspects.toString())
  
  const res = await authenticatedFetch(`${API_BASE}/jobs/score?${params}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create scoring job')
  return res.json()
}

export async function createSendJob(prospectIds?: string[], maxProspects?: number, autoSend?: boolean): Promise<Job> {
  const params = new URLSearchParams()
  if (prospectIds) params.append('prospect_ids', prospectIds.join(','))
  if (maxProspects) params.append('max_prospects', maxProspects.toString())
  if (autoSend !== undefined) params.append('auto_send', autoSend.toString())
  
  const res = await authenticatedFetch(`${API_BASE}/jobs/send?${params}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create send job')
  return res.json()
}

export async function createFollowupJob(daysSinceSent?: number, maxFollowups?: number, maxProspects?: number): Promise<Job> {
  const params = new URLSearchParams()
  if (daysSinceSent) params.append('days_since_sent', daysSinceSent.toString())
  if (maxFollowups) params.append('max_followups', maxFollowups.toString())
  if (maxProspects) params.append('max_prospects', maxProspects.toString())
  
  const res = await authenticatedFetch(`${API_BASE}/jobs/followup?${params}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create follow-up job')
  return res.json()
}

export async function getJobStatus(jobId: string): Promise<Job> {
  const res = await authenticatedFetch(`${API_BASE}/jobs/${jobId}/status`)
  if (!res.ok) throw new Error('Failed to get job status')
  return res.json()
}

export async function listJobs(skip = 0, limit = 50): Promise<Job[]> {
  const res = await authenticatedFetch(`${API_BASE}/jobs?skip=${skip}&limit=${limit}`)
  if (!res.ok) throw new Error('Failed to list jobs')
  return res.json()
}

// Prospects API
export async function listProspects(
  skip = 0,
  limit = 50,
  status?: string,
  minScore?: number,
  hasEmail?: boolean
): Promise<{ prospects: Prospect[]; total: number; skip: number; limit: number }> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })
  if (status) params.append('status', status)
  if (minScore !== undefined) params.append('min_score', minScore.toString())
  if (hasEmail !== undefined) params.append('has_email', hasEmail.toString())
  
  const res = await authenticatedFetch(`${API_BASE}/prospects?${params}`)
  if (!res.ok) throw new Error('Failed to list prospects')
  return res.json()
}

export async function getProspect(prospectId: string): Promise<Prospect> {
  const res = await authenticatedFetch(`${API_BASE}/prospects/${prospectId}`)
  if (!res.ok) throw new Error('Failed to get prospect')
  return res.json()
}

export async function composeEmail(prospectId: string): Promise<{ prospect_id: string; subject: string; body: string; draft_saved: boolean }> {
  const res = await authenticatedFetch(`${API_BASE}/prospects/${prospectId}/compose`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to compose email')
  return res.json()
}

export async function sendEmail(prospectId: string, subject?: string, body?: string): Promise<{
  prospect_id: string
  email_log_id: string
  sent_at: string
  success: boolean
  message_id?: string
}> {
  const res = await authenticatedFetch(`${API_BASE}/prospects/${prospectId}/send`, {
    method: 'POST',
    body: JSON.stringify({
      subject,
      body,
    }),
  })
  if (!res.ok) throw new Error('Failed to send email')
  return res.json()
}

// Auth API
export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

