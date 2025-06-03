import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const projectId = params.projectId;
    
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
    
    return json({ images });
  } catch (error) {
    console.error('Error reading project images:', error);
    return json({ error: 'Failed to load images' }, { status: 500 });
  }
} 