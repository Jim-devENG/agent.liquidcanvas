'use client'

import { useState } from 'react'
import { Search, Play, Loader2, MapPin, Tag, AlertCircle } from 'lucide-react'
import { createDiscoveryJob } from '@/lib/api'

const LOCATION_OPTIONS = [
  { value: 'usa', label: 'USA' },
  { value: 'canada', label: 'Canada' },
  { value: 'uk_london', label: 'UK / London' },
  { value: 'germany', label: 'Germany' },
  { value: 'france', label: 'France' },
  { value: 'europe', label: 'Europe' },
]

const CATEGORY_OPTIONS = [
  { value: 'home_decor', label: 'Home decor' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'audio_visuals', label: 'Audio visuals' },
  { value: 'gift_guides', label: 'Gift guides' },
  { value: 'tech_innovation', label: 'Tech innovation' },
]

export default function ManualScrape() {
  const [keywords, setKeywords] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['usa'])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [maxResults, setMaxResults] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const toggleLocation = (value: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(value)) {
        const next = prev.filter((v) => v !== value)
        return next.length > 0 ? next : prev
      }
      return [...prev, value]
    })
    setError(null)
  }

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
      setError(null)
      return newCategories
    })
  }

  const canStart = () => {
    const hasSearchCriteria = keywords.trim().length > 0 || selectedCategories.length > 0
    const hasLocation = selectedLocations.length > 0
    return hasSearchCriteria && hasLocation
  }

  const handleScrape = async () => {
    setError(null)
    setSuccess(false)

    if (!keywords.trim() && selectedCategories.length === 0) {
      setError('Please select at least one category OR enter keywords')
      return
    }

    if (selectedLocations.length === 0) {
      setError('Please select at least one location')
      return
    }

    setLoading(true)
    try {
      await createDiscoveryJob(
        keywords.trim() || '',
        selectedLocations,
        maxResults,
        selectedCategories.length > 0 ? selectedCategories : []
      )
      setSuccess(true)
      setError(null)
      // Clear form after successful start
      setTimeout(() => {
        setKeywords('')
        setSelectedCategories([])
        setSuccess(false)
      }, 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to start scraping. Check console for details.')
      setSuccess(false)
      console.error('Scraping error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manual Scrape</h2>
        {loading && (
          <div className="flex items-center space-x-2 text-olive-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Scraping...</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">✅ Scraping job started successfully!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Categories Section */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
            <Tag className="w-4 h-4" />
            <span>Select Categories</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategories.includes(cat.value)
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-olive-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Keywords Section */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
            <Search className="w-4 h-4" />
            <span>Keywords (Optional)</span>
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => {
              setKeywords(e.target.value)
              setError(null)
            }}
            placeholder="e.g., art blog, creative agency, design studio"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent"
          />
        </div>

        {/* Locations Section */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
            <MapPin className="w-4 h-4" />
            <span>Locations (Required)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LOCATION_OPTIONS.map((loc) => {
              const isSelected = selectedLocations.includes(loc.value)
              return (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => toggleLocation(loc.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {loc.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Max Results */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Results
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleScrape}
            disabled={loading || !canStart()}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              canStart() && !loading
                ? 'bg-olive-600 text-white hover:bg-olive-700 shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Starting Scrape...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Scraping</span>
              </>
            )}
          </button>
          
          {!canStart() && (
            <p className="mt-2 text-xs text-center text-gray-500">
              {!keywords.trim() && selectedCategories.length === 0
                ? 'Select at least one category or enter keywords'
                : 'Select at least one location'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

