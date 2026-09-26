export interface VercelProject {
  id: string
  name: string
  status: 'deployed' | 'building' | 'failed' | 'queued'
  framework: string | null
  createdAt: string
  latestDeploymentTime: string | null
  url: string | null
}

interface VercelAPIProject {
  id: string
  name: string
  createdAt: number
  latestDeployments?: Array<{
    state: string
    createdAt: number
  }>
  framework?: string | null
  link?: {
    production?: string[]
  }
}

function mapVercelStatus(state: string): VercelProject['status'] {
  switch (state?.toUpperCase()) {
    case 'READY':
      return 'deployed'
    case 'IN_PROGRESS':
      return 'building'
    case 'ERROR':
      return 'failed'
    case 'QUEUED':
      return 'queued'
    default:
      return 'queued'
  }
}

export async function listProjects(): Promise<VercelProject[]> {
  const token = process.env.VERCEL_API_TOKEN

  if (!token) {
    throw new Error(
      'VERCEL_API_TOKEN environment variable is not set. Add it to your Vercel dashboard environment variables.'
    )
  }

  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid VERCEL_API_TOKEN. Check your token in Vercel dashboard.')
      }
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { projects: VercelAPIProject[] }
    const projects = data.projects || []

    return projects.map((project: VercelAPIProject) => {
      const latestDeployment = project.latestDeployments?.[0]
      const status = latestDeployment?.state
        ? mapVercelStatus(latestDeployment.state)
        : 'queued'

      return {
        id: project.id,
        name: project.name,
        status,
        framework: project.framework || null,
        createdAt: new Date(project.createdAt).toISOString(),
        latestDeploymentTime: latestDeployment
          ? new Date(latestDeployment.createdAt).toISOString()
          : null,
        url: project.link?.production?.[0] || null,
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch Vercel projects')
  }
}
