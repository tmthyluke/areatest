import { json } from '@sveltejs/kit';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const projectId = params.projectId;
    const settingsPath = join('static', projectId, 'settings.json');
    
    if (existsSync(settingsPath)) {
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent);
      return json(settings);
    } else {
      // Return empty structure if file doesn't exist
      return json({ settings: {}, imageOrder: [] });
    }
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
    
    const settingsPath = join('static', projectId, 'settings.json');
    
    // Read existing settings or create new structure
    let projectData = { settings: {}, imageOrder: [] };
    if (existsSync(settingsPath)) {
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      projectData = JSON.parse(settingsContent);
    }
    
    if (newData.fullReorder && newData.newOrder) {
      // Handle full reorder
      projectData.imageOrder = newData.newOrder;
      console.log(`Updated image order for ${projectId}:`, newData.newOrder);
    } else if (newData.imageId) {
      // Handle individual image setting update
      if (!projectData.settings[newData.imageId]) {
        projectData.settings[newData.imageId] = {};
      }
      
      const imageSettings = projectData.settings[newData.imageId];
      if (typeof newData.units !== 'undefined') imageSettings.units = newData.units;
      if (typeof newData.isFill !== 'undefined') imageSettings.isFill = newData.isFill;
      if (typeof newData.caption !== 'undefined') imageSettings.caption = newData.caption;
      
      console.log(`Updated settings for ${newData.imageId} in ${projectId}:`, imageSettings);
    }
    
    // Write back to file
    writeFileSync(settingsPath, JSON.stringify(projectData, null, 2));
    
    return json({ 
      success: true, 
      message: `Settings updated for ${projectId}`,
      data: projectData 
    });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return json({ error: 'Failed to update project settings' }, { status: 500 });
  }
} 