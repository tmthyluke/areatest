// Responsive unit size utility
// Manages the base unit size that can change at CSS breakpoints

let currentUnit = 72;
let lastWindowWidth = 0;

// Define breakpoints to match CSS exactly
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024
};

const UNIT_SIZES = {
  DESKTOP: 72,
  TABLET: 60,
  MOBILE: 48
};

// Function to get unit size based on current window width
function getUnitFromBreakpoint(width) {
  if (width <= BREAKPOINTS.MOBILE) {
    return UNIT_SIZES.MOBILE;
  } else if (width <= BREAKPOINTS.TABLET) {
    return UNIT_SIZES.TABLET;
  } else {
    return UNIT_SIZES.DESKTOP;
  }
}

// Function to get unit size from CSS custom property with fallback to breakpoint calculation
export function getUnitSize() {
  if (typeof window === 'undefined') return 72;
  
  const currentWindowWidth = window.innerWidth;
  
  // Always recalculate when crossing breakpoint boundaries or significant changes
  const shouldRecalculate = Math.abs(currentWindowWidth - lastWindowWidth) > 10 ||
                           (lastWindowWidth > BREAKPOINTS.MOBILE && currentWindowWidth <= BREAKPOINTS.MOBILE) ||
                           (lastWindowWidth <= BREAKPOINTS.MOBILE && currentWindowWidth > BREAKPOINTS.MOBILE) ||
                           (lastWindowWidth > BREAKPOINTS.TABLET && currentWindowWidth <= BREAKPOINTS.TABLET) ||
                           (lastWindowWidth <= BREAKPOINTS.TABLET && currentWindowWidth > BREAKPOINTS.TABLET);
  
  if (shouldRecalculate) {
    // Try to get from CSS custom property first
    try {
      const computedStyle = getComputedStyle(document.documentElement);
      const unitValue = computedStyle.getPropertyValue('--base-unit').trim();
      const cssUnit = parseInt(unitValue);
      
      if (cssUnit && cssUnit > 0) {
        currentUnit = cssUnit;
      } else {
        // Fallback to breakpoint calculation if CSS value is invalid
        currentUnit = getUnitFromBreakpoint(currentWindowWidth);
      }
    } catch (e) {
      // Fallback to breakpoint calculation if CSS access fails
      currentUnit = getUnitFromBreakpoint(currentWindowWidth);
    }
    
    lastWindowWidth = currentWindowWidth;
  }
  
  return currentUnit;
}

// Helper function to determine if we're at a specific breakpoint
export function isAtBreakpoint(breakpoint) {
  if (typeof window === 'undefined') return false;
  
  switch (breakpoint) {
    case 'mobile':
      return window.innerWidth <= BREAKPOINTS.MOBILE;
    case 'tablet':
      return window.innerWidth > BREAKPOINTS.MOBILE && window.innerWidth <= BREAKPOINTS.TABLET;
    case 'desktop':
      return window.innerWidth > BREAKPOINTS.TABLET;
    default:
      return false;
  }
}

// Export breakpoints for use in other components
export { BREAKPOINTS, UNIT_SIZES }; 