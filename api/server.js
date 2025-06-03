const fs = require('fs');
const path = require('path');
const url = require('url');

// In-memory storage for settings (will persist during the session)
const projectSettings = {};

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
          "description": "Apple branding and design work",
          "active": true
        },
        {
          "id": "portfolio-2024", 
          "name": "Portfolio 2024",
          "description": "2024 portfolio pieces",
          "active": true
        },
        {
          "id": "sky-project",
          "name": "Sky Project", 
          "description": "Sky themed project",
          "active": true
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
    const settings = projectSettings[projectId] || { settings: {}, imageOrder: [] };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(settings));
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
      const newData = JSON.parse(body);
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
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: projectData }));
      
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
    // Return static image paths that match the actual static directory structure
    const imageData = {
      "apple-branding": [
        "/apple-branding/images/1-apple.png",
        "/apple-branding/images/11-apple-computer-music-poster.png",
        "/apple-branding/images/12-translucent-apple-poster.png",
        "/apple-branding/images/14-lifeline.png",
        "/apple-branding/images/16.png",
        "/apple-branding/images/19-starnote-necklace.png",
        "/apple-branding/images/1_front.png",
        "/apple-branding/images/2-1-apple-alt-1.png",
        "/apple-branding/images/2-2-apple-alt-2.png",
        "/apple-branding/images/21-starnote-necklace.png",
        "/apple-branding/images/22-apple-planet-day.png",
        "/apple-branding/images/3-1-starnote.svg",
        "/apple-branding/images/3-2-apple-starnote.svg",
        "/apple-branding/images/3-3-acg-starnote.svg",
        "/apple-branding/images/3-neon-starleaves-longsleeve-1.png",
        "/apple-branding/images/30-xxoplex-artwork.png",
        "/apple-branding/images/36-apple-poster.png",
        "/apple-branding/images/37-beautiful-superstar-poster.png",
        "/apple-branding/images/38-lifeline-poster.png",
        "/apple-branding/images/39-xxoplex-poster.png",
        "/apple-branding/images/4-ag-newton",
        "/apple-branding/images/5-apple-computer-music.png",
        "/apple-branding/images/6-apple-lettering.png",
        "/apple-branding/images/7-apple-sleeve.png",
        "/apple-branding/images/Badges2000.jpg",
        "/apple-branding/images/Frame3203.png",
        "/apple-branding/images/KazooLFGNew_.png",
        "/apple-branding/images/KazooSkate3.png",
        "/apple-branding/images/ShieldsPink.png",
        "/apple-branding/images/animation.svg",
        "/apple-branding/images/areasvg.svg",
        "/apple-branding/images/britpop.png",
        "/apple-branding/images/image1.png",
        "/apple-branding/images/stack.png",
        "/apple-branding/images/uitest.png"
      ],
      "portfolio-2024": [
        "/portfolio-2024/images/19-starnote-necklace.png",
        "/portfolio-2024/images/22-apple-planet-day.png",
        "/portfolio-2024/images/30-xxoplex-artwork.png",
        "/portfolio-2024/images/KazooSkate3.png",
        "/portfolio-2024/images/stack.png"
      ],
      "sky-project": [
        "/sky-project/images/1-apple.png",
        "/sky-project/images/14-lifeline.png",
        "/sky-project/images/16.png",
        "/sky-project/images/Frame3203.png",
        "/sky-project/images/ShieldsPink.png"
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