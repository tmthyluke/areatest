<script>
  import { goto } from '$app/navigation';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  // Use projects from layout data
  $: projects = data.projects.filter(p => p.active);

  function navigateToProject(projectId) {
    goto(`/${projectId}/`);
  }
</script>

<svelte:head>
  <title>Portfolio Gallery</title>
  <meta name="description" content="Portfolio gallery with multiple projects" />
</svelte:head>

<main>
  <header class="main-header">
    <h1>Portfolio Gallery</h1>
    <p>Select a project to explore</p>
  </header>

  {#if projects.length === 0}
    <div class="empty">
      <h2>No Projects Found</h2>
      <p>No active projects are currently available.</p>
    </div>
  {:else}
    <div class="projects-grid">
      {#each projects as project}
        <article 
          class="project-card" 
          on:click={() => navigateToProject(project.id)}
          data-sveltekit-preload-data="hover"
        >
          <a href="/{project.id}/" class="project-link-wrapper">
            <div class="project-content">
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              <span class="project-link">View Project →</span>
            </div>
          </a>
        </article>
      {/each}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .main-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .main-header h1 {
    font-size: 3rem;
    font-weight: 200;
    margin: 0 0 1rem 0;
    color: #333;
  }

  .main-header p {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .project-card {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .project-link-wrapper {
    text-decoration: none;
    color: inherit;
    display: block;
    width: 100%;
    height: 100%;
  }

  .project-content h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 500;
    color: #333;
  }

  .project-content p {
    margin: 0 0 1.5rem 0;
    color: #666;
    line-height: 1.5;
  }

  .project-link {
    color: #007bff;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .project-card:hover .project-link {
    color: #0056b3;
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .main-header h1 {
      font-size: 2rem;
    }

    .projects-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
