import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
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

  const { project: projectId } = params;
  const images = projectImages[projectId] || [];
  
  return {
    projectId,
    images,
    settings: { settings: {}, imageOrder: [] }
  };
} 