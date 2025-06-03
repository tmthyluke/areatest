const fs = require('fs');
const path = require('path');
const url = require('url');

// Vercel serverless function handler
module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  console.log(`${method} ${pathname}`);

  try {
    // GET /api/projects - List all projects
    if (pathname === '/api/projects' && method === 'GET') {
      handleGetProjects(res);
    }
    // GET /api/projects/{projectId}/settings - Get project settings
    else if (pathname.match(/^\/api\/projects\/([^\/]+)\/settings$/) && method === 'GET') {
      const projectId = pathname.match(/^\/api\/projects\/([^\/]+)\/settings$/)[1];
      handleGetProjectSettings(res, projectId);
    }
    // POST /api/projects/{projectId}/settings - Update project settings
    else if (pathname.match(/^\/api\/projects\/([^\/]+)\/settings$/) && method === 'POST') {
      const projectId = pathname.match(/^\/api\/projects\/([^\/]+)\/settings$/)[1];
      handlePostProjectSettings(req, res, projectId);
    }
    // GET /api/projects/{projectId}/images - List project images
    else if (pathname.match(/^\/api\/projects\/([^\/]+)\/images$/) && method === 'GET') {
      const projectId = pathname.match(/^\/api\/projects\/([^\/]+)\/images$/)[1];
      handleGetProjectImages(res, projectId);
    }
    // GET /api/projects/{projectId}/description - Get project description  
    else if (pathname.match(/^\/api\/projects\/([^\/]+)\/description$/) && method === 'GET') {
      const projectId = pathname.match(/^\/api\/projects\/([^\/]+)\/description$/)[1];
      handleGetProjectDescription(res, projectId);
    }
    // Legacy API compatibility
    else if (pathname === '/api/settings' && method === 'POST') {
      handleLegacySettings(req, res);
    }
    // 404 for unhandled routes
    else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};

function handleGetProjects(res) {
  try {
    // Return hardcoded projects data since we can't read files in serverless
    const projectsData = {
      "projects": [
        {
          "id": "apple-branding",
          "name": "Apple Branding",
          "description": "Apple branding and design work"
        },
        {
          "id": "portfolio-2024", 
          "name": "Portfolio 2024",
          "description": "2024 portfolio pieces"
        },
        {
          "id": "sky-project",
          "name": "Sky Project", 
          "description": "Sky themed project"
        }
      ]
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(projectsData));
  } catch (error) {
    console.error('Error reading projects:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load projects' }));
  }
}

function handleGetProjectSettings(res, projectId) {
  try {
    // Return default settings since we can't persistently store in serverless
    const defaultSettings = { settings: {}, imageOrder: [] };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(defaultSettings));
  } catch (error) {
    console.error('Error reading project settings:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load project settings' }));
  }
}

function handlePostProjectSettings(req, res, projectId) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const newSettings = JSON.parse(body);
      console.log(`Settings update for ${projectId}:`, newSettings);
      
      // In a serverless environment, settings can't be persisted to files
      // You'd typically save to a database here
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, note: 'Settings received but not persisted in demo' }));
      
    } catch (error) {
      console.error('Error updating project settings:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to update settings' }));
    }
  });
}

function handleGetProjectImages(res, projectId) {
  try {
    // Return static image paths instead of reading from filesystem
    const imageData = {
      "apple-branding": [
        "/projects/apple-branding/images/1-apple.png",
        "/projects/apple-branding/images/2-1-apple-alt-1.png",
        "/projects/apple-branding/images/2-2-apple-alt-2.png",
        "/projects/apple-branding/images/3-1-starnote.svg",
        "/projects/apple-branding/images/3-2-apple-starnote.svg",
        "/projects/apple-branding/images/5-apple-computer-music.png",
        "/projects/apple-branding/images/6-apple-lettering.png",
        "/projects/apple-branding/images/7-apple-sleeve.png"
      ],
      "portfolio-2024": [
        "/projects/portfolio-2024/images/19-starnote-necklace.png",
        "/projects/portfolio-2024/images/22-apple-planet-day.png",
        "/projects/portfolio-2024/images/30-xxoplex-artwork.png",
        "/projects/portfolio-2024/images/KazooSkate3.png",
        "/projects/portfolio-2024/images/stack.png"
      ],
      "sky-project": [
        "/projects/sky-project/images/1-apple.png",
        "/projects/sky-project/images/14-lifeline.png",
        "/projects/sky-project/images/16.png",
        "/projects/sky-project/images/Frame3203.png",
        "/projects/sky-project/images/ShieldsPink.png"
      ]
    };
    
    const images = imageData[projectId] || [];
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ images }));
  } catch (error) {
    console.error('Error reading project images:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load images' }));
  }
}

function handleGetProjectDescription(res, projectId) {
  try {
    const descriptions = {
      "apple-branding": "Apple branding and design work showcasing various logo concepts and applications.",
      "portfolio-2024": "Latest portfolio pieces from 2024 featuring diverse creative work.",
      "sky-project": "Sky-themed creative project exploring atmospheric design concepts."
    };
    
    const description = descriptions[projectId] || "No description available.";
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(description);
  } catch (error) {
    console.error('Error reading project description:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load description' }));
  }
}

function handleLegacySettings(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const settings = JSON.parse(body);
      console.log('Legacy settings update:', settings);
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error processing legacy settings:', error);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
} 