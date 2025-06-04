<!-- ModularGallery.svelte - Component-based version -->
<script>
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import { debounce } from '$lib/utils/debounce.js';
  import { getUnitSize } from '$lib/utils/units.js';
  import ImageItem from './ImageItem.svelte';
  import ViewToggleButton from './ViewToggleButton.svelte';
  import { adjustImageBlock, adjustProjectDescription } from '../utils/layout.js';
  
  // Props
  export let projectId = 'apple-branding'; // Default to apple-branding for backward compatibility
  export let preloadedSettings = null; // Preloaded settings data
  export let preloadedImages = null;   // Preloaded images data
  
  // State (same as SimpleGallery)
  let mounted = false; // Track if component is mounted
  let gridViewActive = false;
  let lightboxMode = false;
  let imageIds = ['upload-block'];
  let currentFocus = -1;
  let hideControls = true;
  let images = []; // Reactive array of image data
  let initialLayoutCalculated = false; // Track if initial layout is calculated
  
  // DOM references
  let gridElement;
  
  // Additional variables for optimized adjustBlocks
  let containerElement;
  let currentView = 'feed';
  let gridColumnWidth = 2; // Default grid column width in units - this should be reactive
  
  // Cached unit size for performance
  let currentUnit = 72;
  let lastWindowWidth = 0;
  
  // Computed API URLs based on projectId
  $: apiBaseUrl = '/api';
  $: imagesApiUrl = projectId ? `${apiBaseUrl}/projects/${projectId}/images` : `${apiBaseUrl}/images`;
  $: settingsApiUrl = projectId ? `${apiBaseUrl}/projects/${projectId}/settings` : `${apiBaseUrl}/settings`;
  
  onMount(() => {
    console.log('ModularGallery mounted');
    mounted = true; // Set mounted to true
    
    // Pre-calculate layout to avoid shifts
    calculateUnitSize();
    setInitialContainerSize();
    
    initializeGallery();
    
    return () => {
      mounted = false; // Clean up on unmount
      document.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('resize', handleResize);
    };
  });
  
  function initializeGallery() {
    setViewMode('feed');
    loadImages(); // This will handle all subsequent initialization
    
    // Set initial controls visibility
    if (hideControls) {
      document.body.classList.add('hide-controls');
    }
    
    document.addEventListener('keydown', handleKeyboard);
    window.addEventListener('resize', handleResize);
    
    if (gridElement) {
      gridElement.addEventListener('click', handleImageClick);
    }
    
    // Only calculate unit size if not already done in setInitialContainerSize
    if (!initialLayoutCalculated) {
      calculateUnitSize();
      adjustBlocks();
    }
    
    setupMoreInfoHandlers();
  }
  
  async function loadImages() {
    try {
      // Use preloaded data if available, otherwise fetch
      let settingsData = preloadedSettings;
      let imagesData = preloadedImages;
      
      if (!settingsData) {
        // Load settings
        const settingsResponse = await fetch(settingsApiUrl);
        settingsData = settingsResponse.ok ? await settingsResponse.json() : {};
      }
      
      if (!imagesData) {
        // Load image list
        const imagesResponse = await fetch(imagesApiUrl);
        imagesData = await imagesResponse.json();
      }
      
      const savedSettings = settingsData.settings || {};
      const savedImageOrder = settingsData.imageOrder || [];
      const imageFiles = imagesData.images || [];
      
      // Create a map of all available images with pre-calculated dimensions
      const availableImages = {};
      const UNIT = getUnitSize();
      
      imageFiles.forEach(imagePath => {
        const fileName = imagePath.split('/').pop().split('.')[0];
        const id = `img-${fileName}-fill`;
        const settings = savedSettings[id] || {};
        const units = settings.units || 4;
        
        // Pre-calculate dimensions to prevent layout shift
        const imageWidth = units * UNIT;
        const estimatedHeight = Math.round(imageWidth * 0.67); // Default 3:2 ratio
        
        availableImages[id] = {
          id,
          src: imagePath,
          alt: fileName,
          caption: settings.caption || fileName,
          units: units,
          originalUnits: units,
          mode: settings.isFill !== undefined ? (settings.isFill ? 'fill' : 'fit') : 'fill',
          ratio: '3:2',
          // Add pre-calculated dimensions
          preCalculatedWidth: imageWidth,
          preCalculatedHeight: estimatedHeight
        };
      });
      
      // Use saved order if available, otherwise use natural file order
      if (savedImageOrder.length > 0) {
        images = savedImageOrder
          .filter(id => availableImages[id])
          .map(id => availableImages[id]);
        
        const orderedIds = new Set(savedImageOrder);
        const newImages = Object.values(availableImages).filter(img => !orderedIds.has(img.id));
        images = [...images, ...newImages];
      } else {
        images = Object.values(availableImages);
      }
      
      // Update imageIds
      imageIds = ['upload-block', ...images.map(img => img.id)];
      
      console.log('Loaded images:', images.length, 'images', preloadedImages ? '(preloaded)' : '(fetched)');
      
      // Wait for DOM update, then do single layout calculation
      await tick();
      
      // Single layout adjustment instead of multiple setTimeout calls
      requestAnimationFrame(() => {
        adjustBlocks();
        // Initialize secondary features after layout is stable
        initCaptionEditing();
        initDragAndDrop();
      });
      
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }
  
  // All the same functions as SimpleGallery...
  function handleKeyboard(e) {
    if (lightboxMode) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox(1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      }
    } else if (gridViewActive) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setViewMode('feed');
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentFocus = currentFocus < 0 ? 0 : Math.min(currentFocus + 1, imageIds.length - 1);
        const element = document.getElementById(imageIds[currentFocus]);
        if (element) element.scrollIntoView({ block: 'center' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentFocus = currentFocus < 0 ? 0 : Math.max(currentFocus - 1, 0);
        const element = document.getElementById(imageIds[currentFocus]);
        if (element) element.scrollIntoView({ block: 'center' });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setViewMode('grid');
      }
    }
  }
  
  function setViewMode(mode, skipScrollRestore = false) {
    const scrollPos = window.scrollY;
    
    if (lightboxMode && mode !== 'lightbox') {
      const lightboxViewContainer = document.getElementById('lightbox-view-container');
      lightboxMode = false;
      if (lightboxViewContainer) lightboxViewContainer.classList.remove('active');
      document.body.classList.remove('lightbox-active');
    }
    
    document.body.classList.remove('grid-view', 'feed-view', 'lightbox-view', 'lightbox-active');
    
    if (mode === 'grid') {
      currentView = 'grid';
      gridViewActive = true;
      lightboxMode = false;
      document.body.classList.add('grid-view');
      if (gridElement) gridElement.classList.add('grid-layout');
    } 
    else if (mode === 'feed') {
      currentView = 'feed';
      gridViewActive = false;
      lightboxMode = false;
      document.body.classList.add('feed-view');
      if (gridElement) gridElement.classList.remove('grid-layout');
    }
    else if (mode === 'lightbox') {
      currentView = 'lightbox';
      document.body.classList.add('lightbox-view');
      lightboxMode = true;
      const targetImageId = currentFocus >= 0 ? imageIds[currentFocus] : imageIds[0];
      toggleLightbox(targetImageId);
      return;
    }
    
    updateActiveNavState();
    adjustBlocks();
    
    if (!skipScrollRestore) {
      setTimeout(() => window.scrollTo(0, scrollPos), 50);
    }
  }
  
  function updateActiveNavState() {
    document.querySelectorAll('.mode-toggle').forEach(btn => btn.classList.remove('active'));
    
    if (lightboxMode) {
      document.querySelector('#lightbox-btn')?.classList.add('active');
    } else if (gridViewActive) {
      document.querySelector('#grid-btn')?.classList.add('active');
      document.querySelector('#view-toggle-btn')?.classList.add('active');
    } else {
      document.querySelector('#feed-btn')?.classList.add('active');
    }
  }
  
  function handleImageClick(event) {
    const imageItem = event.target.closest('.image-item');
    if (!imageItem || event.target.closest('.upload-controls')) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const clickedId = imageItem.id;
    const clickedIndex = imageIds.indexOf(clickedId);
    currentFocus = clickedIndex;
    
    if (gridViewActive) {
      setViewMode('feed', true);
      setTimeout(() => {
        const element = document.getElementById(clickedId);
        if (element) element.scrollIntoView({ block: 'center' });
      }, 0);
    } else {
      toggleLightbox(clickedId);
    }
    
    return false;
  }
  
  function adjustBlocks() {
    if (!mounted) return;
    
    // Use the current unit size which now properly syncs with CSS breakpoints
    const UNIT = getUnitSize();
    const MAX_COLS = 20; // Maximum number of columns
    
    const currentWidth = window.innerWidth;
    
    // Get current screen width to determine mobile breakpoint
    const isMobile = currentWidth <= 768;
    const isTablet = currentWidth <= 1024 && currentWidth > 768;
    
    // On mobile, let CSS handle the grid entirely - only do minimal JS calculations
    if (isMobile) {
      // Still set container width and remove body margins as before
      const contentWidth = Math.floor(currentWidth / UNIT) * UNIT;
      const cols = Math.floor(currentWidth / UNIT);
      
      if (containerElement) {
        containerElement.style.width = `${contentWidth}px`;
        containerElement.style.margin = '0 auto';
      }
      
      // Remove body margins to let CSS media query handle grid padding
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
      
      // Don't modify grid element styles - let CSS handle it completely
      if (gridElement) {
        gridElement.style.padding = ''; // Remove any JS-set padding
        gridElement.style.width = '';
        gridElement.style.maxWidth = '';
      }
      
      // Update lastWindowWidth and return early
      lastWindowWidth = currentWidth;
      return;
    }
    
    // Skip recalculation if dimensions haven't changed and we're not switching view modes
    // Temporarily disabled for debugging
    // if (initialLayoutCalculated && lastWindowWidth === currentWidth && !gridViewActive && !lightboxMode && currentView === 'feed') {
    //   return;
    // }
    
    // Calculate layout using original method, but with synchronized units
    let bestCols = 0;
    let bestMarginUnits = 1;
    
    // Use smaller margins on mobile/tablet for less white space
    let marginOptions;
    if (isMobile) {
      // On mobile, use fixed 0px margin for testing
      marginOptions = [0]; // Single option: 0px
    } else if (isTablet) {
      // On tablet, use smaller unit-based margins
      marginOptions = [1, 1.5]; // 1 or 1.5 units
    } else {
      // Desktop: original behavior
      marginOptions = [1, 2, 3]; // 1, 2, or 3 units
    }
    
    // Try different margin sizes based on device
    for (const testMarginValue of marginOptions) {
      let testMargin;
      if (isMobile) {
        testMargin = testMarginValue; // Already in pixels for mobile
      } else {
        testMargin = testMarginValue * UNIT; // Unit-based for tablet/desktop
      }
      
      const testAvailableWidth = currentWidth - (2 * testMargin);
      
      let testCols = Math.floor(testAvailableWidth / UNIT);
      
      // On mobile, be more aggressive about using available width
      if (isMobile) {
        // Calculate how much space would be left over
        const remainingSpace = testAvailableWidth - (testCols * UNIT);
        // If we have more than 1 unit of remaining space, try to use it
        if (remainingSpace >= UNIT) {
          testCols += Math.floor(remainingSpace / UNIT);
        }
        // Ensure even number of columns for consistent layout, even on mobile
        if (testCols % 2 !== 0) testCols--;
        // Ensure minimum of 2 for layout consistency
        testCols = Math.max(testCols, 2);
      } else {
        // Make sure it's an even number for proper centering on tablet/desktop
        if (testCols % 2 !== 0) testCols--;
      }
      
      // Apply max column limit
      if (!lightboxMode) testCols = Math.min(testCols, MAX_COLS);
      
      // Ensure we always have at least 2 columns (1 unit would be too narrow)
      testCols = Math.max(testCols, 2);
      
      if (testCols > bestCols || (testCols === bestCols && testMarginValue > bestMarginUnits)) {
        bestCols = testCols;
        bestMarginUnits = testMarginValue;
      }
    }
    
    const cols = bestCols;
    const marginUnits = bestMarginUnits;
    const contentWidth = cols * UNIT;
    
    // Calculate final margin based on device type
    let finalMargin;
    if (isMobile) {
      finalMargin = 0; // Fixed 0px on mobile for testing
    } else {
      finalMargin = marginUnits * UNIT; // Unit-based on tablet/desktop
    }
    
    const viewUnits = cols;
    
    // Set the content wrapper width and margins like original
    if (containerElement) {
      containerElement.style.width = `${contentWidth}px`;
      containerElement.style.margin = '0 auto';
    }
    
    // Set body margins - but only on tablet/desktop, let CSS handle mobile
    if (!isMobile) {
      document.body.style.marginLeft = `${finalMargin}px`;
      document.body.style.marginRight = `${finalMargin}px`;
    } else {
      // On mobile, remove any JS-set margins to let CSS media query take over
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
    }
    
    // Cache DOM queries for better performance
    const gridColumnWidthInput = document.getElementById('grid-column-width');
    const gridColumnWidthUnits = parseInt(gridColumnWidthInput?.value) || gridColumnWidth;
    const columnCountEl = document.getElementById('column-count');
    
    if (gridElement) {
      if (currentView === 'grid' && !lightboxMode) {
        // Grid view: Calculate columns ensuring odd number
        const columnWidth = UNIT * gridColumnWidthUnits;
        const gap = Math.round(UNIT / 2);
        
        // Calculate how many columns fit in the content width
        let totalColumns = Math.floor((contentWidth + gap) / (columnWidth + gap));
        
        // Ensure odd number of columns for proper centering
        if (totalColumns % 2 === 0) {
          totalColumns = Math.max(1, totalColumns - 1);
        }
        
        // Calculate the actual grid container width to center it properly
        const gridContainerWidth = totalColumns * columnWidth + (totalColumns - 1) * gap;
        
        // Apply grid styles with calculated container width for centering
        gridElement.style.width = `${gridContainerWidth}px`;
        gridElement.style.maxWidth = 'none';
        gridElement.style.marginLeft = 'auto';
        gridElement.style.marginRight = 'auto';
        gridElement.style.gridTemplateColumns = `repeat(${totalColumns}, ${columnWidth}px)`;
        gridElement.style.gap = `${gap}px`;
        gridElement.classList.add('grid-layout');
        
        // Update column count display
        if (columnCountEl) {
          columnCountEl.textContent = totalColumns;
        }
        
        // In grid view, temporarily set all image items to use the grid column width
        // but preserve the original values for restoration
        document.querySelectorAll('.grid-item').forEach(item => {
          if (item.classList.contains('image-item')) {
            // Store original max units using the correct attribute name (only if not already stored)
            if (!item.dataset.origMaxUnits) {
              item.dataset.origMaxUnits = item.dataset.maxUnits;
            }
            // Set all images to the grid column width for display
            item.dataset.maxUnits = gridColumnWidthUnits;
          }
        });
        
      } else {
        // Reset grid styles when returning to feed view
        gridElement.style.width = '';
        gridElement.style.maxWidth = '';
        gridElement.style.gridTemplateColumns = '';
        gridElement.style.gap = 'var(--unit)'; // Reset to the default gap for feed view
        gridElement.classList.remove('grid-layout');
        
        // On mobile, don't override CSS-controlled padding
        if (!isMobile) {
          // Only set grid padding on desktop/tablet
          gridElement.style.padding = '';
        }
        
        // Restore original maxUnits values in feed view BEFORE sizing calculations
        document.querySelectorAll('.grid-item').forEach(item => {
          if (item.classList.contains('image-item') && item.dataset.origMaxUnits) {
            console.log(`Restoring ${item.id}: ${item.dataset.maxUnits} -> ${item.dataset.origMaxUnits}`);
            item.dataset.maxUnits = item.dataset.origMaxUnits;
          }
        });
        
        // Force a layout recalculation for feed view by clearing cached values
        lastWindowWidth = 0; // Force recalculation on next call
      }
    }
    
    // Apply sizing to all grid items with improved image handling
    const gridItems = document.querySelectorAll('.grid-item[data-max-units]');
    
    gridItems.forEach(item => {
      let u = Math.min(+item.dataset.maxUnits, viewUnits);
      
      // For feed view, ensure even number of units and minimum of 2
      if (currentView !== 'grid' && u % 2) u--;
      // In grid view, allow 1-unit width, but in feed view enforce minimum of 2
      if (currentView !== 'grid' && u < 2) u = 2;
      
      const w = u * UNIT;
      
      // In grid view, don't set width - let CSS Grid handle it
      if (currentView === 'grid') {
        item.style.width = ''; // Remove width, let grid handle it
      } else {
        item.style.width = w + 'px';
      }
      
      if (item.classList.contains('image-item')) {
        const img = item.querySelector('img');
        const imgContainer = item.querySelector('.image-container');
        
        if (imgContainer) {
          // Use pre-calculated dimensions if available to prevent layout shift
          const imageData = images.find(imgData => imgData.id === item.id);
          
          if (imageData && imageData.preCalculatedHeight) {
            // Use pre-calculated height initially
            imgContainer.style.height = imageData.preCalculatedHeight + 'px';
          }
          
          // Update with actual dimensions when image loads
          if (img && img.complete && img.naturalWidth) {
            const h = Math.round(w * img.naturalHeight / img.naturalWidth / UNIT) * UNIT;
            imgContainer.style.height = h + 'px';
          } else if (img && !img.complete) {
            // Optimize image loading - only set onload if not already set
            if (!img.dataset.onloadSet) {
              img.onload = () => {
                if (imgContainer && img.naturalWidth) {
                  const h = Math.round(w * img.naturalHeight / img.naturalWidth / UNIT) * UNIT;
                  imgContainer.style.height = h + 'px';
                }
              };
              img.dataset.onloadSet = 'true';
            }
          }
        }
      }
    });
    
    // Update lastWindowWidth for optimization
    lastWindowWidth = currentWidth;
  }
  
  // More responsive debounce for breakpoint changes
  const debouncedAdjustBlocks = debounce(adjustBlocks, 0);
  
  // Specialized resize handler that responds quickly to breakpoint crossings
  function handleResize() {
    const currentWidth = window.innerWidth;
    
    // Check if we've crossed a breakpoint boundary
    const crossedBreakpoint = 
      (lastWindowWidth > 768 && currentWidth <= 768) ||
      (lastWindowWidth <= 768 && currentWidth > 768) ||
      (lastWindowWidth > 1024 && currentWidth <= 1024) ||
      (lastWindowWidth <= 1024 && currentWidth > 1024);
    
    if (crossedBreakpoint) {
      // Force CSS re-evaluation when crossing breakpoints
      const root = document.documentElement;
      const currentUnit = root.style.getPropertyValue('--unit');
      root.style.setProperty('--unit', currentUnit || getUnitSize() + 'px');
      
      // Immediate recalculation when crossing breakpoints
      adjustBlocks();
    } else {
      // Normal debounced adjustment for other resize events
      debouncedAdjustBlocks();
    }
    
    lastWindowWidth = currentWidth;
  }
  
  // Stub functions for lightbox (same as SimpleGallery)
  function toggleLightbox(imageId) {
    console.log('toggleLightbox called with imageId:', imageId);
    const lightboxViewContainer = document.getElementById('lightbox-view-container');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxDots = document.getElementById('lightbox-dots');
    
    // Get unique image IDs
    const uniqueImageIds = imageIds.filter(id => id !== 'upload-block');
    if (document.getElementById('upload-block')) {
      uniqueImageIds.unshift('upload-block');
    }
    
    if (imageId !== null) {
      // Opening the lightbox
      lightboxMode = true;
      currentView = 'lightbox'; // Update currentView for ViewToggleButton
      lightboxViewContainer.classList.add('active');
      document.body.classList.add('lightbox-active');
      
      // Find the index in the unique array
      let uniqueIndex = uniqueImageIds.indexOf(imageId);
      if (uniqueIndex === -1) uniqueIndex = 0;
      currentFocus = uniqueIndex;
      
      // Update the active state for the lightbox button
      updateActiveNavState();
      
      // Get the image element and its properties
      const sourceElement = document.getElementById(imageId);
      if (!sourceElement) {
        console.error('Source element not found:', imageId);
        return;
      }
      
      const imgElement = sourceElement.querySelector('img');
      if (!imgElement) {
        console.error('Image element not found in source element');
        return;
      }
      
      const imgSrc = imgElement.src;
      const captionElement = sourceElement.querySelector('.caption .text-inner') || sourceElement.querySelector('.text-inner');
      const imgDimensions = captionElement ? captionElement.innerText : '';
      
      // Clear previous content
      lightboxImage.innerHTML = '';
      lightboxDots.innerHTML = '';
      
      // Create and add the image
      const img = document.createElement('img');
      img.src = imgSrc;
      img.id = 'current-lightbox-img';
      
      // Always use the maxUnits value from the dataset, not the current visual width
      // This ensures consistent sizing in lightbox regardless of grid/feed view
      let maxUnits = sourceElement.dataset.origMaxUnits || sourceElement.dataset.maxUnits || '4';
      
      // In grid view, the element might have been resized to grid column width
      // But we want to show the original intended size in lightbox
      if (gridViewActive) {
        // Find the original units from the images array
        const imageData = images.find(img => img.id === imageId);
        if (imageData && imageData.originalUnits) {
          maxUnits = imageData.originalUnits.toString();
        }
      }
      
      const unitSize = 72; // Base unit size in pixels
      
      // Calculate the width based on maxUnits (not current visual width)
      const width = parseInt(maxUnits) * unitSize;
      
      img.style.width = `${width}px`;
      img.style.height = 'auto';
      img.style.objectFit = sourceElement.classList.contains('fill') ? 'cover' : 'contain';
      
      img.dataset.maxUnits = maxUnits;
      img.dataset.isFill = sourceElement.classList.contains('fill');
      img.dataset.imageId = imageId;
      
      lightboxImage.appendChild(img);
      
      // Update caption
      lightboxCaption.innerText = imgDimensions;
      
      // Create dots for navigation
      uniqueImageIds.forEach((id, index) => {
        const dot = document.createElement('div');
        const isActive = id === imageId;
        dot.className = 'lightbox-dot' + (isActive ? ' active' : '');
        dot.setAttribute('onclick', `currentFocus = ${index}; toggleLightbox('${id}'); return false;`);
        lightboxDots.appendChild(dot);
        
        if (isActive) {
          currentFocus = index;
        }
      });
      
      lightboxDots.style.display = 'flex';
      lightboxViewContainer.classList.add('active');
    } else {
      // Closing the lightbox
      lightboxMode = false;
      // Restore previous view state when closing lightbox
      currentView = gridViewActive ? 'grid' : 'feed';
      lightboxViewContainer.classList.remove('active');
      document.body.classList.remove('lightbox-active');
      updateActiveNavState();
    }
  }
  
  function navigateLightbox(direction) {
    if (!lightboxMode) return;
    
    const uniqueImageIds = imageIds.filter(id => id !== 'upload-block');
    if (document.getElementById('upload-block')) {
      uniqueImageIds.unshift('upload-block');
    }
    
    const newIndex = Math.max(0, Math.min(uniqueImageIds.length - 1, currentFocus + direction));
    currentFocus = newIndex;
    
    const newImageId = uniqueImageIds[newIndex];
    toggleLightbox(newImageId);
  }
  
  function closeLightbox() {
    const uniqueImageIds = imageIds.filter(id => id !== 'upload-block');
    if (document.getElementById('upload-block')) {
      uniqueImageIds.unshift('upload-block');
    }
    
    const currentImageId = uniqueImageIds[currentFocus];
    
    if (currentImageId) {
      const targetElement = document.getElementById(currentImageId);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop;
        const centerPosition = targetTop - (window.innerHeight / 2) + (rect.height / 2);
        
        window.scrollTo(0, centerPosition);
        
        setTimeout(() => {
          toggleLightbox(null);
          updateActiveNavState();
        }, 10);
      } else {
        toggleLightbox(null);
        updateActiveNavState();
      }
    } else {
      toggleLightbox(null);
      updateActiveNavState();
    }
  }
  
  // Lightbox control functions
  function adjustLightboxUnits(change) {
    const img = document.getElementById('current-lightbox-img');
    if (!img) return;
    
    let currentUnits = parseInt(img.dataset.maxUnits) || 4;
    let newUnits = currentUnits + change;
    
    if (newUnits % 2 !== 0) newUnits += 1;
    newUnits = Math.max(2, Math.min(20, newUnits));
    
    const unitSize = 72;
    const newWidth = newUnits * unitSize;
    img.style.width = `${newWidth}px`;
    img.dataset.maxUnits = newUnits;
    
    saveImageSettingsFromLightbox();
  }
  
  function toggleLightboxFillMode() {
    const img = document.getElementById('current-lightbox-img');
    if (!img) return;
    
    const currentIsFill = img.dataset.isFill === 'true';
    const newIsFill = !currentIsFill;
    
    img.style.objectFit = newIsFill ? 'cover' : 'contain';
    img.dataset.isFill = newIsFill;
    
    saveImageSettingsFromLightbox();
  }
  
  function saveImageSettingsFromLightbox() {
    const img = document.getElementById('current-lightbox-img');
    if (!img) return;
    
    const imageId = img.dataset.imageId;
    const maxUnits = parseInt(img.dataset.maxUnits);
    const isFill = img.dataset.isFill === 'true';
    
    fetch(settingsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId: imageId,
        units: maxUnits,
        isFill: isFill
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Settings saved from lightbox:', data);
      
      const sourceElement = document.getElementById(imageId);
      if (sourceElement) {
        sourceElement.dataset.maxUnits = maxUnits;
        
        if (isFill) {
          sourceElement.classList.add('fill');
        } else {
          sourceElement.classList.remove('fill');
        }
        
        const gridImg = sourceElement.querySelector('img');
        if (gridImg) {
          gridImg.style.objectFit = isFill ? 'cover' : 'contain';
        }
      }
    })
    .catch(error => {
      console.error('Error saving settings from lightbox:', error);
    });
  }
  
  function setupMoreInfoHandlers() {
    setTimeout(() => {
      document.querySelectorAll('.more-info').forEach(el => {
        el.onclick = () => {
          const block = el.closest('.project-description').querySelector('.additional-block');
          if (block) {
            if (!block.classList.contains('expanded')) {
              const unit = getUnitSize();
              const content = block.querySelector('.text-inner.description-content');
              
              block.style.visibility = 'hidden';
              block.style.maxHeight = 'none';
              block.style.opacity = '0';
              block.style.display = 'block';
              block.classList.add('expanded');
              
              void block.offsetHeight;
              
              const contentHeight = content.scrollHeight;
              const rows = Math.ceil((contentHeight + 24) / unit);
              const maxHeight = rows * unit;
              
              block.style.maxHeight = maxHeight + 'px';
              block.style.visibility = 'visible';
              block.style.opacity = '1';
            } else {
              block.style.maxHeight = '0';
              block.style.opacity = '0';
              setTimeout(() => {
                if (!block.classList.contains('expanded')) {
                  block.style.visibility = 'hidden';
                  block.style.display = 'none';
                }
              }, 200);
              block.classList.remove('expanded');
            }
            
            adjustBlocks();
          }
        };
      });
    }, 100);
  }
  
  function handleImageSettingsChanged(event) {
    const { id, units, mode, caption } = event.detail;
    
    // Update the DOM element's data attributes directly
    const element = document.getElementById(id);
    if (element) {
      element.dataset.maxUnits = units;
      element.dataset.origMaxUnits = units;
      
      // Update CSS classes for fill/fit mode
      if (mode === 'fill') {
        element.classList.add('fill');
        element.classList.remove('fit');
      } else {
        element.classList.add('fit');
        element.classList.remove('fill');
      }
      
      // Update image object fit
      const img = element.querySelector('img');
      if (img) {
        img.style.objectFit = mode === 'fill' ? 'cover' : 'contain';
      }
    }
    
    // Update the reactive images array including originalUnits
    images = images.map(img => 
      img.id === id ? { ...img, units, originalUnits: units, mode, caption } : img
    );
    
    // Trigger layout recalculation
    setTimeout(() => adjustBlocks(), 50);
  }
  
  function handleImageLoaded(event) {
    // When an image loads, trigger layout recalculation
    setTimeout(() => adjustBlocks(), 10);
  }
  
  // Upload block control functions
  function decreaseUploadUnits() {
    const uploadBlock = document.getElementById('upload-block');
    if (uploadBlock) {
      let currentUnits = parseInt(uploadBlock.dataset.maxUnits) || 6;
      const newUnits = Math.max(2, currentUnits - 2);
      uploadBlock.dataset.maxUnits = newUnits;
      uploadBlock.dataset.origMaxUnits = newUnits;
      
      // Save the change
      const isFill = uploadBlock.classList.contains('fill');
      saveImageSettings('upload-block', newUnits, isFill);
      
      adjustBlocks();
    }
  }
  
  function increaseUploadUnits() {
    const uploadBlock = document.getElementById('upload-block');
    if (uploadBlock) {
      let currentUnits = parseInt(uploadBlock.dataset.maxUnits) || 6;
      const newUnits = currentUnits + 2;
      uploadBlock.dataset.maxUnits = newUnits;
      uploadBlock.dataset.origMaxUnits = newUnits;
      
      // Save the change
      const isFill = uploadBlock.classList.contains('fill');
      saveImageSettings('upload-block', newUnits, isFill);
      
      adjustBlocks();
    }
  }
  
  function toggleUploadMode() {
    const uploadBlock = document.getElementById('upload-block');
    const modeBtn = uploadBlock?.querySelector('.upload-controls button:last-child');
    if (uploadBlock && modeBtn) {
      const isFill = uploadBlock.classList.toggle('fill');
      uploadBlock.classList.toggle('fit');
      modeBtn.textContent = isFill ? 'Fill' : 'Fit';
      
      const img = uploadBlock.querySelector('img');
      if (img) {
        img.style.objectFit = isFill ? 'cover' : 'contain';
      }
      
      // Save the change
      const units = parseInt(uploadBlock.dataset.maxUnits) || 6;
      saveImageSettings('upload-block', units, isFill);
      
      adjustBlocks();
    }
  }
  
  function toggleControlsVisibility() {
    hideControls = !hideControls;
    if (hideControls) {
      document.body.classList.add('hide-controls');
    } else {
      document.body.classList.remove('hide-controls');
    }
  }
  
  function calculateUnitSize() {
    const UNIT = getUnitSize();
    const MAX_COLS = 20;  // Maximum number of columns
    
    // Try different margin sizes and pick the one that gives us the most balanced layout
    let bestCols = 0;
    let bestMarginUnits = 1; // Default to minimum margin
    
    // Try each possible margin size (1, 2, or 3 units per side)
    for (let testMarginUnits = 1; testMarginUnits <= 3; testMarginUnits++) {
      // Calculate available width with this margin
      const testMargin = testMarginUnits * UNIT;
      const testAvailableWidth = window.innerWidth - (2 * testMargin); // Left and right margins
      
      // How many columns would fit?
      let testCols = Math.floor(testAvailableWidth / UNIT);
      
      // Get current screen width to determine mobile breakpoint
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
      
      // Use smaller margins on mobile/tablet for less white space
      let marginOptions;
      if (isMobile) {
        // On mobile, use fixed 0px margin for testing
        marginOptions = [0]; // Single option: 0px
      } else if (isTablet) {
        // On tablet, use smaller unit-based margins
        marginOptions = [1, 1.5]; // 1 or 1.5 units
      } else {
        // Desktop: original behavior
        marginOptions = [1, 2, 3]; // 1, 2, or 3 units
      }
      
      // Try different margin sizes based on device
      for (const testMarginValue of marginOptions) {
        let testMargin;
        if (isMobile) {
          testMargin = testMarginValue; // Already in pixels for mobile
        } else {
          testMargin = testMarginValue * UNIT; // Unit-based for tablet/desktop
        }
        
        const testAvailableWidth = window.innerWidth - (2 * testMargin);
        let testCols = Math.floor(testAvailableWidth / UNIT);
        
        // On mobile, be more aggressive about using available width
        if (isMobile) {
          // Calculate how much space would be left over
          const remainingSpace = testAvailableWidth - (testCols * UNIT);
          // If we have more than 1 unit of remaining space, try to use it
          if (remainingSpace >= UNIT) {
            testCols += Math.floor(remainingSpace / UNIT);
          }
          // Ensure even number of columns for consistent layout, even on mobile
          if (testCols % 2 !== 0) testCols--;
          // Ensure minimum of 2 for layout consistency
          testCols = Math.max(testCols, 2);
        } else {
          // Make sure it's an even number for proper centering on tablet/desktop
          if (testCols % 2 !== 0) testCols--;
        }
        
        testCols = Math.min(testCols, 20); // MAX_COLS
        
        if (testCols > bestCols || (testCols === bestCols && testMarginValue > bestMarginUnits)) {
          bestCols = testCols;
          bestMarginUnits = testMarginValue;
        }
      }
    }
    
    // Now we have our optimal margin units and column count
    const marginUnits = bestMarginUnits;
    const cols = bestCols;
    
    // Calculate final values
    const contentWidth = cols * UNIT;
    const finalMargin = marginUnits * UNIT;
    
    // Set the content wrapper and grid width
    if (containerElement && !lightboxMode) {
      // Set the width
      containerElement.style.width = `${contentWidth}px`;
      // Apply the margin to top, bottom, left, and right
      document.body.style.margin = `${finalMargin}px`;
      
      // Update column count display
      const columnCountEl = document.getElementById('column-count');
      if (columnCountEl) {
        columnCountEl.textContent = cols;
      }
    }
    
    if (gridElement && !lightboxMode) {
      gridElement.style.width = `${contentWidth}px`;
    }
    
    return {
      unit: UNIT,
      cols: cols,
      marginUnits: marginUnits,
      contentWidth: contentWidth,
      margin: finalMargin
    };
  }
  
  // Drag and Drop Functionality
  function initDragAndDrop() {
    console.log('Initializing drag and drop...');
    const imageItems = document.querySelectorAll('.image-item:not(#upload-block)');
    
    // Add drag attributes to all image items
    imageItems.forEach(item => {
      item.setAttribute('draggable', 'true');
      item.classList.add('draggable');
      
      // Add drag handle visual indicator (only if it doesn't exist)
      if (!item.querySelector('.drag-handle')) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        item.appendChild(dragHandle);
      }
      
      // Remove existing listeners to avoid duplicates
      item.removeEventListener('dragstart', handleDragStart);
      item.removeEventListener('dragend', handleDragEnd);
      
      // Drag start event
      item.addEventListener('dragstart', handleDragStart);
      
      // Drag end event
      item.addEventListener('dragend', handleDragEnd);
    });
    
    // Add drag events to the grid container
    if (gridElement) {
      gridElement.removeEventListener('dragover', handleDragOver);
      gridElement.addEventListener('dragover', handleDragOver);
    }
  }
  
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.id);
    this.classList.add('dragging');
    setTimeout(() => {
      this.classList.add('drag-ghost');
    }, 0);
  }
  
  function handleDragEnd() {
    this.classList.remove('dragging');
    this.classList.remove('drag-ghost');
    
    // Save the new order
    saveImageOrder();
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(gridElement, e.clientY, e.clientX);
    const draggable = document.querySelector('.dragging');
    
    if (draggable) {
      if (afterElement == null) {
        gridElement.appendChild(draggable);
      } else {
        gridElement.insertBefore(draggable, afterElement);
      }
    }
  }
  
  // Helper function to determine where to place the dragged element
  function getDragAfterElement(container, mouseY, mouseX) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging):not(#upload-block)')];
    
    // Get row information for each element
    const elementsWithRowInfo = draggableElements.map(element => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        rect,
        centerY: rect.top + rect.height / 2,
        centerX: rect.left + rect.width / 2,
        row: Math.floor(rect.top / 72) // Assuming unit size is 72px
      };
    });
    
    // Group elements by row
    const rows = {};
    elementsWithRowInfo.forEach(item => {
      if (!rows[item.row]) rows[item.row] = [];
      rows[item.row].push(item);
    });
    
    // Find the row the mouse is in
    const mouseRow = Math.floor(mouseY / 72);
    const rowElements = rows[mouseRow] || [];
    
    // If we're in a row with elements, find the closest element horizontally
    if (rowElements.length > 0) {
      // Sort elements in the row by their X position
      rowElements.sort((a, b) => a.rect.left - b.rect.left);
      
      // Find the element we should insert before
      for (let i = 0; i < rowElements.length; i++) {
        if (mouseX < rowElements[i].centerX) {
          return rowElements[i].element;
        }
      }
      // If mouse is after all elements in the row, return the first element of the next row
      const nextRow = rows[mouseRow + 1];
      if (nextRow && nextRow.length > 0) {
        return nextRow[0].element;
      }
    }
    
    // Fallback to the original vertical-only logic
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  // Function to save the new image order
  function saveImageOrder() {
    // Get all image items in their current order (excluding upload-block)
    const orderedItems = document.querySelectorAll('.image-item:not(#upload-block)');
    
    // Create an array of image IDs in the current order
    const orderedIds = Array.from(orderedItems).map(item => item.id);
    
    console.log('Saving new image order:', orderedIds);
    
    // First, update all dataset orders for immediate reference
    orderedItems.forEach((block, index) => {
      block.dataset.order = index;
    });
    
    // Send the complete new order to the server
    fetch(settingsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullReorder: true,
        newOrder: orderedIds
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Saved new image order:', result);
      
      // Update the reactive images array to match the new order
      const newImages = orderedIds.map(id => {
        return images.find(img => img.id === id);
      }).filter(Boolean);
      
      images = newImages;
      imageIds = ['upload-block', ...orderedIds];
    })
    .catch(error => {
      console.error('Error saving image order:', error);
    });
    
    console.log('Final image order after save:', 
      Array.from(document.querySelectorAll('.image-item')).map(item => 
        `${item.id} (order: ${item.dataset.order})`
      )
    );
  }
  
  // Function to save individual image settings  
  function saveImageSettings(imageId, units, isFill, caption = null, order = null) {
    const data = {
      imageId: imageId,
      units: units,
      isFill: isFill
    };
    
    if (caption !== null) {
      data.caption = caption;
    }
    
    if (order !== null) {
      data.order = order;
    }
    
    fetch(settingsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      console.log(`Saved settings for ${imageId}:`, data, result);
    })
    .catch(error => {
      console.error('Error saving image settings:', error);
    });
  }
  
  // Initialize caption editing functionality
  function initCaptionEditing() {
    console.log('Initializing caption editing...');
    const textInners = document.querySelectorAll('.text-inner');
    
    textInners.forEach(textInner => {
      // Make caption editable
      textInner.setAttribute('contenteditable', 'true');
      
      // Save the updated caption when user finishes editing
      textInner.addEventListener('blur', function() {
        const imageItem = this.closest('.image-item');
        if (imageItem && imageItem.id !== 'upload-block') {
          const newCaption = this.innerText.trim();
          const units = parseInt(imageItem.dataset.maxUnits) || 6;
          const isFill = imageItem.classList.contains('fill');
          
          // Save the caption
          saveImageSettings(imageItem.id, units, isFill, newCaption);
          console.log(`Saved caption for ${imageItem.id}:`, newCaption);
        }
      });
      
      // Prevent lightbox from opening when editing caption
      textInner.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      
      // Allow Enter key to confirm editing (blur the element)
      textInner.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.blur();
        }
      });
    });
  }
  
  function setInitialContainerSize() {
    if (!containerElement) return;
    
    // Set initial container dimensions to prevent layout shift
    const UNIT = getUnitSize();
    const currentWidth = window.innerWidth;
    
    // Get current screen width to determine mobile breakpoint (same logic as adjustBlocks)
    const isMobile = currentWidth <= 768;
    const isTablet = currentWidth <= 1024 && currentWidth > 768;
    
    // On mobile, let CSS handle everything - minimal JS setup only
    if (isMobile) {
      const contentWidth = Math.floor(currentWidth / UNIT) * UNIT;
      
      // Set container width only
      containerElement.style.width = `${contentWidth}px`;
      containerElement.style.margin = '0 auto';
      
      // Remove any body margins to let CSS take over
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
      
      initialLayoutCalculated = true;
      return;
    }
    
    // Desktop/tablet logic - calculate optimal columns and margins
    let bestCols = 0;
    let bestMarginUnits = 1;
    
    // Use smaller margins on tablet for less white space
    let marginOptions;
    if (isTablet) {
      marginOptions = [1, 1.5]; // 1 or 1.5 units
    } else {
      marginOptions = [1, 2, 3]; // 1, 2, or 3 units
    }
    
    // Try different margin sizes based on device
    for (const testMarginValue of marginOptions) {
      const testMargin = testMarginValue * UNIT; // Unit-based for tablet/desktop
      const testAvailableWidth = currentWidth - (2 * testMargin);
      let testCols = Math.floor(testAvailableWidth / UNIT);
      
      // Make sure it's an even number for proper centering on tablet/desktop
      if (testCols % 2 !== 0) testCols--;
      testCols = Math.min(testCols, 20); // MAX_COLS
      
      if (testCols > bestCols || (testCols === bestCols && testMarginValue > bestMarginUnits)) {
        bestCols = testCols;
        bestMarginUnits = testMarginValue;
      }
    }
    
    const contentWidth = bestCols * UNIT;
    const finalMargin = bestMarginUnits * UNIT;
    
    // Set dimensions immediately to prevent layout shift
    containerElement.style.width = `${contentWidth}px`;
    containerElement.style.margin = '0 auto';
    
    // Set body margins for desktop/tablet
    document.body.style.marginLeft = `${finalMargin}px`;
    document.body.style.marginRight = `${finalMargin}px`;
    
    initialLayoutCalculated = true;
  }
</script>

<!-- Same template structure, but using components -->
<div class="mode-toggle-container">
  <!-- Hide feed and grid buttons -->
  <div class="mode-toggle hidden" id="feed-btn" on:click={() => setViewMode('feed')}>
    <div class="mode-toggle-inner">Feed</div>
  </div>
  <div class="mode-toggle hidden" id="grid-btn" on:click={() => setViewMode('grid')}>
    <div class="mode-toggle-inner">Grid</div>
  </div>
  
  <div class="mode-toggle hidden" id="lightbox-btn" on:click={() => setViewMode('lightbox')}>
    <div class="mode-toggle-inner">Lightbox</div>
  </div>
  <div class="mode-toggle" id="controls-toggle-btn" on:click={toggleControlsVisibility}>
    <div class="mode-toggle-inner">Controls</div>
  </div>
  <div class="mode-toggle" id="view-toggle-btn">
    <div class="mode-toggle-inner">
      <ViewToggleButton 
        viewMode={currentView}
        onClick={() => setViewMode(gridViewActive ? 'feed' : 'grid')}
      />
    </div>
  </div>
  <div class="mode-toggle" id="projects-btn" on:click={() => window.location.href = '/'}>
    <div class="mode-toggle-inner">Projects</div>
  </div>
</div>

<div class="content-wrapper" bind:this={containerElement}>
  <div class="control-overlay">
    <div class="control-panel">
      <div class="control-group">
        <label for="grid-column-width">Grid Column Width (units):</label>
        <input type="range" id="grid-column-width" min="1" max="8" bind:value={gridColumnWidth} step="1" 
               on:input={(e) => {
                 gridColumnWidth = parseInt(e.target.value);
                 document.getElementById('column-width-value').textContent = e.target.value;
                 adjustBlocks();
               }}>
        <span id="column-width-value">{gridColumnWidth}</span>
      </div>
      <div class="control-info">
        <span>Columns: <span id="column-count">3</span></span>
      </div>
    </div>
  </div>
  
  <div class="grid" bind:this={gridElement}>
    <!-- Project Description (unchanged) -->
    <div class="grid-item project-description" data-max-units="6">
      <div class="text-inner">
        SKY<br>Naming, Logo Design, App Icon Design<br>FEBRUARY 2023
        <span class="more-info">Additional Information</span>
      </div>
      <div class="additional-block">
        <div class="text-inner description-content">
          <p>In early 2023, we collaborated directly with Sam Altman...</p>
        </div>
      </div>
      <div class="project-description-tr-mark"></div>
      <div class="project-description-bl-mark"></div>
    </div>
    
    <!-- Upload Block (unchanged for now) -->
    <div class="grid-item image-item fill upload-block" 
         id="upload-block" 
         data-max-units="6" 
         data-ratio="1:1">
      <div class="image-container">
        <img src="https://placehold.co/288x288?text=Image+Placeholder" alt="Placeholder">
        <div class="label">Fill</div>
        <div class="upload-controls">
          <button on:click|stopPropagation={decreaseUploadUnits}>-</button>
          <button on:click|stopPropagation={increaseUploadUnits}>+</button>
          <button on:click|stopPropagation={toggleUploadMode}>Fill</button>
        </div>
      </div>
      <div class="caption">
        <div class="text-inner">4×4</div>
      </div>
      <div class="image-item-tr-mark"></div>
      <div class="image-item-bl-mark"></div>
    </div>
    
    <!-- Dynamic Images using ImageItem component -->
    {#each images as image (image.id)}
      <ImageItem {...image} {projectId} on:settingsChanged={handleImageSettingsChanged} on:imageLoaded={handleImageLoaded} />
    {/each}
  </div>
</div>

<!-- Lightbox (same as SimpleGallery) -->
<div class="lightbox-view-container" id="lightbox-view-container">
  <div class="lightbox-container">
    <div class="lightbox-image" id="lightbox-image">
      <!-- Image will be inserted here dynamically -->
    </div>
    <div class="lightbox-controls">
      <button class="lightbox-control-btn decrease-units" on:click={() => adjustLightboxUnits(-2)}>-</button>
      <button class="lightbox-control-btn increase-units" on:click={() => adjustLightboxUnits(2)}>+</button>
      <button class="lightbox-mode-toggle" on:click={toggleLightboxFillMode}>Fill/Fit</button>
    </div>
    <div class="lightbox-info-group">
      <div id="lightbox-caption" class="lightbox-caption"></div>
      <div id="lightbox-dots" class="lightbox-dots">
        <!-- Dots will be inserted here dynamically -->
      </div>
      <div class="lightbox-close-text" on:click={closeLightbox}>Close</div>
    </div>
    <div class="lightbox-nav lightbox-prev" id="lightbox-prev" on:click={() => navigateLightbox(-1)}></div>
    <div class="lightbox-nav lightbox-next" id="lightbox-next" on:click={() => navigateLightbox(1)}></div>
  </div>
</div>

<style>
  /* All styles come from gallery.css */
  
  /* Hide elements */
  .hidden {
    display: none !important;
  }
  
  /* Hide indicator triangles/corner marks for now */
  :global(.mode-toggle::before),
  :global(.mode-toggle::after),
  :global(.mode-toggle .mode-toggle-inner::before),
  :global(.mode-toggle .mode-toggle-inner::after) {
    display: none !important;
  }
  
  /* Drag and drop styles */
  .draggable {
    position: relative;
    cursor: grab;
  }
  
  .dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
  
  .drag-ghost {
    opacity: 0.2;
  }
  
  .drag-handle {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 24px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    z-index: 10;
    font-size: 18px;
    color: #333;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
  
  .drag-handle:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  /* Editable caption styles */
  :global(.text-inner[contenteditable=true]) {
    cursor: text;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }
  
  :global(.text-inner[contenteditable=true]:hover),
  :global(.text-inner[contenteditable=true]:focus) {
    background-color: rgba(255, 255, 255, 0.9);
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
  
  /* Performance optimizations - skeleton loading */
  :global(.image-container) {
    background-color: #f5f5f5;
    position: relative;
    overflow: hidden;
  }
  
  :global(.image-container::before) {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.2) 20%, 
      rgba(255,255,255,0.5) 50%, 
      rgba(255,255,255,0.2) 80%, 
      rgba(255,255,255,0) 100%);
    transform: translateX(-100%);
    animation: skeleton-loading 2s infinite;
    z-index: 1;
  }
  
  :global(.image-container img) {
    position: relative;
    z-index: 2;
    transition: opacity 0.3s ease;
  }
  
  :global(.image-container img:not([src]), .image-container img[src=""]) {
    opacity: 0;
  }
  
  :global(.image-container img[src]:not([src=""])) {
    opacity: 1;
  }
  
  @keyframes skeleton-loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  /* Disable skeleton loading once image is loaded */
  :global(.image-container.loaded::before) {
    display: none;
  }
</style> 