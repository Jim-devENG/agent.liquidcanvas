'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, Plus, Trash2, Edit2 } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  category?: string
  subject_template: string
  body_template: string
  is_active: boolean
  is_default: boolean
  variables?: Record<string, string>
  description?: string
}

interface TemplateVariables {
  variables: Record<string, string>
  example: {
    subject: string
    body: string
  }
}

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [variables, setVariables] = useState<TemplateVariables | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject_template: '',
    body_template: '',
    description: '',
    is_active: true,
    is_default: false
  })

  useEffect(() => {
    loadTemplates()
    loadVariables()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/templates`
      )
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVariables = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/templates/variables`
      )
      if (response.ok) {
        const data = await response.json()
        setVariables(data)
      }
    } catch (error) {
      console.error('Error loading variables:', error)
    }
  }

  const handleNewTemplate = () => {
    setFormData({
      name: '',
      category: '',
      subject_template: 'Collaboration Opportunity for {business_name}',
      body_template: 'Hello {recipient_name},\n\nI discovered {business_name} and was impressed by {business_context}.\n\n{personalized_intro}\n\n{specific_offer}\n\nBest regards,\n{your_name}',
      description: '',
      is_active: true,
      is_default: false
    })
    setSelectedTemplate(null)
    setEditing(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      category: template.category || '',
      subject_template: template.subject_template,
      body_template: template.body_template,
      description: template.description || '',
      is_active: template.is_active,
      is_default: template.is_default
    })
    setSelectedTemplate(template)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = selectedTemplate
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/templates/${selectedTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/templates`
      
      const method = selectedTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadTemplates()
        setEditing(false)
        setSelectedTemplate(null)
      } else {
        const error = await response.json()
        alert(`Failed to save template: ${error.detail || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/templates/${templateId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await loadTemplates()
      } else {
        const error = await response.json()
        alert(`Failed to delete template: ${error.detail || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const categories = [
    'art_gallery',
    'interior_decor',
    'home_tech',
    'mom_blogs',
    'nft_tech',
    'editorial_media',
    'holiday_family',
    'default'
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Email Templates
        </h2>
        <button
          onClick={handleNewTemplate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                placeholder="e.g., Art Gallery Outreach"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">Default (all categories)</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              placeholder="Template description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Template *
            </label>
            <input
              type="text"
              value={formData.subject_template}
              onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-sm"
              placeholder="e.g., Collaboration Opportunity for {business_name}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables like {'{business_name}'}, {'{recipient_name}'}, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Template *
            </label>
            <textarea
              value={formData.body_template}
              onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-sm"
              placeholder="Email body template..."
            />
          </div>

          {variables && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Variables:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(variables.variables).map(([key, desc]) => (
                  <div key={key}>
                    <code className="text-primary-600">{`{${key}}`}</code>
                    <span className="text-gray-600 ml-2">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Default for category</span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.subject_template || !formData.body_template}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setSelectedTemplate(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No templates yet. Create your first template to customize email messages.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                      {!template.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {template.category && (
                      <p className="text-sm text-gray-600 mb-2">
                        Category: <span className="font-medium">{template.category}</span>
                      </p>
                    )}
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        <strong>Subject:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{template.subject_template.substring(0, 60)}...</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

