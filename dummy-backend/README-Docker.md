# Docker Setup for Flask iCal API

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop the container
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t flask-ical-api .

# Run the container
docker run -p 5000:5000 flask-ical-api
```

## Access the API

- API Root: http://localhost:5000/
- Calendar endpoint: http://localhost:5000/calendar

## Development

The docker-compose setup includes volume mounting for development, so changes to your code will be reflected without rebuilding the container.

## Files Structure

- `Dockerfile` - Container definition
- `docker-compose.yml` - Service orchestration
- `.dockerignore` - Files to exclude from Docker context
- `requirements.txt` - Python dependencies
- `app.py` - Flask application
- `wi24a3.ics` - Calendar data file