// TypeScript declaration for custom window properties used for runtime diagnostics
// These properties are set client-side only and are used for build verification

interface Window {
  // Dashboard runtime proof markers
  __DASHBOARD_RUNTIME_PROOF__?: string
  __DASHBOARD_REPO__?: string
  __DASHBOARD_VERSION__?: string
  __DASHBOARD_LOADED__?: boolean
  
  // Repo and build identification
  __REPO_PROOF__?: string
  __RUNTIME_PROOF__?: string
  __BUILD_ID__?: string
  __BUILD_TIME__?: string
  __RUNTIME_TIME__?: string
  
  // Monorepo activation flag
  __LIQUIDCANVAS_MONOREPO_ACTIVE__?: boolean
  
  // Debug utilities (optional, may not always be present)
  __DRAFTS_TAB_DEBUG__?: {
    exists: boolean
    tabId?: string
    label?: string
    [key: string]: unknown
  }
}

