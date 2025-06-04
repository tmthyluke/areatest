# Gridsite - Gallery Portfolio System

## 📌 Status: Definitive Working Version (June 3, 2025)

**✅ CONFIRMED WORKING STATE - SINGLE SERVER ARCHITECTURE**
- ✅ SvelteKit Frontend + API: Running on port 5174 
- ✅ Projects Loaded: sky-project, portfolio-2024, apple-branding 
- ✅ Image Loading: All images serving correctly 
- ✅ Version Control: Clean Git state with tagged release 
- ✅ **NEW**: Eliminated separate API server - everything runs in SvelteKit!

> This version was successfully restored from backup folder "New copy 4" and migrated to a single-server architecture on June 3, 2025.

A sophisticated, responsive gallery portfolio system built with SvelteKit featuring multi-project organization, responsive grid layouts, drag-and-drop functionality, and real-time image editing capabilities.

## Features

- **Multi-project organization**: Manage multiple gallery projects
- **Responsive grid layouts**: Automatic grid sizing for different screen sizes
- **Drag-and-drop reordering**: Visual image reordering with ghost elements
- **Real-time editing**: Inline caption editing, image sizing controls
- **Multiple view modes**: Grid view and feed view
- **Lightbox support**: Full-screen image viewing with navigation
- **Upload functionality**: Easy image uploading
- **Image controls**: Sizing (1-20 units), fill/fit toggle, captions

## Architecture

- **Frontend + Backend**: Single SvelteKit application with built-in API routes
- **Data Storage**: JSON files in projects directory
- **Port**: 5173 (development) - serves both frontend and API

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd New
   ```

2. **Install dependencies**
   ```bash
   cd gallery-portfolio
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Application: http://localhost:5173
   - All API endpoints are served from the same server

## Project Structure

```
├── gallery-portfolio/          # SvelteKit application
│   ├── src/
│   │   ├── lib/components/     # Gallery components
│   │   ├── routes/             # Application routes
│   │   └── ...
├── projects/                   # Project data directory
│   └── {project-name}/
│       ├── images/            # Project images
│       ├── settings.json      # Image configuration
│       └── ...
├── images/                    # Static images
├── server.js                  # Express API server
└── spec.md                   # Technical specification
```

## API Endpoints

- `GET /api/projects` - List all projects
- `GET /api/projects/{projectId}/settings` - Get project settings
- `POST /api/projects/{projectId}/settings` - Update project settings
- `GET /api/projects/{projectId}/images` - Get project images
- `GET /api/projects/{projectId}/images/{filename}` - Serve image file

## Development

The project is now a unified SvelteKit application with built-in API routes:

- **Frontend**: Svelte components in `gallery-portfolio/src/routes/`
- **API**: SvelteKit API routes in `gallery-portfolio/src/routes/api/`
- **Hot Reloading**: Both frontend and API changes are reflected immediately
- **Single Process**: No need to manage multiple servers

To develop:
1. Run `npm run dev` in the `gallery-portfolio/` directory
2. Make changes to either frontend components or API routes
3. Changes are automatically reflected in the browser

## Contributing

1. Make sure both servers are running
2. Make changes to either the frontend (in `gallery-portfolio/`) or backend (`server.js`)
3. The frontend has hot reloading, so changes will be reflected immediately
4. For backend changes, restart the Node.js server

## Technical Details

See `spec.md` for detailed technical specifications, component documentation, and architecture details. 