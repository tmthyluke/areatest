import { error } from '@sveltejs/kit';
import { existsSync, createReadStream } from 'fs';
import { join, extname } from 'path';

const PROJECTS_DIR = join(process.cwd(), 'projects');

export async function GET({ params, request }) {
  try {
    const { projectId, filename } = params;
    const imagePath = join(PROJECTS_DIR, projectId, 'images', filename);
    
    if (!existsSync(imagePath)) {
      throw error(404, 'Image not found');
    }
    
    const ext = extname(filename).toLowerCase();
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
    
    // Handle HEAD requests
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Type': contentType
        }
      });
    }
    
    // Return the image file
    const imageStream = createReadStream(imagePath);
    return new Response(imageStream, {
      status: 200,
      headers: {
        'Content-Type': contentType
      }
    });
    
  } catch (err) {
    console.error('Error serving image:', err);
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to serve image');
  }
}

export async function HEAD({ params }) {
  return GET({ params, request: { method: 'HEAD' } });
} 