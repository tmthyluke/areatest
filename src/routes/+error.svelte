<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  $: error = $page.error;
  $: status = $page.status;
</script>

<svelte:head>
  <title>Error {status} - Gallery</title>
</svelte:head>

<main>
  <div class="error-container">
    <h1>{status}</h1>
    <h2>
      {#if status === 404}
        Page Not Found
      {:else if status >= 500}
        Server Error
      {:else}
        Something went wrong
      {/if}
    </h2>
    
    <p class="error-message">
      {error?.message || 'An unexpected error occurred'}
    </p>
    
    <div class="actions">
      <button on:click={() => goto('/')} class="home-btn">
        ← Back to Gallery
      </button>
      
      <button on:click={() => window.location.reload()} class="retry-btn">
        Try Again
      </button>
    </div>
  </div>
</main>

<style>
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .error-container {
    text-align: center;
    max-width: 500px;
  }
  
  h1 {
    font-size: 4rem;
    font-weight: 200;
    margin: 0;
    color: #666;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0.5rem 0 1rem 0;
    color: #333;
  }
  
  .error-message {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.5;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .home-btn {
    background: #007bff;
    color: white;
  }
  
  .home-btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }
  
  .retry-btn {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
  }
  
  .retry-btn:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
  
  @media (max-width: 480px) {
    .actions {
      flex-direction: column;
      align-items: center;
    }
    
    button {
      width: 200px;
    }
  }
</style> 