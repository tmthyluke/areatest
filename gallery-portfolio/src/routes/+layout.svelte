<script>
  import '../lib/styles/gallery.css';
</script>

<slot />

<style>
  /* Only layout-specific styles here, gallery styles stay in gallery.css */
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 