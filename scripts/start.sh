#!/bin/bash
set -e
echo "Starting Eneo + Nextcloud Integration..."
if [ ! -f .env ]; then
    echo "Error: .env file not found. Run './scripts/setup.sh' first."
    exit 1
fi
docker-compose up -d
echo "Services started! Access at http://localhost (Nextcloud) and http://localhost/eneo (Eneo)"
