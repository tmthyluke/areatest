import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    // Return default settings since we can't persistently store in serverless
    const defaultSettings = { settings: {}, imageOrder: [] };
    return json(defaultSettings);
  } catch (error) {
    console.error('Error reading project settings:', error);
    return json({ error: 'Failed to load project settings' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, params }) {
  try {
    const newSettings = await request.json();
    console.log(`Settings update for ${params.projectId}:`, newSettings);
    
    // In a serverless environment, settings can't be persisted to files
    // You'd typically save to a database here
    return json({ success: true, note: 'Settings received but not persisted in demo' });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 