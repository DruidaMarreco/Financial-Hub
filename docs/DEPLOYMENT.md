# Deployment Guide - Financial Hub on Raspberry Pi

Complete guide to deploy Financial Hub on a Raspberry Pi with stable URL access.

## Prerequisites

- Raspberry Pi 4 (or better) with 4GB+ RAM
- Raspbian OS (Debian-based)
- Docker & Docker Compose installed
- Stable internet connection
- Domain name (optional but recommended)

## Quick Start (5 minutes)

### 1. Install Docker on Raspberry Pi

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install -y docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Financial Hub

```bash
git clone https://github.com/DruidaMarreco/Financial-Hub.git
cd Financial-Hub
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=financial_hub
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/financial_hub

# API
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_here
PORT=3001

# Web
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Optional
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
```

### 4. Create SSL Certificates

#### Option A: Self-Signed (Quick Testing)

```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

#### Option B: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem ssl/key.pem
```

### 5. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Initialize Database

```bash
# Run migrations
docker-compose exec api npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma

# Generate Prisma client
docker-compose exec api npm run prisma:generate --workspace=@financial-hub/data
```

### 7. Access Your App

- **Web App**: `https://your-raspberry-pi-ip`
- **API**: `https://your-raspberry-pi-ip/api`
- **Health Check**: `https://your-raspberry-pi-ip/health`

---

## Getting a Stable URL

### Option 1: CloudFlare Tunnel (Recommended - Free & Easy)

Perfect for Raspberry Pi behind a home router.

#### Setup:

1. **Install Cloudflare Tunnel**

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-armv6
sudo dpkg -i cloudflared.deb
```

2. **Authenticate**

```bash
cloudflared tunnel login
```

3. **Create Tunnel**

```bash
cloudflared tunnel create financial-hub
```

4. **Configure Tunnel** (`~/.cloudflared/config.yml`)

```yaml
tunnel: financial-hub
credentials-file: /root/.cloudflared/[TUNNEL_ID].json

ingress:
  - hostname: financial-hub.yourdomain.com
    service: https://localhost:443
  - service: http_status:404
```

5. **Route to Domain**

```bash
cloudflared tunnel route dns financial-hub yourdomain.com
```

6. **Run Tunnel**

```bash
cloudflared tunnel run financial-hub
```

**Permanent Service**:

```bash
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared
```

**Result**: Access via `https://financial-hub.yourdomain.com`

---

### Option 2: ngrok (Quick Testing)

Fast temporary tunnel, perfect for testing.

#### Setup:

```bash
# Download
curl -sSL https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.zip -o ngrok.zip
unzip ngrok.zip

# Authenticate
./ngrok authtoken YOUR_AUTH_TOKEN

# Run tunnel
./ngrok http 443
```

**Result**: Get a temporary URL like `https://abc123def456.ngrok.io`

---

### Option 3: Dynamic DNS (Advanced)

Use your own domain with dynamic DNS.

#### Setup:

1. **Install Dynamic DNS Client**

```bash
sudo apt-get install -y ddclient
```

2. **Configure** (`/etc/ddclient.conf`)

```conf
protocol=dyndns2
use=web, web=checkip.dyndns.com/
server=dyndns.org
login=your_username
password=your_password
your-domain.dyndns.org
```

3. **Enable & Start**

```bash
sudo systemctl enable ddclient
sudo systemctl start ddclient
```

#### Router Configuration:

1. Port forward to Raspberry Pi:
   - External: 443 → Internal: 443
   - External: 80 → Internal: 80

2. Access via: `https://your-domain.dyndns.org`

---

### Option 4: Cheap VPS Reverse Proxy

Most reliable for 24/7 uptime.

1. **Get VPS** ($5/month):
   - DigitalOcean
   - Linode
   - Hetzner
   - AWS Lightsail

2. **Configure Reverse Proxy** (on VPS):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass https://your-raspberry-pi-ip:443;
        proxy_ssl_verify off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Firewall on Raspberry Pi**:

```bash
sudo ufw allow from VPS_IP to any port 443
```

---

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# Real-time
docker-compose logs -f --tail=50
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d financial_hub

# Backup database
docker-compose exec postgres pg_dump -U postgres financial_hub > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres financial_hub < backup.sql
```

### Update Application

```bash
# Pull latest code
git pull origin dev

# Rebuild containers
docker-compose build

# Restart services
docker-compose up -d

# Run migrations
docker-compose exec api npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma
```

### Restart Services

```bash
# Restart specific service
docker-compose restart api

# Restart all
docker-compose restart

# Full restart
docker-compose down
docker-compose up -d
```

---

## Monitoring

### Health Check

```bash
# Test API
curl https://your-domain.com/health

# Test Web
curl https://your-domain.com/

# Test specific endpoint
curl https://your-domain.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Resource Monitoring

```bash
# Check Docker stats
docker stats

# Check disk space
df -h

# Check memory
free -h

# Check Raspberry Pi temperature
vcgencmd measure_temp
```

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Filter by service
docker-compose logs -f api --tail=100

# Export logs
docker-compose logs > app.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process
sudo kill -9 PID
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt
sudo certbot renew

# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1;"
```

### Out of Memory

```bash
# Check available memory
free -h

# Remove unused Docker images/volumes
docker system prune -a

# Increase swap (optional)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Increase CONF_SWAPSIZE
sudo dphys-swapfile swapon
```

### High CPU Usage

```bash
# Check what's consuming CPU
docker stats

# Check logs for errors
docker-compose logs | grep -i error
```

---

## Security Best Practices

### 1. Strong Passwords

```bash
# Generate secure password
openssl rand -base64 32

# Use in .env file
```

### 2. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Deny by default
sudo ufw default deny incoming
```

### 3. Regular Backups

```bash
# Backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres financial_hub > backup_$DATE.sql
tar -czf financial_hub_backup_$DATE.tar.gz backup_$DATE.sql

# Schedule with cron
crontab -e
# Add: 0 2 * * * /home/pi/Financial-Hub/backup.sh
```

### 4. Keep Systems Updated

```bash
# Update OS
sudo apt-get update && sudo apt-get upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 5. Monitor for Intrusions

```bash
# Install fail2ban
sudo apt-get install -y fail2ban

# Enable jail for nginx
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Performance Optimization

### 1. Redis Caching (Optional)

Add to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: financial-hub-redis
  ports:
    - "6379:6379"
  networks:
    - financial-hub-network
```

### 2. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_category ON transactions(category);
```

### 3. nginx Tuning

Already optimized in `nginx.conf`:
- Gzip compression enabled
- Caching for static assets
- Rate limiting configured
- Connection pooling enabled

---

## Scaling (Future)

When you outgrow Raspberry Pi:

1. **Move Database to Cloud** (AWS RDS, DigitalOcean Managed DB)
2. **Container Orchestration** (Kubernetes)
3. **Load Balancing** (multiple instances)
4. **CDN** (CloudFlare, AWS CloudFront)
5. **Serverless** (AWS Lambda, Vercel)

---

## Support & Resources

- Docker Docs: https://docs.docker.com
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Nginx: https://nginx.org
- PostgreSQL: https://www.postgresql.org
- Raspberry Pi: https://www.raspberrypi.org

---

## Deployment Checklist

Before going 24/7:

- [ ] SSL certificate configured
- [ ] Environment variables secured
- [ ] Database backed up
- [ ] Firewall enabled
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Auto-restart enabled
- [ ] Static URL configured
- [ ] Performance baseline recorded
- [ ] Security scan completed

---

## Final Notes

Your Financial Hub is now:
- ✅ Containerized & portable
- ✅ Production-ready
- ✅ Accessible via stable URL
- ✅ Secure with SSL/TLS
- ✅ Monitored & backed up
- ✅ Running 24/7

**Enjoy your personal finance platform!** 🚀
