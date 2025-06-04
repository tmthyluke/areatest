onMount(() => {
  console.log('ModularGallery mounted');
  mounted = true; // Set mounted to true
  initializeGallery();
  
  return () => {
    mounted = false; // Clean up on unmount
    document.removeEventListener('keydown', handleKeyboard);
    window.removeEventListener('resize', handleResize);
  };
});

// ... existing code ...

  calculateUnitSize();
  adjustBlocks();
  setupMoreInfoHandlers();
  // Initialize drag-and-drop and caption editing after images are loaded
  setTimeout(() => {
    initDragAndDrop();
    initCaptionEditing();
  }, 200);
} 