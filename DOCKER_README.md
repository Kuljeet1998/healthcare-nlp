# 🐳 Docker Deployment Guide

This guide covers how to deploy the FHIR Healthcare Query Service using Docker containers.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB free disk space

## 🚀 Quick Start

### Development Deployment
```bash
# Clone and navigate to the project
cd /Users/kuljeetsingh/Desktop/onye

# Deploy in development mode
./deploy.sh development

# Or use docker-compose directly
docker-compose up --build
```

### Production Deployment
```bash
# Deploy in production mode with optimizations
./deploy.sh production

# Or use docker-compose directly
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Next.js        │    │  Python Flask   │
│   Port 80       │◄──►│  Frontend       │◄──►│  Backend        │
│   (Production)  │    │  Port 3000      │    │  Port 5001      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Container Structure

### Backend Container (`fhir-backend`)
- **Base Image**: python:3.11-slim
- **Port**: 5001
- **Features**:
  - spaCy NLP processing
  - Flask API server
  - FHIR query generation
  - Health monitoring

### Frontend Container (`fhir-frontend`)
- **Base Image**: node:22-alpine
- **Port**: 3000
- **Features**:
  - Next.js with React
  - Multi-language support
  - Responsive UI
  - API integration

### Nginx Container (`fhir-nginx`)
- **Base Image**: nginx:alpine
- **Port**: 80/443
- **Features**:
  - Reverse proxy
  - Load balancing
  - SSL termination
  - Security headers

## 🔧 Configuration

### Environment Variables

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit the variables:
```bash
# Backend Configuration
FLASK_ENV=production
PYTHONUNBUFFERED=1

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://backend:5001
NODE_ENV=production

# Security (optional)
JWT_SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### Custom Configuration

#### Backend Configuration
Modify `fhir_api_server.py` for custom settings:
```python
# Custom port
app.run(host='0.0.0.0', port=5001)

# Custom CORS settings
CORS(app, origins=['http://localhost:3000', 'https://yourdomain.com'])
```

#### Frontend Configuration
Modify `next.config.ts` for custom settings:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  },
}
```

## 🛠️ Deployment Commands

### Using the Deploy Script
```bash
# Development mode
./deploy.sh development

# Production mode
./deploy.sh production

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Clean everything
./deploy.sh clean
```

### Using Docker Compose Directly

#### Development
```bash
# Start development environment
docker-compose up --build

# Start with specific services
docker-compose up backend-dev

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

#### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services
docker-compose -f docker-compose.prod.yml up --scale frontend=2 -d

# Update services
docker-compose -f docker-compose.prod.yml up --build -d --no-deps frontend
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Backend health
curl http://localhost:5001/api/health

# Frontend health
curl http://localhost:3000

# Nginx health
curl http://localhost:80/health
```

### Container Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Container Shell Access
```bash
# Backend container
docker exec -it fhir-backend bash

# Frontend container
docker exec -it fhir-frontend sh

# Check processes
docker exec fhir-backend ps aux
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Container inspection
docker inspect fhir-backend

# Network inspection
docker network ls
docker network inspect onye_fhir-network
```

## 🔒 Security Considerations

### Production Security
```bash
# Run containers as non-root
USER appuser  # Already configured in Dockerfiles

# Use secrets management
docker secret create jwt_secret jwt_secret.txt
docker service create --secret jwt_secret fhir-backend

# Enable firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 5001  # Block direct backend access
```

### SSL Configuration
```bash
# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Update nginx.conf for SSL
# Uncomment SSL server block in nginx.conf
```

## 📊 Performance Optimization

### Resource Limits
```yaml
# In docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Caching
```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use build cache
docker-compose build --parallel

# Multi-stage builds (already implemented)
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :5001

# Kill process
kill -9 <PID>

# Use different ports
docker-compose up -p custom-project-name
```

#### Memory Issues
```bash
# Check Docker memory
docker system df

# Clean up
docker system prune -a

# Increase Docker memory (Docker Desktop)
# Settings → Resources → Memory → 4GB+
```

#### Network Issues
```bash
# Reset Docker networks
docker network prune

# Check container connectivity
docker exec fhir-frontend ping backend

# Debug DNS resolution
docker exec fhir-frontend nslookup backend
```

#### Build Failures
```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -f Dockerfile.backend -t test-backend .
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale frontend instances
docker-compose up --scale frontend=3

# Use external load balancer
# Update nginx.conf upstream block
upstream frontend {
    server frontend_1:3000;
    server frontend_2:3000;
    server frontend_3:3000;
}
```

### Database Integration (Future)
```bash
# Start with database
docker-compose --profile database up

# Connect to PostgreSQL
docker exec -it fhir-db-dev psql -U fhir_user -d fhir_dev
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy FHIR Service
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up --build -d
          docker-compose -f docker-compose.prod.yml exec -T backend python -c "print('Health check')"
```

## 📞 Support

For deployment issues:
- Check logs: `./deploy.sh logs`
- Verify health: `curl http://localhost:5001/api/health`
- Review configuration: `docker-compose config`
- Contact support: support@fhir-query-service.com
