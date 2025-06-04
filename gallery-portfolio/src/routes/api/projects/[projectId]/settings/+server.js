import { json } from '@sveltejs/kit';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECTS_DIR = join(process.cwd(), '..', 'projects');

export async function GET({ params }) {
  try {
    const { projectId } = params;
    const settingsFile = join(PROJECTS_DIR, projectId, 'settings.json');
    
    if (existsSync(settingsFile)) {
      const settings = JSON.parse(readFileSync(settingsFile, 'utf8'));
      return json(settings);
    } else {
      // Return default settings if file doesn't exist
      const defaultSettings = { settings: {}, imageOrder: [] };
      return json(defaultSettings);
    }
  } catch (error) {
    console.error('Error reading project settings:', error);
    return json({ error: 'Failed to load project settings' }, { status: 500 });
  }
}

export async function POST({ params, request }) {
  try {
    const { projectId } = params;
    const newSettings = await request.json();
    
    // Ensure project directory exists
    const projectDir = join(PROJECTS_DIR, projectId);
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }
    
    const settingsFile = join(projectDir, 'settings.json');
    
    // Read existing settings or create default
    let existingSettings = { settings: {}, imageOrder: [] };
    if (existsSync(settingsFile)) {
      existingSettings = JSON.parse(readFileSync(settingsFile, 'utf8'));
    }
    
    // Handle full reorder operation
    if (newSettings.fullReorder === true && Array.isArray(newSettings.newOrder)) {
      console.log(`Updating project ${projectId} settings:`, newSettings);
      existingSettings.imageOrder = newSettings.newOrder;
    }
    // Handle individual image settings
    else if (newSettings.imageId) {
      console.log(`Updating project ${projectId} settings:`, newSettings);
      existingSettings.settings[newSettings.imageId] = existingSettings.settings[newSettings.imageId] || {};
      
      if (newSettings.units !== undefined) {
        existingSettings.settings[newSettings.imageId].units = newSettings.units;
      }
      if (newSettings.isFill !== undefined) {
        existingSettings.settings[newSettings.imageId].isFill = newSettings.isFill;
      }
      if (newSettings.caption !== undefined) {
        existingSettings.settings[newSettings.imageId].caption = newSettings.caption;
      }
    }
    
    // Save updated settings
    writeFileSync(settingsFile, JSON.stringify(existingSettings, null, 2), 'utf8');
    
    return json({ success: true });
    
  } catch (error) {
    console.error('Error updating project settings:', error);
    return json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 