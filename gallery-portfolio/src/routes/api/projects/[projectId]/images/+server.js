import { json } from '@sveltejs/kit';
import { readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const PROJECTS_DIR = join(process.cwd(), '..', 'projects');

export async function GET({ params }) {
  try {
    const { projectId } = params;
    const imagesDir = join(PROJECTS_DIR, projectId, 'images');
    
    if (!existsSync(imagesDir)) {
      return json({ images: [] });
    }
    
    const files = readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    const imagePaths = imageFiles.map(file => `/api/projects/${projectId}/images/${file}`);
    
    return json({ images: imagePaths });
  } catch (error) {
    console.error('Error reading project images:', error);
    return json({ error: 'Failed to load images' }, { status: 500 });
  }
} 