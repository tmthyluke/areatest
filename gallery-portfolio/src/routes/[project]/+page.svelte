<script>
  import ModularGallery from '$lib/components/ModularGallery.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  // Data is now pre-loaded via +page.js
  $: ({ projectId, projectInfo, projectSettings, projectImages, allProjects } = data);
</script>

<svelte:head>
  <title>{projectInfo.name} - Gallery</title>
  <meta name="description" content={projectInfo.description} />
</svelte:head>

<main>
  <ModularGallery 
    {projectId} 
    preloadedSettings={projectSettings}
    preloadedImages={projectImages}
  />
</main>

<style>
  main {
    width: 100%;
  }
</style> 