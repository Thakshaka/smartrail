# SmartRail - Sri Lanka Railway Management System

A comprehensive railway management system for Sri Lanka featuring real-time train tracking, ML-based arrival predictions, and online booking capabilities.

## Features

### 🚆 Real-time Train Tracking
- Live GPS tracking of trains
- Interactive map visualization
- Station-to-station progress monitoring
- Real-time location updates via WebSocket

### 🤖 ML-based Predictions
- Arrival time predictions using machine learning
- Weather and traffic pattern analysis
- Historical data-driven insights
- Confidence scoring for predictions

### 🎫 Online Booking System
- User registration and authentication
- Train search and booking
- Seat selection and payment integration
- Booking management and cancellation

### 📱 Modern Web Interface
- Responsive design for all devices
- Real-time notifications
- Interactive dashboards
- User-friendly booking flow

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Material-UI** - Component library
- **Socket.io Client** - Real-time communication
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions

### Machine Learning
- **Python/Flask** - ML service
- **scikit-learn** - ML algorithms
- **TensorFlow** - Deep learning
- **pandas/numpy** - Data processing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancing

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- PostgreSQL 12+
- Redis (optional, for caching)
- Docker and Docker Compose (for containerized deployment)

### Quick Setup

1. **Clone and setup the project**
   ```bash
   git clone https://github.com/your-username/smartrail.git
   cd smartrail
   
   # Install all dependencies
   npm run install-all
   
   # Copy environment configuration
   cp env.example .env
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb smartrail_db
   
   # Run migrations and seed data
   npm run db:migrate
   npm run db:seed
   ```

3. **Start Development Environment**
   ```bash
   # Start all services (frontend, backend, ML service)
   npm run dev
   ```

   This will start:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **ML Service**: http://localhost:8000

### Docker Deployment

For production deployment using Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   ML Service    │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         └──────────────►│    Database     │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │      Redis      │
                        │     Cache       │
                        └─────────────────┘
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Train Endpoints
- `GET /api/trains` - Get all trains
- `GET /api/trains/search` - Search trains
- `GET /api/trains/:id` - Get specific train
- `GET /api/trains/:id/schedule` - Get train schedule

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Tracking Endpoints
- `GET /api/tracking/live` - Get live train locations
- `GET /api/tracking/train/:id` - Get train tracking data

### Prediction Endpoints
- `GET /api/predictions/train/:trainId/station/:stationId` - Get arrival prediction
- `GET /api/predictions/accuracy/metrics` - Get prediction accuracy

## Project Structure

```
smartrail/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── Dockerfile         # Client container config
│   └── nginx.conf         # Nginx configuration
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database scripts
│   └── Dockerfile        # Server container config
├── ml/                   # Python ML service
│   ├── models/           # ML models
│   ├── utils/            # ML utilities
│   ├── scripts/          # Training scripts
│   ├── data/             # Training data
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # ML service container config
├── docker-compose.yml    # Multi-container orchestration
├── package.json          # Root package configuration
└── .env                  # Environment variables
```

## Key Features Implemented

### ✅ Complete System Components
- **Frontend**: Full React application with all pages and components
- **Backend**: Complete Express.js API with all routes and middleware
- **ML Service**: Python Flask service with prediction models
- **Database**: PostgreSQL with complete schema and migrations
- **Real-time**: Socket.io integration for live updates
- **Authentication**: JWT-based user authentication
- **Containerization**: Docker setup for all services

### ✅ Core Functionality
- User registration and login
- Train search and booking
- Real-time train tracking
- ML-based arrival predictions
- Booking management
- Admin dashboard
- Payment integration ready
- Responsive design

### ✅ Production Ready
- Environment configuration
- Database migrations and seeding
- Error handling and logging
- Security middleware
- Docker containerization
- Health checks
- API documentation

## Available Scripts

```bash
# Development
npm run dev              # Start all services in development
npm run client:dev       # Start only frontend
npm run server:dev       # Start only backend
npm run ml:dev          # Start only ML service

# Production
npm start               # Start all services in production
npm run build          # Build frontend for production

# Database
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with initial data

# Installation
npm run install-all    # Install all dependencies
npm run setup         # Complete setup (install + migrate + seed)

# Testing
npm test              # Run all tests
npm run test:client   # Run frontend tests
npm run test:server   # Run backend tests

# ML Model
npm run ml:train      # Train ML model
```

## Environment Configuration

Key environment variables in `.env`:

```bash
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartrail_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_super_secret_jwt_key

# ML Service
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=your_ml_api_key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@smartrail.lk or create an issue on GitHub.

## Acknowledgments

- Sri Lanka Railways for domain expertise
- OpenStreetMap for mapping data
- Weather API providers for weather data
