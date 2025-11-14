# NextPlore Frontend

React + Vite + Leaflet application for exploring nearby locations on a map.

## Features

- 🗺️ Interactive map using React Leaflet
- 📍 Find nearby locations based on user location
- 🏷️ Filter locations by tags
- 🎯 Location recommendations based on interests
- 🎨 Custom icons from Foursquare
- 📱 Responsive design

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_FRONTEND_URL=http://localhost:5173
```

## Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── services/       # API services
├── hooks/          # Custom React hooks
├── context/        # React Context for state management
└── styles/         # CSS files
```

## Technologies

- React 18
- Vite
- React Leaflet
- Axios
- CSS3
