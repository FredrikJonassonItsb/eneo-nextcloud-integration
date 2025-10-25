#!/bin/bash

# Eneo + Nextcloud Integration - Setup Script
# This script initializes the project and prepares it for first run

set -e

echo "========================================="
echo "Eneo + Nextcloud Integration - Setup"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate random passwords
    NEXTCLOUD_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    ENEO_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    ENEO_REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    ENEO_API_SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    # Update .env file with generated passwords
    sed -i "s/changeme_nextcloud_db_password/$NEXTCLOUD_DB_PASSWORD/" .env
    sed -i "s/changeme_eneo_db_password/$ENEO_DB_PASSWORD/" .env
    sed -i "s/changeme_eneo_redis_password/$ENEO_REDIS_PASSWORD/" .env
    sed -i "s/changeme_eneo_secret_key_min_32_characters_long/$ENEO_API_SECRET_KEY/" .env
    
    echo "✅ .env file created with random passwords"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "📦 Creating necessary directories..."
mkdir -p data/nextcloud data/eneo logs backups

echo ""
echo "🔧 Building Docker images..."
docker-compose build

echo ""
echo "========================================="
echo "✅ Setup completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env file if needed"
echo "2. Run './scripts/start.sh' to start the services"
echo "3. Access Nextcloud at http://localhost"
echo "4. Access Eneo at http://localhost/eneo"
echo ""
echo "Default Nextcloud credentials:"
echo "  Username: admin"
echo "  Password: changeme_secure_password (change this in .env)"
echo ""
echo "After first login to Nextcloud, configure OAuth2:"
echo "  1. Go to Settings → Security → OAuth 2.0"
echo "  2. Add new client with redirect URI: http://localhost/eneo/oauth/callback"
echo "  3. Copy Client ID and Secret to .env file"
echo "  4. Restart services with './scripts/start.sh'"
echo ""

