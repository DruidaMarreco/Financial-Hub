#!/bin/bash

# Financial Hub Deployment Script for Raspberry Pi
# Makes it easy to deploy and manage the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Main menu
show_menu() {
    echo ""
    print_header "Financial Hub Deployment Manager"
    echo ""
    echo "1) Install dependencies (first time only)"
    echo "2) Deploy / Start application"
    echo "3) Stop application"
    echo "4) View logs"
    echo "5) Update application"
    echo "6) Backup database"
    echo "7) Generate SSL certificates"
    echo "8) Setup CloudFlare Tunnel"
    echo "9) Health check"
    echo "10) System info"
    echo "0) Exit"
    echo ""
    read -p "Select option: " choice
}

# 1. Install dependencies
install_deps() {
    print_header "Installing Dependencies"

    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_success "Docker installed"
    else
        print_success "Docker already installed"
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        sudo apt-get install -y docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose already installed"
    fi

    # Verify installation
    print_info "Docker version: $(docker --version)"
    print_info "Docker Compose version: $(docker-compose --version)"

    print_success "All dependencies installed"
}

# 2. Deploy application
deploy() {
    print_header "Deploying Financial Hub"

    if [ ! -f .env ]; then
        print_error ".env file not found! Copy from .env.example and configure it first."
    fi

    print_info "Building and starting services..."
    docker-compose up -d

    print_info "Waiting for services to be healthy..."
    sleep 10

    print_info "Running database migrations..."
    docker-compose exec -T api npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma || true

    print_success "Application deployed successfully!"
    print_info "Web app: http://localhost"
    print_info "API: http://localhost/api"
}

# 3. Stop application
stop_app() {
    print_header "Stopping Application"
    docker-compose down
    print_success "Application stopped"
}

# 4. View logs
view_logs() {
    print_header "Application Logs"
    echo ""
    echo "1) All services"
    echo "2) API only"
    echo "3) Web only"
    echo "4) Database only"
    echo "5) Nginx only"
    read -p "Select service: " service

    case $service in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f api ;;
        3) docker-compose logs -f web ;;
        4) docker-compose logs -f postgres ;;
        5) docker-compose logs -f nginx ;;
        *) print_error "Invalid option" ;;
    esac
}

# 5. Update application
update_app() {
    print_header "Updating Application"

    print_info "Pulling latest code..."
    git pull origin dev || print_error "Failed to pull from git"

    print_info "Building new images..."
    docker-compose build

    print_info "Restarting services..."
    docker-compose up -d

    print_info "Running migrations..."
    docker-compose exec -T api npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma || true

    print_success "Application updated"
}

# 6. Backup database
backup_db() {
    print_header "Backing Up Database"

    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="financial_hub_backup_$DATE.sql"

    print_info "Creating backup: $BACKUP_FILE"
    docker-compose exec -T postgres pg_dump -U postgres financial_hub > "$BACKUP_FILE"

    print_info "Compressing backup..."
    gzip "$BACKUP_FILE"

    print_success "Backup created: ${BACKUP_FILE}.gz"
    print_info "File size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
}

# 7. Generate SSL certificates
generate_ssl() {
    print_header "Generating SSL Certificates"

    mkdir -p ssl

    read -p "Enter domain name (or press Enter for self-signed): " domain

    if [ -z "$domain" ]; then
        print_info "Generating self-signed certificate..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
        print_success "Self-signed certificate generated"
    else
        print_info "Attempting Let's Encrypt certificate for $domain..."
        if command -v certbot &> /dev/null; then
            sudo certbot certonly --standalone -d "$domain" || print_error "Failed to get certificate"
            sudo cp /etc/letsencrypt/live/$domain/fullchain.pem ssl/cert.pem
            sudo cp /etc/letsencrypt/live/$domain/privkey.pem ssl/key.pem
            sudo chmod 644 ssl/cert.pem ssl/key.pem
            print_success "Let's Encrypt certificate installed"
        else
            print_error "certbot not found. Install with: sudo apt-get install -y certbot"
        fi
    fi

    print_info "Certificate: ssl/cert.pem"
    print_info "Key: ssl/key.pem"
}

# 8. Setup CloudFlare Tunnel
setup_tunnel() {
    print_header "Setting Up CloudFlare Tunnel"

    if ! command -v cloudflared &> /dev/null; then
        print_info "Installing cloudflared..."
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-armv7
        sudo dpkg -i cloudflared.deb
        rm cloudflared.deb
    fi

    read -p "Enter tunnel name: " tunnel_name
    read -p "Enter domain: " domain

    print_info "Logging in to Cloudflare..."
    cloudflared tunnel login

    print_info "Creating tunnel: $tunnel_name"
    cloudflared tunnel create "$tunnel_name"

    print_info "Setting up DNS route..."
    cloudflared tunnel route dns "$tunnel_name" "$domain"

    print_success "CloudFlare Tunnel configured!"
    print_info "Run 'cloudflared tunnel run $tunnel_name' to start"
}

# 9. Health check
health_check() {
    print_header "Health Check"

    print_info "Checking container status..."
    docker-compose ps

    echo ""
    print_info "Testing API..."
    curl -s http://localhost:3001/health > /dev/null && print_success "API is running" || print_error "API is not responding"

    echo ""
    print_info "Testing Web..."
    curl -s http://localhost:3000/ > /dev/null && print_success "Web is running" || print_error "Web is not responding"

    echo ""
    print_info "Checking database..."
    docker-compose exec -T postgres pg_isready -U postgres > /dev/null && print_success "Database is running" || print_error "Database is not responding"
}

# 10. System info
system_info() {
    print_header "System Information"

    echo ""
    print_info "Raspberry Pi Info:"
    echo "CPU: $(cat /proc/cpuinfo | grep model | head -1)"
    echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
    echo "Disk: $(df -h / | tail -1 | awk '{print $4 " free / " $2 " total"}')"
    echo "Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"

    echo ""
    print_info "Docker Info:"
    docker version --format 'Version: {{.Server.Version}}'
    echo "Running containers: $(docker ps --quiet | wc -l)"
    echo "Total containers: $(docker ps -a --quiet | wc -l)"

    echo ""
    print_info "Application Info:"
    echo "Status:"
    docker-compose ps --services

    echo ""
    print_info "Disk usage:"
    docker system df
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) install_deps ;;
        2) deploy ;;
        3) stop_app ;;
        4) view_logs ;;
        5) update_app ;;
        6) backup_db ;;
        7) generate_ssl ;;
        8) setup_tunnel ;;
        9) health_check ;;
        10) system_info ;;
        0) print_success "Goodbye!"; exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
    read -p "Press Enter to continue..."
done
