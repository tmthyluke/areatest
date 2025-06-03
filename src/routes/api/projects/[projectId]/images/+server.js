import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const projectId = params.projectId;
    
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
    
    return json({ images });
  } catch (error) {
    console.error('Error reading project images:', error);
    return json({ error: 'Failed to load images' }, { status: 500 });
  }
} 