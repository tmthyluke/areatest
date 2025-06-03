/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }) {
  try {
    const projectsResponse = await fetch('http://localhost:3000/api/projects');
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