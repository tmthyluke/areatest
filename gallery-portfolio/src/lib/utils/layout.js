// Layout utility functions extracted from the original gallery

export function calculateUnitSize() {
  const UNIT = 72;
  const MAX_COLS = 20;
  
  let bestCols = 0;
  let bestMarginUnits = 1;
  
  for (let testMarginUnits = 1; testMarginUnits <= 3; testMarginUnits++) {
    const testMargin = testMarginUnits * UNIT;
    const testAvailableWidth = window.innerWidth - (2 * testMargin);
    
    let testCols = Math.floor(testAvailableWidth / UNIT);
    if (testCols % 2 !== 0) testCols--;
    
    testCols = Math.min(testCols, MAX_COLS);
    
    if (testCols > bestCols || (testCols === bestCols && testMarginUnits > bestMarginUnits)) {
      bestCols = testCols;
      bestMarginUnits = testMarginUnits;
    }
  }
  
  return {
    unit: UNIT,
    cols: bestCols,
    marginUnits: bestMarginUnits,
    contentWidth: bestCols * UNIT,
    margin: bestMarginUnits * UNIT
  };
}

export function adjustImageBlock(element, unit, gridViewActive) {
  if (!element.classList.contains('image-item')) return;
  
  const img = element.querySelector('img');
  if (!img || !img.complete) return;
  
  const maxUnits = parseInt(element.dataset.maxUnits) || 4;
  const width = maxUnits * unit;
  element.style.width = width + 'px';
  
  const imgContainer = element.querySelector('.image-container');
  const height = Math.round(width * img.naturalHeight / img.naturalWidth / unit) * unit;
  
  if (imgContainer) {
    imgContainer.style.height = height + 'px';
  }
  
  const isFill = element.classList.contains('fill');
  img.style.objectFit = isFill ? 'cover' : 'contain';
  
  // Total height includes caption in feed view
  element.style.height = gridViewActive ? height + 'px' : (height + unit) + 'px';
}

export function adjustProjectDescription(element, unit) {
  if (!element.classList.contains('project-description')) return;
  
  let titleHeight = 2 * unit;
  let additionalHeight = 0;
  
  const additionalBlock = element.querySelector('.additional-block');
  if (additionalBlock && additionalBlock.classList.contains('expanded')) {
    const content = additionalBlock.querySelector('.text-inner.description-content');
    if (content) {
      const contentHeight = content.scrollHeight;
      const rows = Math.ceil((contentHeight + 24) / unit);
      additionalHeight = rows * unit;
      additionalBlock.style.maxHeight = additionalHeight + 'px';
    }
  }
  
  let totalHeight = titleHeight + additionalHeight;
  totalHeight = Math.ceil(totalHeight / unit) * unit;
  element.style.height = totalHeight + 'px';
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => { 
    clearTimeout(timer); 
    timer = setTimeout(() => fn(...args), delay); 
  };
} 