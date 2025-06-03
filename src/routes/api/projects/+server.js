import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    // Return the same hardcoded projects data as the Vercel function
    const projectsData = {
      "projects": [
        {
          "id": "apple-branding",
          "name": "Apple Branding",
          "description": "Apple branding and design work",
          "active": true
        },
        {
          "id": "portfolio-2024", 
          "name": "Portfolio 2024",
          "description": "2024 portfolio pieces",
          "active": true
        },
        {
          "id": "sky-project",
          "name": "Sky Project", 
          "description": "Sky themed project",
          "active": true
        }
      ]
    };
    
    return json(projectsData);
  } catch (error) {
    console.error('Error loading projects:', error);
    return json({ error: 'Failed to load projects' }, { status: 500 });
  }
} 