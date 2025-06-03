import { text, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const projectId = params.projectId;
    
    const descriptions = {
      "apple-branding": "Apple branding and design work showcasing various logo concepts and applications.",
      "portfolio-2024": "Latest portfolio pieces from 2024 featuring diverse creative work.",
      "sky-project": "Sky-themed creative project exploring atmospheric design concepts."
    };
    
    const description = descriptions[projectId] || "No description available.";
    return text(description);
  } catch (error) {
    console.error('Error reading project description:', error);
    return json({ error: 'Failed to load description' }, { status: 500 });
  }
} 