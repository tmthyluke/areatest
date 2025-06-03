import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, parent }) {
  const projectId = params.project;
  
  try {
    // Get projects from parent layout
    const { projects } = await parent();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw error(404, `Project "${projectId}" not found`);
    }
    
    if (!project.active) {
      throw error(404, `Project "${projectId}" is not active`);
    }
    
    // Use relative URLs that work both locally and in production
    
    // Fetch project settings and images in parallel
    const [settingsResponse, imagesResponse] = await Promise.all([
      fetch(`/api/projects/${projectId}/settings`),
      fetch(`/api/projects/${projectId}/images`)
    ]);
    
    let projectSettings = null;
    let projectImages = null;
    
    if (settingsResponse.ok) {
      projectSettings = await settingsResponse.json();
    }
    
    if (imagesResponse.ok) {
      projectImages = await imagesResponse.json();
    }
    
    return {
      projectId,
      projectInfo: project,
      projectSettings,
      projectImages,
      // Include all projects for navigation
      allProjects: projects.filter(p => p.active)
    };
    
  } catch (err) {
    console.error('Error loading project:', err);
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load project data');
  }
} 