import { json } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECTS_FILE = join(process.cwd(), '..', 'projects', 'projects.json');

export async function GET() {
  try {
    const projectsData = JSON.parse(readFileSync(PROJECTS_FILE, 'utf8'));
    return json(projectsData);
  } catch (error) {
    console.error('Error reading projects:', error);
    return json({ error: 'Failed to load projects' }, { status: 500 });
  }
} 