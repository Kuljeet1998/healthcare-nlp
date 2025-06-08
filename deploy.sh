#!/bin/bash

# FHIR Healthcare Query Service - Deployment Script
# This script builds and deploys the application using Docker

set -e

echo "🏥 FHIR Healthcare Query Service - Docker Deployment"
echo "=================================================="

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p logs
    mkdir -p ssl
    print_success "Directories created"
}

# Build images
build_images() {
    print_info "Building Docker images..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE build --no-cache
    else
        docker-compose -f $COMPOSE_FILE build --no-cache
    fi
    
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE up -d
    else
        docker-compose -f $COMPOSE_FILE up -d
    fi
    
    print_success "Services started successfully"
}

# Health check
health_check() {
    print_info "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f -s http://localhost:5001/api/health > /dev/null; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
}

# Show status
show_status() {
    print_info "Service status:"
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE ps
    else
        docker-compose -f $COMPOSE_FILE ps
    fi
}

# Show logs
show_logs() {
    print_info "Showing recent logs:"
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE logs --tail=50
    else
        docker-compose -f $COMPOSE_FILE logs --tail=50
    fi
}

# Main execution
main() {
    echo "🚀 Starting deployment for environment: $ENVIRONMENT"
    echo ""
    
    check_docker
    create_directories
    build_images
    start_services
    health_check
    show_status
    
    echo ""
    print_success "Deployment completed!"
    echo ""
    print_info "🌐 Frontend: http://localhost:3000"
    print_info "🔗 Backend API: http://localhost:5001"
    print_info "📊 Health Check: http://localhost:5001/api/health"
    echo ""
    print_info "📝 To view logs: ./deploy.sh logs"
    print_info "🛑 To stop services: ./deploy.sh stop"
    print_info "🔄 To restart services: ./deploy.sh restart"
}

# Handle script arguments
case "${1:-deploy}" in
    "production")
        ENVIRONMENT="production"
        main
        ;;
    "development"|"dev")
        ENVIRONMENT="development"
        main
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        print_info "Stopping services..."
        docker-compose down
        docker-compose -f $PROD_COMPOSE_FILE down 2>/dev/null || true
        print_success "Services stopped"
        ;;
    "restart")
        print_info "Restarting services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    "clean")
        print_warning "This will remove all containers, images, and volumes!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v --remove-orphans
            docker system prune -af
            print_success "System cleaned"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  development, dev  Deploy in development mode (default)"
        echo "  production        Deploy in production mode"
        echo "  logs              Show service logs"
        echo "  status            Show service status"
        echo "  stop              Stop all services"
        echo "  restart           Restart all services"
        echo "  clean             Remove all containers and images"
        echo "  help              Show this help message"
        ;;
    *)
        main
        ;;
esac
