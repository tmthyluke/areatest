<!-- ImageItem.svelte - Reusable image component with built-in save -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let id;
  export let src;
  export let alt;
  export let caption;
  export let units = 4;
  export let mode = 'fill'; // 'fill' or 'fit'
  export let ratio = '3:2';
  export let projectId = null; // Add projectId prop
  
  const dispatch = createEventDispatcher();
  
  let element;
  let captionElement;
  
  // Calculate width based on units
  $: width = units * 72; // 72px per unit
  
  // Compute correct API endpoint based on projectId
  $: settingsApiUrl = projectId ? 
    `/api/projects/${projectId}/settings` : 
    '/api/settings';
  
  // Reactive statement to update element styling when units changes
  $: if (element) {
    element.style.width = `${width}px`;
    element.dataset.maxUnits = units;
    element.dataset.origMaxUnits = units;
  }
  
  // Save function
  async function saveSettings(newCaption = caption) {
    try {
      const response = await fetch(settingsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: id,
          units: units,
          isFill: mode === 'fill',
          caption: newCaption
        })
      });
      const result = await response.json();
      console.log(`Saved settings for ${id}:`, result);
      
      // Update local caption
      caption = newCaption;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  function adjustUnits(change) {
    let newUnits = units + change;
    if (newUnits % 2 !== 0) newUnits += change > 0 ? 1 : -1;
    newUnits = Math.max(2, Math.min(20, newUnits));
    
    units = newUnits;
    saveSettings();
    dispatch('settingsChanged', { id, units: newUnits, mode, caption });
  }
  
  function toggleMode() {
    mode = mode === 'fill' ? 'fit' : 'fill';
    saveSettings();
    dispatch('settingsChanged', { id, units, mode, caption });
  }
  
  function handleImageLoad() {
    // Notify parent that image has loaded and layout may need adjustment
    dispatch('imageLoaded', { id });
  }
  
  // Handle caption editing
  function handleCaptionBlur(event) {
    const newCaption = event.target.innerText.trim();
    if (newCaption !== caption) {
      saveSettings(newCaption);
      dispatch('settingsChanged', { id, units, mode, caption: newCaption });
    }
  }
  
  function handleCaptionKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  }
  
  function handleCaptionClick(event) {
    // Prevent lightbox from opening when editing caption
    event.stopPropagation();
  }
</script>

<div 
  bind:this={element}
  class="grid-item image-item {mode}" 
  {id} 
  data-max-units={units} 
  data-orig-max-units={units} 
  data-ratio={ratio}
  style="width: {width}px;"
>
  <div class="image-container">
    <img 
      {src} 
      {alt} 
      on:load={handleImageLoad}
      style="width: 100%; height: 100%; object-fit: {mode === 'fill' ? 'cover' : 'contain'};"
    >
    <div class="label">{mode === 'fill' ? 'Fill' : 'Fit'}</div>
    <div class="upload-controls">
      <button on:click|stopPropagation={() => adjustUnits(-2)}>-</button>
      <button on:click|stopPropagation={() => adjustUnits(2)}>+</button>
      <button on:click|stopPropagation={toggleMode}>{mode === 'fill' ? 'Fill' : 'Fit'}</button>
    </div>
  </div>
  <div class="caption">
    <div 
      bind:this={captionElement}
      class="text-inner" 
      contenteditable="true"
      role="textbox"
      aria-label="Image caption"
      on:blur={handleCaptionBlur}
      on:keydown={handleCaptionKeydown}
      on:click={handleCaptionClick}
    >{caption}</div>
  </div>
  <!-- Crop marks -->
  <div class="image-item-tr-mark"></div>
  <div class="image-item-bl-mark"></div>
</div>

<style>
  /* Editable caption styles */
  .text-inner[contenteditable=true] {
    cursor: text;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }
  
  .text-inner[contenteditable=true]:hover,
  .text-inner[contenteditable=true]:focus {
    background-color: rgba(255, 255, 255, 0.9);
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
</style> 