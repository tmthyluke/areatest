const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PROJECTS_FILE = path.join(__dirname, 'projects', 'projects.json');
const PROJECTS_DIR = path.join(__dirname, 'projects');
const IMAGES_DIR = path.join(__dirname, 'images');

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(204);
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
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

function handleGetProjects(res) {
  try {
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(projectsData));
  } catch (error) {
    console.error('Error reading projects:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to load projects' }));
  }
}

function handleGetProjectSettings(res, projectId) {
  try {
    const settingsFile = path.join(PROJECTS_DIR, projectId, 'settings.json');
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(settings));
    } else {
      // Return default settings if file doesn't exist
      const defaultSettings = { settings: {}, imageOrder: [] };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(defaultSettings));
  }
  } catch (error) {
    console.error('Error reading project settings:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
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
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
      
        } catch (error) {
      console.error('Error updating project settings:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update settings' }));
        }
  });
}

function handleGetProjectImages(res, projectId) {
  try {
    const imagesDir = path.join(PROJECTS_DIR, projectId, 'images');
    if (!fs.existsSync(imagesDir)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: [] }));
      return;
  }
    
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    const imagePaths = imageFiles.map(file => `/api/projects/${projectId}/images/${file}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ images: imagePaths }));
  } catch (error) {
    console.error('Error reading project images:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to load images' }));
  }
}

function handleGetProjectImage(req, res, projectId, filename) {
  try {
    const imagePath = path.join(PROJECTS_DIR, projectId, 'images', filename);
    
    if (!fs.existsSync(imagePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image not found' }));
      return;
    }
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end();
      return;
    }
    
    const imageStream = fs.createReadStream(imagePath);
    res.writeHead(200, { 'Content-Type': contentType });
    imageStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to serve image' }));
  }
}

function handleGetProjectDescription(res, projectId) {
  try {
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    const project = projectsData.projects.find(p => p.id === projectId);
    
    if (project) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ description: project.description }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Project not found' }));
    }
  } catch (error) {
    console.error('Error reading project description:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
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
      console.log('Updating legacy settings (apple-branding):', settings);
      
      // Default to apple-branding for legacy compatibility
      handlePostProjectSettings(req, res, 'apple-branding');
    } catch (error) {
      console.error('Error processing legacy settings:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

function handleStaticImage(res, pathname) {
  try {
    const imagePath = path.join(IMAGES_DIR, pathname.replace('/images/', ''));
    
    if (!fs.existsSync(imagePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image not found' }));
      return;
    }
    
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    const imageStream = fs.createReadStream(imagePath);
        res.writeHead(200, { 'Content-Type': contentType });
    imageStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving static image:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to serve image' }));
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Projects API available at http://localhost:${PORT}/api/projects`);
  console.log(`Legacy API still available at http://localhost:${PORT}/api/settings`);
});