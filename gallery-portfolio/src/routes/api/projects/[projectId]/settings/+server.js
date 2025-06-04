import { json } from '@sveltejs/kit';

// Default settings for all projects
const defaultSettings = { 
  settings: {}, 
  imageOrder: [] 
};

export async function GET({ params }) {
  return json(defaultSettings);
}

export async function POST({ params, request }) {
  // For demo purposes, just return success without persisting
  // In a real deployment, you'd want to use a database
  return json({ success: true });
} 