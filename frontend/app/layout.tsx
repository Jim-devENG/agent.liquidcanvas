import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NoAlertScript from './no-alert-script'

const inter = Inter({ subsets: ['latin'] })

// CRITICAL: Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Liquid Canvas | Outreach Automation',
  description: 'Beautiful outreach automation powered by Liquid Canvas - Transform your creative connections',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Fix favicon 404 error by providing proper link tag */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        {/* Alternative: Use a data URI if favicon.ico doesn't exist */}
        {/* <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎨</text></svg>" /> */}
      </head>
      <body className={inter.className}>
        <NoAlertScript />
        {/* CRITICAL: Visible version stamp - always in DOM */}
        <div 
          id="build-version-stamp" 
          style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            zIndex: 99999, 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '4px 8px', 
            fontSize: '10px', 
            fontFamily: 'monospace',
            pointerEvents: 'none'
          }}
          suppressHydrationWarning
        >
          Build: <span id="build-id-placeholder">loading...</span>
        </div>
        {/* Immediate debug script - runs before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const buildId = '${process.env.NEXT_PUBLIC_BUILD_ID || 'unknown'}';
                const buildTime = '${process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown'}';
                console.log('🚨🚨🚨 DASHBOARD CODE LOADED - VERSION 3.6 🚨🚨🚨');
                console.log('🚨 Build ID:', buildId);
                console.log('🚨 Build Time:', buildTime);
                console.log('🚨 Timestamp:', new Date().toISOString());
                window.__DASHBOARD_VERSION__ = '3.6';
                window.__BUILD_ID__ = buildId;
                window.__BUILD_TIME__ = buildTime;
                window.__DASHBOARD_LOADED__ = true;
                
                // Update visible stamp
                const stamp = document.getElementById('build-version-stamp');
                const placeholder = document.getElementById('build-id-placeholder');
                if (stamp && placeholder) {
                  const timeStr = buildTime !== 'unknown' ? new Date(buildTime).toLocaleString() : 'unknown';
                  placeholder.textContent = buildId + ' | ' + timeStr;
                  stamp.style.display = 'block';
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}

