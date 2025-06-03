# Gridsite - Gallery Portfolio System

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

- **Frontend**: SvelteKit application (port 5173+)
- **Backend**: Node.js API server (port 3000)
- **Data Storage**: JSON files in projects directory

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

2. **Install frontend dependencies**
   ```bash
   cd gallery-portfolio
   npm install
   ```

3. **Start the backend server**
   ```bash
   # From the root directory
   node server.js
   ```

4. **Start the frontend development server**
   ```bash
   # In a new terminal, from the gallery-portfolio directory
   cd gallery-portfolio
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

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

The project consists of two main parts:

1. **Backend**: A Node.js server that provides the API for managing projects and images
2. **Frontend**: A SvelteKit application that provides the user interface

Both need to be running simultaneously for the full application to work.

## Contributing

1. Make sure both servers are running
2. Make changes to either the frontend (in `gallery-portfolio/`) or backend (`server.js`)
3. The frontend has hot reloading, so changes will be reflected immediately
4. For backend changes, restart the Node.js server

## Technical Details

See `spec.md` for detailed technical specifications, component documentation, and architecture details. 