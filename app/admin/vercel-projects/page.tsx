'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Cloud,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { StaffGate } from '@/components/admin/StaffGate'
import type { VercelProject } from '@/lib/vercel-client'

interface ProjectWithFiltered extends VercelProject {
  _displayName: string
}

export default function VercelProjectsPage() {
  return (
    <StaffGate>
      <VercelProjectsList />
    </StaffGate>
  )
}

function VercelProjectsList() {
  const [projects, setProjects] = useState<VercelProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'deployed' | 'building' | 'failed'>(
    'all'
  )
  const [search, setSearch] = useState('')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vercel-projects')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      filter === 'all' || project.status === filter
    const matchesSearch = project.name
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: VercelProject['status']) => {
    switch (status) {
      case 'deployed':
        return 'bg-whatsapp text-white'
      case 'building':
        return 'bg-blue-600 text-white'
      case 'failed':
        return 'bg-orange-600 text-white'
      case 'queued':
        return 'bg-darkgrey text-mist'
      default:
        return 'bg-cardgrey text-mist'
    }
  }

  const getStatusLabel = (status: VercelProject['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`

    const months = Math.floor(diffDays / 30)
    if (months < 12) return `${months}mo ago`

    const years = Math.floor(diffDays / 365)
    return `${years}y ago`
  }

  return (
    <div className="bg-jet px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-orange" />
            <h1 className="text-3xl font-display font-bold">Vercel Projects</h1>
          </div>
          <button
            onClick={loadProjects}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange text-jet rounded-card font-bold text-sm hover:bg-orange/90 disabled:opacity-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-mist" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-cardgrey border border-darkgrey rounded-card text-paper placeholder-mist focus:outline-none focus:border-orange"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { label: 'All', value: 'all' },
                { label: 'Deployed', value: 'deployed' },
                { label: 'Building', value: 'building' },
                { label: 'Failed', value: 'failed' },
              ] as const
            ).map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                className={`px-4 py-1.5 rounded-card text-sm font-bold transition ${
                  filter === value
                    ? 'bg-orange text-jet'
                    : 'bg-cardgrey text-paper hover:bg-darkgrey'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-orange/10 border border-orange/30 rounded-card px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange font-bold">Error loading projects</p>
              <p className="text-mist text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 text-darkgrey mx-auto mb-3 opacity-50" />
            <p className="text-mist">
              {projects.length === 0
                ? 'No projects found. Check your Vercel API token.'
                : 'No projects match your filters.'}
            </p>
          </div>
        )}

        {/* Projects List */}
        {!loading && !error && filteredProjects.length > 0 && (
          <ul className="bg-cardgrey border border-darkgrey rounded-card divide-y divide-darkgrey">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-jet/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-paper font-bold truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-mist">
                    {project.framework && (
                      <span>{project.framework}</span>
                    )}
                    {project.framework && project.createdAt && (
                      <span>•</span>
                    )}
                    {project.createdAt && (
                      <span>{formatDate(project.createdAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-card whitespace-nowrap ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>

                  {/* External Link */}
                  {project.url && (
                    <a
                      href={`https://${project.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-darkgrey rounded-card transition"
                      title="Visit project URL"
                    >
                      <ExternalLink className="w-4 h-4 text-mist" />
                    </a>
                  )}

                  {/* Vercel Dashboard Link */}
                  <a
                    href={`https://vercel.com/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-darkgrey rounded-card transition"
                    title="View on Vercel"
                  >
                    <Cloud className="w-4 h-4 text-orange" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Summary Footer */}
        {!loading && !error && projects.length > 0 && (
          <div className="mt-4 text-sm text-mist text-center">
            Showing {filteredProjects.length} of {projects.length} project
            {projects.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
