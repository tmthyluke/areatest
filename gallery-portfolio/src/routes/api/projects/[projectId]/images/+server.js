import { json } from '@sveltejs/kit';

// Static image data for each project - using actual images from /static/images/
const projectImages = {
  "area": [
    "/images/1-apple.png",
    "/images/KazooSkate3.png", 
    "/images/britpop.png",
    "/images/38-lifeline-poster.png",
    "/images/6-apple-lettering.png"
  ],
  "nature": [
    "/images/12-translucent-apple-poster.png",
    "/images/stack.png",
    "/images/37-beautiful-superstar-poster.png"
  ],
  "urban": [
    "/images/Badges2000.jpg",
    "/images/KazooLFGNew_.png",
    "/images/39-xxoplex-poster.png",
    "/images/36-apple-poster.png"
  ]
};

export async function GET({ params }) {
  const { projectId } = params;
  const images = projectImages[projectId] || [];
  return json({ images });
} 