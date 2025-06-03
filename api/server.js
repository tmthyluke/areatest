const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PROJECTS_FILE = path.join(process.cwd(), 'projects', 'projects.json');
const PROJECTS_DIR = path.join(process.cwd(), 'projects');
const IMAGES_DIR = path.join(process.cwd(), 'images');

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
    // GET /api/projects/{projectId}/images/{filename} - Get specific image
    else if (pathname.match(/^\/api\/projects\/([^\/]+)\/images\/(.+)$/) && (method === 'GET' || method === 'HEAD')) {
      const matches = pathname.match(/^\/api\/projects\/([^\/]+)\/images\/(.+)$/);
      const projectId = matches[1];
      const filename = matches[2];
      handleGetProjectImage(req, res, projectId, filename);
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
    // Serve static images from /images directory
    else if (pathname.startsWith('/images/') && method === 'GET') {
      handleStaticImage(res, pathname);
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
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
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
    const settingsFile = path.join(PROJECTS_DIR, projectId, 'settings.json');
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(settings));
    } else {
      // Return default settings if file doesn't exist
      const defaultSettings = { settings: {}, imageOrder: [] };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(defaultSettings));
    }
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
      
      // Ensure project directory exists
      const projectDir = path.join(PROJECTS_DIR, projectId);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      
      const settingsFile = path.join(projectDir, 'settings.json');
      
      // Read existing settings or create default
      let existingSettings = { settings: {}, imageOrder: [] };
      if (fs.existsSync(settingsFile)) {
        existingSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
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
      fs.writeFileSync(settingsFile, JSON.stringify(existingSettings, null, 2), 'utf8');
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      
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
    const imagesDir = path.join(PROJECTS_DIR, projectId, 'images');
    if (!fs.existsSync(imagesDir)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ images: [] }));
      return;
    }
    
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    const imagePaths = imageFiles.map(file => `/api/projects/${projectId}/images/${file}`);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ images: imagePaths }));
  } catch (error) {
    console.error('Error reading project images:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load images' }));
  }
}

function handleGetProjectImage(req, res, projectId, filename) {
  try {
    const imagePath = path.join(PROJECTS_DIR, projectId, 'images', filename);
    
    if (!fs.existsSync(imagePath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Image not found' }));
      return;
    }
    
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    if (req.method === 'HEAD') {
      const stats = fs.statSync(imagePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.end();
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    
    const imageStream = fs.createReadStream(imagePath);
    imageStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving project image:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to serve image' }));
  }
}

function handleGetProjectDescription(res, projectId) {
  try {
    const descriptionFile = path.join(PROJECTS_DIR, projectId, 'description.md');
    if (fs.existsSync(descriptionFile)) {
      const description = fs.readFileSync(descriptionFile, 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(description);
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Description not found' }));
    }
  } catch (error) {
    console.error('Error reading project description:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load description' }));
  }
}

function handleLegacySettings(req, res) {
  // Legacy endpoint that maps to apple-branding project
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

function handleStaticImage(res, pathname) {
  try {
    const imagePath = path.join(IMAGES_DIR, pathname.replace('/images/', ''));
    
    if (!fs.existsSync(imagePath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Image not found' }));
      return;
    }
    
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    
    const imageStream = fs.createReadStream(imagePath);
    imageStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving static image:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to serve image' }));
  }
} 