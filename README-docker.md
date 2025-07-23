# Docker Setup for Kanban Progress Tracker

## Prerequisites
- Docker
- Docker Compose

## Running with Docker

1. **Build and start containers:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Open http://localhost:3000 in your browser

3. **Stop containers:**
   ```bash
   docker-compose down
   ```

## Container Structure

- **app**: Node.js application container
- **db**: MariaDB database container

## Environment Variables

The Docker setup uses these environment variables:
- DB_HOST=db (internal Docker network hostname)
- DB_USER=root
- DB_PASSWORD=password
- DB_NAME=kanban_tracker

## Data Persistence

Database data is stored in a Docker volume named `db_data`.

## Troubleshooting

1. **Database connection issues:**
   ```bash
   docker-compose logs db
   ```

2. **Application errors:**
   ```bash
   docker-compose logs app
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```