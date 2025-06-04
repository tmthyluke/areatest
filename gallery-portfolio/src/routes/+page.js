// Static project data - no API calls needed
export async function load() {
  const projects = [
    {
      id: "area",
      name: "Area",
      title: "Area",
      description: "Contemporary art gallery spaces",
      date: "2024",
      active: true,
      images: []
    },
    {
      id: "nature", 
      name: "Nature Series",
      title: "Nature Series",
      description: "Landscape photography collection",
      date: "2023",
      active: true,
      images: []
    },
    {
      id: "urban",
      name: "Urban Spaces",
      title: "Urban Spaces", 
      description: "City architecture and street photography",
      date: "2023",
      active: true,
      images: []
    }
  ];

  return {
    projects
  };
} 