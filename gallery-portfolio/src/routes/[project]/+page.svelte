<script>
  import ModularGallery from '$lib/components/ModularGallery.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  // Data is now pre-loaded via +page.js with static data
  $: ({ projectId, images, settings } = data);
  
  // Create project info for the title
  $: projectInfo = {
    name: projectId.charAt(0).toUpperCase() + projectId.slice(1),
    description: `${projectId} project gallery`
  };
</script>

<svelte:head>
  <title>{projectInfo.name} - Gallery</title>
  <meta name="description" content={projectInfo.description} />
</svelte:head>

<main>
  <ModularGallery 
    {projectId} 
    preloadedSettings={settings}
    preloadedImages={{ images }}
  />
</main>

<style>
  main {
    width: 100%;
  }
</style> 