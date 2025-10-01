#!/bin/bash

# Docker Desktop startup check script for ProcureX
# This script verifies that Docker Desktop is running before executing docker commands

set -e

echo "🐳 Checking Docker Desktop status..."

# Function to check if Docker is running
check_docker() {
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check Docker Compose availability
check_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        return 0
    elif command -v docker-compose >/dev/null 2>&1; then
        echo "ℹ️  Using legacy docker-compose command"
        return 0
    else
        return 1
    fi
}

# Check if Docker is running
if check_docker; then
    echo "✅ Docker Desktop is running"
    
    # Check Docker Compose
    if check_docker_compose; then
        echo "✅ Docker Compose is available"
        
        # Show Docker version info
        echo ""
        echo "📋 Docker Environment:"
        docker version --format "Client: {{.Client.Version}}"
        docker version --format "Server: {{.Server.Version}}"
        echo ""
        
        # If a command was provided, execute it
        if [ $# -gt 0 ]; then
            echo "🚀 Executing: $@"
            exec "$@"
        else
            echo "✅ Docker Desktop is ready for use!"
            echo ""
            echo "Available commands:"
            echo "  ./scripts/check-docker.sh docker compose up"
            echo "  ./scripts/check-docker.sh docker compose build"
            echo "  ./scripts/check-docker.sh docker compose down"
        fi
    else
        echo "❌ Docker Compose is not available"
        echo "Please ensure Docker Desktop is properly installed with Compose support"
        exit 1
    fi
else
    echo "❌ Docker Desktop is not running or not accessible"
    echo ""
    echo "To start Docker Desktop:"
    echo "  • Windows: Start Docker Desktop from Start Menu"
    echo "  • macOS: Open Docker Desktop from Applications"
    echo "  • Linux: Run 'sudo systemctl start docker'"
    echo ""
    echo "After starting Docker Desktop, wait for it to be ready and try again."
    exit 1
fi
