// src/lib/stores/gallery.js
// Svelte stores for Gallery state management - preserving existing functionality

import { writable, derived, get } from 'svelte/store';

// ============================================================================
// CORE STATE STORES - Migrate from your existing variables
// ============================================================================

export const gridViewActive = writable(false);
export const lightboxMode = writable(false);
export const imageIds = writable(['upload-block']);
export const currentFocus = writable(-1);
export const hideControls = writable(true);

// Grid settings
export const gridColumnWidth = writable(2);

// ============================================================================
// CONFIGURATION - From your improved code snippets
// ============================================================================

export const CONFIG = {
  UNIT_SIZE: 72,
  MAX_COLUMNS: 16,
  MIN_UNITS: 2,
  MAX_UNITS: 20,
  DEFAULT_TRANSITION_DURATION: '0ms',
  API_BASE_URL: 'http://localhost:3000',
  
  // Image aspect ratios
  DEFAULT_RATIOS: [
    {w:2,h:3},{w:3,h:4},{w:16,h:9},{w:3,h:2},{w:4,h:3},{w:16,h:9},{w:2,h:1},
    {w:8,h:3},{w:10,h:4},{w:16,h:6},{w:20,h:9},{w:16,h:5},{w:20,h:7}
  ]
};

// ============================================================================
// DERIVED STORES - Computed values from existing logic
// ============================================================================

export const uniqueImageIds = derived(imageIds, ($imageIds) => {
  // Your existing getUniqueImageIds logic preserved exactly
  const uniqueIds = [];
  const seenDimensions = new Set();
  
  // Special handling for upload-block - always include it first
  const uploadBlockId = 'upload-block';
  if ($imageIds.includes(uploadBlockId)) {
    uniqueIds.push(uploadBlockId);
    // Mock dimensions for upload block
    seenDimensions.add('4×4');
  }
  
  // Process all other images
  for (const id of $imageIds) {
    if (id === uploadBlockId) continue;
    
    // In a real app, you'd get the element and extract dimensions
    // For now, we'll simulate the logic
    const element = document?.getElementById(id);
    if (!element) continue;
    
    const caption = element.querySelector('.caption .text-inner');
    if (!caption) continue;
    
    const dimensions = caption.innerText;
    
    if (!seenDimensions.has(dimensions)) {
      uniqueIds.push(id);
      seenDimensions.add(dimensions);
    }
  }
  
  return uniqueIds;
});

export const currentViewMode = derived(
  [gridViewActive, lightboxMode], 
  ([$gridViewActive, $lightboxMode]) => {
    if ($lightboxMode) return 'lightbox';
    if ($gridViewActive) return 'grid';
    return 'feed';
  }
);

export const columnCount = derived(
  [gridViewActive, gridColumnWidth], 
  ([$gridViewActive, $gridColumnWidth]) => {
    if (!$gridViewActive) return 1;
    
    // Your existing column calculation logic
    const availableWidth = window?.innerWidth - CONFIG.UNIT_SIZE || 1200;
    const columnWidth = CONFIG.UNIT_SIZE * $gridColumnWidth;
    const gap = CONFIG.UNIT_SIZE / 2;
    
    let totalColumns = Math.floor(availableWidth / (columnWidth + gap));
    if (totalColumns % 2 === 0) totalColumns--; // Force odd number
    
    return Math.max(totalColumns, 1);
  }
);

// ============================================================================
// UTILITY FUNCTIONS - Your existing functions as pure functions
// ============================================================================

export function debounce(fn, delay) {
  let timer;
  return (...args) => { 
    clearTimeout(timer); 
    timer = setTimeout(() => fn(...args), delay); 
  };
}

export function calculateUnitSize() {
  // Your existing calculateUnitSize function preserved exactly
  const UNIT = CONFIG.UNIT_SIZE;
  const MAX_COLS = CONFIG.MAX_COLUMNS;
  
  let bestCols = 0;
  let bestMarginUnits = 1;
  
  for (let testMarginUnits = 1; testMarginUnits <= 3; testMarginUnits++) {
    const testMargin = testMarginUnits * UNIT;
    const testAvailableWidth = window.innerWidth - (2 * testMargin);
    
    let testCols = Math.floor(testAvailableWidth / UNIT);
    if (testCols % 2 !== 0) testCols--;
    
    if (!get(lightboxMode)) testCols = Math.min(testCols, MAX_COLS);
    
    if (testCols > bestCols || (testCols === bestCols && testMarginUnits > bestMarginUnits)) {
      bestCols = testCols;
      bestMarginUnits = testMarginUnits;
    }
  }
  
  const contentWidth = bestCols * UNIT;
  const finalMargin = bestMarginUnits * UNIT;
  
  return {
    unit: UNIT,
    contentWidth,
    margin: finalMargin,
    columns: bestCols
  };
}

// ============================================================================
// GALLERY ACTIONS - Your existing functions as actions
// ============================================================================

export const galleryActions = {
  // View mode management
  setViewMode(mode) {
    console.log('setViewMode called:', mode);
    
    gridViewActive.set(mode === 'grid');
    lightboxMode.set(mode === 'lightbox');
    
    // Add body classes (this will be handled by the component)
    if (typeof document !== 'undefined') {
      document.body.classList.remove('grid-view', 'feed-view', 'lightbox-view', 'lightbox-active');
      
      if (mode === 'grid') {
        document.body.classList.add('grid-view');
      } else if (mode === 'feed') {
        document.body.classList.add('feed-view');
      } else if (mode === 'lightbox') {
        document.body.classList.add('lightbox-view', 'lightbox-active');
      }
    }
    
    // Trigger layout recalculation
    setTimeout(() => {
      window.dispatchEvent(new Event('gallery:layout-update'));
    }, 0);
  },
  
  // Toggle between feed and grid (backward compatibility)
  toggleView() {
    const current = get(gridViewActive);
    this.setViewMode(current ? 'feed' : 'grid');
  },
  
  // Lightbox navigation - preserving your exact logic
  navigateLightbox(direction) {
    if (!get(lightboxMode)) return;
    
    const $uniqueImageIds = get(uniqueImageIds);
    const $currentFocus = get(currentFocus);
    
    // Your existing navigation logic preserved
    let navImageIds = [...$uniqueImageIds];
    if (!navImageIds.includes('upload-block')) {
      navImageIds.unshift('upload-block');
    }
    
    const newIndex = Math.max(0, Math.min(navImageIds.length - 1, $currentFocus + direction));
    currentFocus.set(newIndex);
    
    const newImageId = navImageIds[newIndex];
    this.openLightbox(newImageId);
  },
  
  // Lightbox management
  openLightbox(imageId) {
    const $uniqueImageIds = get(uniqueImageIds);
    
    // Find index in unique array
    let uniqueIndex = $uniqueImageIds.indexOf(imageId);
    if (uniqueIndex === -1 && imageId === 'upload-block') {
      uniqueIndex = 0;
    }
    
    currentFocus.set(uniqueIndex);
    lightboxMode.set(true);
    
    // Dispatch custom event for component to handle
    window.dispatchEvent(new CustomEvent('gallery:lightbox-open', { 
      detail: { imageId, index: uniqueIndex }
    }));
  },
  
  closeLightbox() {
    const $currentFocus = get(currentFocus);
    const $uniqueImageIds = get(uniqueImageIds);
    const currentImageId = $uniqueImageIds[$currentFocus];
    
    lightboxMode.set(false);
    
    // Dispatch event with scroll target
    window.dispatchEvent(new CustomEvent('gallery:lightbox-close', {
      detail: { targetImageId: currentImageId }
    }));
  },
  
  // Image management
  addImage(imageData) {
    imageIds.update(ids => [...ids, imageData.id]);
  },
  
  removeImage(imageId) {
    imageIds.update(ids => ids.filter(id => id !== imageId));
  },
  
  reorderImages(newOrder) {
    imageIds.set(newOrder);
  },
  
  // Settings
  updateGridColumnWidth(width) {
    gridColumnWidth.set(width);
  },
  
  toggleControls() {
    hideControls.update(hidden => !hidden);
  },
  
  // Keyboard navigation - preserving your exact logic
  handleKeyboard(event) {
    const $lightboxMode = get(lightboxMode);
    const $gridViewActive = get(gridViewActive);
    const $imageIds = get(imageIds);
    const $currentFocus = get(currentFocus);
    
    if ($lightboxMode) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.navigateLightbox(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.navigateLightbox(1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeLightbox();
      }
    } else if ($gridViewActive) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.setViewMode('feed');
      }
    } else {
      // Feed mode navigation
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const newFocus = $currentFocus < 0 ? 0 : Math.min($currentFocus + 1, $imageIds.length - 1);
        currentFocus.set(newFocus);
        
        // Scroll to image
        const imageId = $imageIds[newFocus];
        const element = document.getElementById(imageId);
        if (element) {
          element.scrollIntoView({ block: 'center' });
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const newFocus = $currentFocus < 0 ? 0 : Math.max($currentFocus - 1, 0);
        currentFocus.set(newFocus);
        
        // Scroll to image
        const imageId = $imageIds[newFocus];
        const element = document.getElementById(imageId);
        if (element) {
          element.scrollIntoView({ block: 'center' });
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.setViewMode('grid');
      }
    }
  }
};

// ============================================================================
// API FUNCTIONS - Your existing server communication
// ============================================================================

export const api = {
  async saveImageSettings(imageId, units, isFill, caption = null, order = null) {
    try {
      const data = { imageId, units, isFill };
      if (caption !== null) data.caption = caption;
      if (order !== null) data.order = order;
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error saving image settings:', error);
      throw error;
    }
  },
  
  async loadImageSettings() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/settings`);
      if (response.ok) {
        return await response.json();
      }
      return { settings: {}, imageOrder: [] };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { settings: {}, imageOrder: [] };
    }
  },
  
  async loadImages() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/images`);
      if (response.ok) {
        const data = await response.json();
        return data.images || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading images:', error);
      return [];
    }
  },
  
  async saveImageOrder(newOrder) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullReorder: true,
          newOrder: newOrder
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error saving image order:', error);
      throw error;
    }
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Set default view mode to feed
if (typeof window !== 'undefined') {
  galleryActions.setViewMode('feed');
} 