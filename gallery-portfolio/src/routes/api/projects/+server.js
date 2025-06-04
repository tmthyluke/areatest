import { json } from '@sveltejs/kit';

// Static project data to avoid Vercel authentication issues
const projectsData = {
  "projects": [
    {
      "id": "area",
      "title": "Area",
      "description": "Contemporary art gallery spaces",
      "date": "2024",
      "images": []
    },
    {
      "id": "nature",
      "title": "Nature Series", 
      "description": "Landscape photography collection",
      "date": "2023",
      "images": []
    },
    {
      "id": "urban",
      "title": "Urban Spaces",
      "description": "City architecture and street photography", 
      "date": "2023",
      "images": []
    }
  ]
};

export async function GET() {
  return json(projectsData);
} 