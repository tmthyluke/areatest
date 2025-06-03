/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }) {
  try {
    // Use relative URL that works both locally and in production
    const projectsResponse = await fetch('/api/projects');
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      return {
        projects: projectsData.projects || []
      };
    }
  } catch (err) {
    console.error('Failed to load projects in layout:', err);
  }
  
  return {
    projects: []
  };
} 