# SvelteKit Gallery Portfolio - Technical Specification

## Overview

A sophisticated, responsive gallery portfolio system built with SvelteKit featuring multi-project organization, responsive grid layouts, drag-and-drop functionality, and real-time image editing capabilities.

## Architecture

### Frontend (SvelteKit)
- **Framework**: SvelteKit with Vite
- **Port**: 5173+ (auto-increments if occupied)
- **Structure**: Multi-route application with dynamic project routing

### Backend (Node.js API)
- **Server**: Express.js API server
- **Port**: 3000
- **Data Storage**: JSON files in `projects/` directory structure

## Project Structure

```
├── gallery-portfolio/          # SvelteKit application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/     # Gallery components
│   │   │   ├── stores/         # Svelte stores
│   │   │   ├── styles/         # CSS files
│   │   │   └── utils/          # Utility functions
│   │   └── routes/
│   │       ├── +page.svelte    # Project selector
│   │       └── [project]/      # Dynamic project routes
├── projects/                   # Project data directory
│   ├── {project-name}/
│   │   ├── images/            # Project images
│   │   ├── image-settings.json # Image configuration
│   │   └── project.json       # Project metadata
└── server.js                  # Express API server
```

## Core Components

### 1. ModularGallery.svelte
**Primary gallery component with full editing capabilities**

**Features:**
- Grid and feed view modes
- Drag-and-drop reordering
- Real-time caption editing
- Image sizing controls (1-20 units)
- Fill/fit toggle for image display
- Lightbox view with navigation
- Upload functionality
- Responsive grid layout with centering

**Props:**
- `projectId` (string): Project identifier
- `projectImages` (array): Image data array
- `projectSettings` (object): Project configuration

### 2. SimpleGallery.svelte
**Simplified gallery component**

**Features:**
- Basic grid/feed view
- Reduced editing capabilities
- Lightbox support
- Upload functionality

### 3. ImageGallery.svelte
**Minimal gallery component**

**Features:**
- Display-only gallery
- Basic lightbox
- No editing capabilities

## Responsive Unit System

### Base Unit Sizes
- **Desktop**: 72px (default)
- **Tablet**: 60px (769px - 1024px)
- **Mobile**: 48px (≤768px)

### Implementation
```css
:root {
  --base-unit: 72px;
  --unit: var(--base-unit);
}

@media (max-width: 1024px) and (min-width: 769px) {
  :root {
    --base-unit: 60px;
    --unit: var(--base-unit);
  }
}

@media (max-width: 768px) {
  :root {
    --base-unit: 48px;
    --unit: var(--base-unit);
  }
}
```

### JavaScript Integration
- Cached unit reading with performance optimization
- Breakpoint change detection
- Synchronized CSS/JavaScript calculations

## Grid Layout System

### Grid View Features
- **Odd column enforcement**: Grid always uses odd numbers of columns for proper centering
- **Dynamic centering**: Single items on last row center properly
- **Responsive column calculation**: Automatic column count based on screen width and unit size
- **Gap spacing**: `calc(var(--unit)/2)` between grid items

### Grid Layout Logic
```javascript
// Ensure odd number of columns
if (totalColumns % 2 === 0) {
  totalColumns--;
}

// Calculate grid width for centering
const gridWidth = totalColumns * columnWidth;
```

### CSS Grid Configuration
```css
.grid.grid-layout {
  display: grid;
  gap: calc(var(--unit)/2);
  justify-content: center;
  align-content: start;
  place-items: center;
  margin: 0 auto;
}
```

## API Endpoints

### Project Management
- `GET /api/projects` - List all projects
- `GET /api/projects/{projectId}/settings` - Get project settings
- `POST /api/projects/{projectId}/settings` - Update project settings
- `GET /api/projects/{projectId}/images` - Get project images
- `GET /api/projects/{projectId}/images/{filename}` - Serve image file

### Legacy Support
- `POST /api/settings` - Legacy settings endpoint (maps to apple-branding project)

## Data Models

### Project Settings Schema
```json
{
  "imageOrder": ["img-id-1", "img-id-2", ...],
  "imageSettings": {
    "img-id-1": {
      "units": 4,
      "isFill": true,
      "caption": "Image caption"
    }
  }
}
```

### Project Metadata Schema
```json
{
  "name": "Project Name",
  "description": "Project description",
  "created": "ISO date string",
  "modified": "ISO date string"
}
```

## Features

### Controls System
- **Default State**: Hidden on page load
- **Toggle Button**: Controls visibility of editing interface
- **Body Class**: `hide-controls` applied when hidden
- **Keyboard Support**: Various keyboard shortcuts

### Image Editing
- **Unit Sizing**: 1-20 units width
- **Caption Editing**: Inline contenteditable
- **Fill/Fit Toggle**: Object-fit control
- **Drag-and-Drop**: Visual reordering with ghost elements

### Performance Optimizations
- **Debounced Updates**: 0ms debounce for instant responsiveness
- **Cached Unit Calculations**: Avoid repeated DOM queries
- **Lazy Loading**: Images load as needed
- **Efficient Resizing**: Smart resize handling with breakpoint detection

### View Modes
1. **Feed View**: Vertical flowing layout with background grid
2. **Grid View**: Fixed grid with dynamic column calculation
3. **Lightbox View**: Full-screen image viewing with navigation

## Background System

### Grid Patterns
- **Dynamic scaling**: Grid patterns scale with unit size
- **Responsive gradients**: Background gradients adjust to breakpoints
- **Visual indicators**: Corner markers and center points

### CSS Custom Properties
```css
--grid-color: #cdceda;
--bg-color: #ffffff;
--dot-color: var(--grid-color);
--grid-spacing: calc(var(--unit)/8);
```

## File Upload

### Support
- **Drag-and-drop**: Direct file dropping onto upload blocks
- **File picker**: Traditional file selection
- **Format support**: Images (jpg, png, svg, etc.)
- **Auto-processing**: Automatic addition to project

## Keyboard Shortcuts

### Navigation
- **Arrow keys**: Navigate between images in lightbox
- **Escape**: Close lightbox/exit modes
- **Space**: Toggle view modes

### Editing
- **Enter**: Confirm caption edits
- **Tab**: Navigate between editable elements

## Browser Support

### Requirements
- **Modern browsers**: ES6+ support required
- **CSS Grid**: Full CSS Grid support needed
- **CSS Custom Properties**: Variable support required
- **Fetch API**: For API communication

### Responsive Design
- **Mobile first**: Optimized for mobile devices
- **Touch support**: Touch-friendly interface
- **Smooth animations**: 60fps transitions

## Development

### Scripts
```bash
# Start development servers
cd gallery-portfolio && npm run dev  # SvelteKit dev server
node server.js                       # API server

# Kill existing processes
pkill -f "node server.js"
pkill -f "vite dev"
```

### Environment
- **Node.js**: Required for API server
- **npm**: Package management
- **Vite**: Build tool and dev server

## Deployment Considerations

### Production Setup
1. Build SvelteKit application: `npm run build`
2. Configure API server for production
3. Set up proper image serving
4. Configure CORS if needed

### Performance
- **Image optimization**: Consider WebP conversion
- **CDN**: For image delivery
- **Caching**: API response caching
- **Minification**: CSS/JS optimization

## Security

### File Upload Security
- **Type validation**: Server-side file type checking
- **Size limits**: Prevent large file uploads
- **Sanitization**: Filename sanitization

### API Security
- **Input validation**: All API inputs validated
- **Path traversal protection**: Secure file serving
- **CORS configuration**: Proper cross-origin setup

## Future Enhancements

### Potential Features
- **User authentication**: Multi-user support
- **Cloud storage**: AWS S3/Google Cloud integration
- **Image processing**: Automated optimization
- **Analytics**: Usage tracking
- **Themes**: Customizable color schemes
- **Export**: Portfolio export functionality

### Technical Improvements
- **TypeScript**: Type safety implementation
- **Testing**: Unit and integration tests
- **Documentation**: API documentation
- **Monitoring**: Error tracking and performance monitoring 