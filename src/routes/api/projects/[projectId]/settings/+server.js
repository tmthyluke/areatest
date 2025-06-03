import { json } from '@sveltejs/kit';

// In-memory storage for settings (will persist during the session)
const projectSettings = {};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const projectId = params.projectId;
    const settings = projectSettings[projectId] || { settings: {}, imageOrder: [] };
    return json(settings);
  } catch (error) {
    console.error('Error reading project settings:', error);
    return json({ error: 'Failed to load project settings' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, params }) {
  try {
    const projectId = params.projectId;
    const newData = await request.json();
    console.log(`Settings update for ${projectId}:`, newData);
    
    // Initialize project settings if they don't exist
    if (!projectSettings[projectId]) {
      projectSettings[projectId] = { settings: {}, imageOrder: [] };
    }
    
    const projectData = projectSettings[projectId];
    
    if (newData.fullReorder && newData.newOrder) {
      // Handle full reorder
      projectData.imageOrder = newData.newOrder;
      console.log(`Updated image order for ${projectId}:`, newData.newOrder);
    } else if (newData.imageId) {
      // Handle individual image settings
      const { imageId, units, isFill, caption } = newData;
      
      // Update or create settings for this image
      projectData.settings[imageId] = {
        units: units,
        isFill: isFill,
        caption: caption || projectData.settings[imageId]?.caption || imageId
      };
      
      console.log(`Updated settings for ${imageId} in ${projectId}:`, projectData.settings[imageId]);
    }
    
    return json({ success: true, data: projectData });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 