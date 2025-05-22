# LUX Frontend

React + TypeScript frontend application for the LUX energy management system.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Radix UI** components
- **Lucide React** icons

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API service functions
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── layouts/            # Layout components
```

## Key Features

- **Dashboard System** - Customizable widgets and metrics
- **Job Management** - Kanban board and task tracking
- **Site Management** - Energy site monitoring
- **User Management** - Authentication and permissions
- **Report Builder** - Dynamic report generation
- **Bio-mass Management** - Specialized energy management

## API Integration

The frontend communicates with the Django REST API backend. All API calls are handled through the `services/` directory.

## Deployment

The build creates a `dist/` folder that can be served by any static file server:

- **Nginx**
- **Apache**
- **Vercel**
- **Netlify**

## Build Output

- Optimized production build
- Code splitting for performance
- Gzipped assets for faster loading