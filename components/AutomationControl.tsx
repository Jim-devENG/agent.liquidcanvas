'use client'

import { useState, useEffect } from 'react'
import { Power, Zap, MapPin, Tag, Loader2, CheckCircle } from 'lucide-react'
import { getAutomationSettings, updateAutomationSettings, type AutomationSettings } from '@/lib/api'

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

export default function AutomationControl() {
  const [settings, setSettings] = useState<AutomationSettings>({
    enabled: false,
    automatic_scraper: false,
    locations: ['usa'],
    categories: [],
    keywords: '',
    max_results: 100,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getAutomationSettings()
      setSettings(data)
    } catch (error: any) {
      console.error('Failed to load automation settings:', error)
      // Use defaults if API fails
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updates: Partial<AutomationSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSaving(true)
    setSaveSuccess(false)
    try {
      const saved = await updateAutomationSettings(newSettings)
      setSettings(saved)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error: any) {
      console.error('Failed to save automation settings:', error)
      alert(`Failed to save settings: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleLocation = (value: string) => {
    const newLocations = settings.locations.includes(value)
      ? settings.locations.filter((v) => v !== value)
      : [...settings.locations, value]
    
    if (newLocations.length > 0) {
      saveSettings({ locations: newLocations })
    }
  }

  const toggleCategory = (value: string) => {
    const newCategories = settings.categories.includes(value)
      ? settings.categories.filter((v) => v !== value)
      : [...settings.categories, value]
    
    saveSettings({ categories: newCategories })
  }

  const toggleMasterSwitch = async (enabled: boolean) => {
    await saveSettings({ enabled })
    if (!enabled) {
      // If disabling master, also disable scraper
      await saveSettings({ automatic_scraper: false })
    }
  }

  const toggleAutomaticScraper = async (enabled: boolean) => {
    if (!settings.enabled) {
      alert('Please enable Master Switch first')
      return
    }
    if (enabled && settings.locations.length === 0) {
      alert('Please select at least one location first')
      return
    }
    await saveSettings({ automatic_scraper: enabled })
  }

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-olive-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Automation Control</h2>
        {saving && (
          <Loader2 className="w-4 h-4 animate-spin text-olive-600" />
        )}
        {saveSuccess && !saving && (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
      </div>

      <div className="space-y-6">
        {/* Master Switch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Power className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-semibold text-gray-900">Master Switch</p>
              <p className="text-sm text-gray-600">Enable/disable all automation</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => toggleMasterSwitch(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-olive-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
          </label>
        </div>

        {/* Automatic Scraper */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-semibold text-gray-900">Automatic Scraper</p>
              <p className="text-sm text-gray-600">Run scraping jobs automatically</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.automatic_scraper && settings.enabled}
              disabled={!settings.enabled || saving}
              onChange={(e) => toggleAutomaticScraper(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer ${
              settings.enabled 
                ? 'bg-gray-200 peer-checked:bg-olive-600' 
                : 'bg-gray-100 cursor-not-allowed'
            }`}></div>
          </label>
        </div>

        {/* Location Selection */}
        {settings.enabled && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
              <MapPin className="w-4 h-4" />
              <span>Locations for Automatic Scraping</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {LOCATION_OPTIONS.map((loc) => {
                const isSelected = settings.locations.includes(loc.value)
                return (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => toggleLocation(loc.value)}
                    disabled={saving}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loc.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Category Selection */}
        {settings.enabled && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
              <Tag className="w-4 h-4" />
              <span>Categories for Automatic Scraping</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = settings.categories.includes(cat.value)
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    disabled={saving}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-olive-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
