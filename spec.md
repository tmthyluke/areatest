# Gridsite Portfolio - Technical Specification

## 🎯 **Project Overview**

A modern, modular portfolio gallery system built with SvelteKit that provides smooth navigation between projects with three distinct viewing modes: Feed, Grid, and Lightbox. Features persistent settings storage and optimized layout calculations to prevent layout shift.

**Live Demo**: https://area-black.vercel.app/  
**Local Development**: http://localhost:5175/

---

## 🏗️ **Architecture**

### **Core Technologies**
- **Frontend**: SvelteKit (v2.11.1)
- **Runtime**: Node.js 18.x (Vercel)
- **Styling**: Vanilla CSS with CSS Custom Properties
- **Deployment**: Vercel with GitHub integration
- **API**: SvelteKit API routes (server-side)

### **Project Structure**
```
/
├── src/
│   ├── routes/                    # SvelteKit routes
│   │   ├── +layout.js             # Project data loading
│   │   ├── +layout.svelte         # Global layout
│   │   ├── +page.svelte           # Projects homepage
│   │   ├── [project]/             # Dynamic project routes
│   │   │   ├── +page.js           # Project page data
│   │   │   └── +page.svelte       # Project gallery page
│   │   └── api/                   # API endpoints
│   │       └── projects/[projectId]/
│   │           ├── images/+server.js  # Image listing
│   │           └── settings/+server.js # Settings CRUD
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ModularGallery.svelte  # Main gallery component
│   │   │   └── ImageItem.svelte       # Individual image component
│   │   ├── styles/
│   │   │   └── gallery.css            # Global gallery styles
│   │   └── utils/
│   │       ├── debounce.js            # Utility functions
│   │       ├── layout.js              # Layout calculations
│   │       └── units.js               # Unit size utilities
│   └── app.html                       # HTML template
├── static/                            # Static assets
│   ├── projects.json                  # Project configuration
│   ├── apple-branding/                # Project directory
│   │   ├── settings.json              # Project settings
│   │   ├── image-settings.json        # Detailed image settings
│   │   └── images/                    # Project images
│   ├── sky-project/                   # Additional projects...
│   └── portfolio-2024/
├── package.json                       # Dependencies
├── svelte.config.js                   # SvelteKit configuration
└── vercel.json                        # Deployment configuration
```

---

## 🎨 **View Modes**

### **1. Feed View (Default)**
- **Layout**: Vertical masonry-style layout
- **Image Sizing**: Variable units (2-20), even numbers only
- **Navigation**: Arrow keys for vertical scrolling
- **Interaction**: Click images to open lightbox

### **2. Grid View**
- **Layout**: CSS Grid with configurable column width
- **Image Sizing**: Uniform grid cells
- **Navigation**: Responsive grid based on screen size
- **Interaction**: Click images to return to feed view

### **3. Lightbox View**
- **Layout**: Full-screen image display
- **Image Sizing**: Dynamic based on image content
- **Navigation**: Arrow keys for previous/next
- **Interaction**: Escape to close, click nav areas

---

## ⚙️ **Component Architecture**

### **ModularGallery.svelte** (Main Component)
**Props:**
- `projectId`: String - Current project identifier
- `preloadedImages`: Array - Pre-fetched image data (optional)
- `preloadedSettings`: Object - Pre-fetched settings (optional)

**Key Features:**
- Layout shift prevention with CSS custom properties
- Responsive unit-based sizing system
- Live caption editing with auto-save
- Smooth transitions between view modes

### **ImageItem.svelte** (Reusable Component)
**Props:**
- `id`, `src`, `alt`, `caption`: String - Image metadata
- `units`: Number - Width in units (2-20, even numbers)
- `mode`: String - 'fill' or 'fit' object-fit mode
- `projectId`: String - For API endpoint construction

**Events:**
- `settingsChanged`: Fired when image settings update
- `imageLoaded`: Fired when image loads for layout recalculation

---

## 🔧 **API System**

### **Endpoints**

#### **GET /api/projects/[projectId]/images**
Returns list of image files for a project.
```json
{
  "images": [
    "/apple-branding/images/1-apple.png",
    "/apple-branding/images/stack.png"
  ]
}
```

#### **GET/POST /api/projects/[projectId]/settings**
**GET**: Returns project settings and image order
```json
{
  "settings": {
    "img-1-apple-fill": {
      "units": 6,
      "isFill": true,
      "caption": "Apple Logo"
    }
  },
  "imageOrder": ["img-1-apple-fill", "img-stack-fill"]
}
```

**POST**: Updates image settings or reorders images
```json
{
  "imageId": "img-1-apple-fill",
  "units": 8,
  "isFill": false,
  "caption": "Updated Caption"
}
```

### **Settings Storage**
- **Location**: `static/[project]/settings.json` and `image-settings.json`
- **Persistence**: File-based storage survives deployments
- **Scope**: Per-project settings isolation
- **Sync**: Real-time updates across devices

---

## 🎯 **Layout System**

### **Unit-Based Sizing**
- **Base Unit**: 72px (1 unit)
- **Breakpoints**: Responsive unit sizing
  - Mobile: 36px
  - Tablet: 54px  
  - Desktop: 72px
- **Grid Calculations**: Dynamic column count based on viewport

### **Layout Shift Prevention**
1. **CSS Custom Properties**: Fallback dimensions set immediately
2. **Pre-calculation**: Layout dimensions calculated on mount
3. **Smooth Loading**: Opacity transitions during layout ready state
4. **Persistent Margins**: Body margins applied instantly

### **Responsive Behavior**
```javascript
// Layout calculation logic
const UNIT = getUnitSize(); // Responsive unit size
const availableWidth = window.innerWidth - (2 * margin);
const columns = Math.floor(availableWidth / UNIT);
const contentWidth = columns * UNIT;
```

---

## 🚀 **Performance Features**

### **Image Loading**
- **Lazy Loading**: Images load as needed
- **Preloading**: Optional data pre-fetching for faster navigation
- **Layout Recalculation**: Triggered after image load events

### **State Management**
- **Component State**: Local Svelte reactivity
- **URL Synchronization**: Project routes reflect current state
- **Settings Persistence**: Real-time save without page reload

### **Optimization**
- **Debounced Resize**: Efficient window resize handling
- **CSS Transitions**: Smooth layout changes
- **Memory Management**: Event listener cleanup on unmount

---

## 🔧 **Development**

### **Setup**
```bash
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Project Configuration**
Edit `static/projects.json` to add new projects:
```json
{
  "projects": [
    {
      "id": "apple-branding",
      "title": "Apple Branding",
      "description": "Logo Design, App Icon Design",
      "date": "FEBRUARY 2023"
    }
  ]
}
```

### **Adding Projects**
1. Create directory: `static/[project-id]/`
2. Add images to: `static/[project-id]/images/`
3. Create settings: `static/[project-id]/settings.json`
4. Update `static/projects.json`

---

## 🚦 **Deployment**

### **Vercel Configuration**
```json
{
  "functions": {
    "src/routes/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### **Environment**
- **Runtime**: Node.js 18.x (required for filesystem access)
- **Build**: SvelteKit adapter-vercel
- **Assets**: Static files served via Vercel CDN
- **API**: Server-side API routes handle settings persistence

### **Build Process**
1. GitHub push triggers Vercel deployment
2. SvelteKit builds optimized static assets
3. API routes compiled to serverless functions
4. Static images served from CDN

---

## 🎛️ **Settings & Configuration**

### **Image Settings**
- **Units**: Width in 72px units (2-20, even numbers)
- **Mode**: Fill (cover) or Fit (contain) object-fit
- **Caption**: Editable text with live save
- **Order**: Drag & drop reordering (implementation ready)

### **View Settings**
- **Grid Column Width**: Adjustable units per grid column
- **Control Visibility**: Toggle editing controls
- **Layout Mode**: Feed/Grid/Lightbox state

### **Project Settings**
- **Image Order**: Persistent ordering across sessions
- **Individual Settings**: Per-image configuration
- **Cross-Device Sync**: Settings stored in repository

---

## 🔍 **Error Handling**

### **API Errors**
- **404 Errors**: Graceful handling of missing projects/images
- **Network Errors**: Retry logic and fallback states
- **Malformed Data**: Validation and default value assignment

### **Layout Errors**
- **Missing Images**: Placeholder handling
- **Invalid Dimensions**: Fallback to default sizing
- **Browser Compatibility**: Progressive enhancement

---

## 🧹 **Recent Optimizations (June 2024)**

### **Cleanup Actions Performed**
1. **Removed 170MB of duplicate images** from `static/images/`
2. **Eliminated unused gallery store** (392 lines)
3. **Removed redundant calculateUnitSize function**
4. **Cleaned up commented drag & drop CSS**
5. **Fixed accessibility warnings** (added tabindex)
6. **Removed .DS_Store files** and empty directories

### **Architecture Improvements**
- **Layout Shift Prevention**: CSS custom properties with fallbacks
- **Smoother Loading**: Opacity transitions during layout calculation
- **Cleaner Codebase**: Removed redundant functions and files
- **Better Performance**: Eliminated duplicate API calls and redundant calculations

### **File Structure Cleanup**
- **Before**: 1.7GB with duplicates
- **After**: 1.5GB, ~170MB saved
- **Organized**: Project-specific image storage only
- **Efficient**: Single source of truth for settings

---

## 📝 **Known Issues & Limitations**

### **Current Limitations**
- **Favicon Errors**: Occasional 404s in development (non-breaking)
- **Drag & Drop**: Implementation prepared but not active
- **Mobile Optimization**: Room for gesture improvements

### **Future Enhancements**
- **Image Upload**: Direct file upload functionality
- **Batch Operations**: Multi-select image management
- **Advanced Filters**: Category and tag-based organization
- **Performance**: Image optimization and WebP conversion

---

## 🔗 **Dependencies**

### **Production**
- `@sveltejs/kit@^2.11.1` - Core framework
- `@sveltejs/adapter-vercel@^5.4.7` - Vercel deployment
- `svelte@^5.3.0` - Component framework

### **Development**
- `@sveltejs/vite-plugin-svelte@^4.0.0` - Vite integration
- `vite@^6.3.5` - Build tool

### **Utilities**
- Custom debounce, layout, and unit utilities
- CSS custom properties for layout management
- Filesystem-based settings persistence

---

**Last Updated**: June 2024  
**Version**: 2.0 (Post-cleanup)  
**Status**: Production Ready ✅ 