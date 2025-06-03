import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SETTINGS_FILE = path.join(__dirname, 'image-settings.json');
const IMAGES_DIRECTORY = path.join(__dirname, 'static', 'images');

// Ensure the images directory exists
if (!fs.existsSync(IMAGES_DIRECTORY)) {
  console.warn(`Images directory not found at ${IMAGES_DIRECTORY}, creating it...`);
  try {
    fs.mkdirSync(IMAGES_DIRECTORY, { recursive: true });
    console.log(`Created images directory at ${IMAGES_DIRECTORY}`);
  } catch (err) {
    console.error(`Failed to create images directory: ${err.message}`);
  }
}

// Ensure settings file exists with proper structure
if (!fs.existsSync(SETTINGS_FILE)) {
  console.warn(`Settings file not found at ${SETTINGS_FILE}, creating it...`);
  try {
    const defaultSettings = {
      settings: {},
      imageOrder: []
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
    console.log(`Created settings file at ${SETTINGS_FILE}`);
  } catch (err) {
    console.error(`Failed to create settings file: ${err.message}`);
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint to get list of images in the images directory
  if (pathname === '/api/images' && req.method === 'GET') {
    // Read the images directory
    fs.readdir(IMAGES_DIRECTORY, (err, files) => {
      if (err) {
        console.error('Error reading images directory:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read images directory' }));
        return;
      }
      
      // Filter for image files only
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      });
      
      // Format paths relative to the site root
      const imagePaths = imageFiles.map(file => `images/${file}`);
      
      // Return the list of image paths
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: imagePaths }));
    });
  }
  // API endpoint to get image settings
  else if (pathname === '/api/settings' && req.method === 'GET') {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading settings file:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read settings' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  }
  // API endpoint to update image settings
  else if (pathname === '/api/settings' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const settings = JSON.parse(body);
        
        // Read existing settings from file
        let existingSettings = {};
        try {
          const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
          existingSettings = JSON.parse(fileData);
          
          // Ensure the structure is correct
          if (!existingSettings.settings) {
            existingSettings.settings = {};
          }
          if (!existingSettings.imageOrder) {
            existingSettings.imageOrder = [];
          }
          
          // Handle full reorder operation
          if (settings.fullReorder === true && Array.isArray(settings.newOrder)) {
            console.log('Updating full image order:', settings.newOrder);
            existingSettings.imageOrder = settings.newOrder;
          }
          // Handle individual image settings
          else if (settings.imageId) {
            // Create or update the settings object for this image
            existingSettings.settings[settings.imageId] = existingSettings.settings[settings.imageId] || {};
            
            // Update with new values, preserving any existing values not specified
            if (settings.units !== undefined) {
              existingSettings.settings[settings.imageId].units = settings.units;
            }
            
            if (settings.isFill !== undefined) {
              existingSettings.settings[settings.imageId].isFill = settings.isFill;
            }
            
            // Add caption if provided
            if (settings.caption !== undefined) {
              existingSettings.settings[settings.imageId].caption = settings.caption;
            }
            
            // Handle individual image order update
            if (settings.order !== undefined) {
              // Remove the image ID from the current order if it exists
              existingSettings.imageOrder = existingSettings.imageOrder.filter(id => id !== settings.imageId);
              
              // Insert at the specified position or append to the end
              const position = typeof settings.order === 'number' ? settings.order : existingSettings.imageOrder.length;
              existingSettings.imageOrder.splice(position, 0, settings.imageId);
            }
          }
          
          // Write updated settings back to file
          fs.writeFile(SETTINGS_FILE, JSON.stringify(existingSettings, null, 2), 'utf8', (err) => {
            if (err) {
              console.error('Error writing settings file:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save settings' }));
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        } catch (error) {
          console.error('Error processing settings:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process settings' }));
        }
      } catch (error) {
        console.error('Error parsing request body:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
  // Serve static files
  else {
    let filePath = path.join(__dirname, pathname === '/' ? 'WORKING BEST 2 copy.html' : pathname);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
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

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('404 Not Found');
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Images directory: ${IMAGES_DIRECTORY}`);
  console.log(`Settings file: ${SETTINGS_FILE}`);
});
