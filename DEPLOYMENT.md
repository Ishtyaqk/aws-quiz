# Deployment Guide - AWS Quiz Application

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Application available at http://localhost:3000
```

## Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start

# Application available at http://localhost:3000
```

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Perfect for:
- First-time deployments
- Automatic scaling
- Zero-configuration deployment
- Free tier available

Steps:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Push updates
git push  # Automatically deploys on push if connected
```

**Benefits**:
- One-click deployment
- Automatic HTTPS
- Performance monitoring
- Free tier: $0/month for small apps
- Custom domain support

---

### Option 2: AWS EC2 (Replace Existing)

Perfect for:
- Existing AWS infrastructure
- Custom domain
- Full control
- Enterprise deployments

#### Prerequisites
- EC2 instance (Ubuntu 22.04+)
- Node.js 18+
- Nginx reverse proxy
- PM2 for process management

#### Deployment Steps

1. **Connect to EC2**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone Repository**
```bash
cd ~
git clone <your-repo-url> quiz_app
cd quiz_app
npm install
```

4. **Build Application**
```bash
npm run build
```

5. **Install PM2**
```bash
sudo npm install -g pm2
```

6. **Start with PM2**
```bash
pm2 start npm --name "quiz-app" -- start
pm2 startup
pm2 save
```

7. **Configure Nginx**

Create `/etc/nginx/sites-available/quiz`:
```nginx
upstream quiz_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://quiz_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/quiz /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

8. **Setup SSL (HTTPS)**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Docker (Container)

Perfect for:
- Container orchestration (Kubernetes, Docker Swarm)
- Consistent environments
- Easy scaling
- CI/CD integration

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Build and Run
```bash
# Build image
docker build -t aws-quiz-app .

# Run container
docker run -p 3000:3000 \
  -v /data/questions:/app/public/data \
  -v /data/results:/app/public/results \
  aws-quiz-app
```

#### Docker Compose
```yaml
version: '3.8'

services:
  quiz-app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./public/data:/app/public/data
      - ./public/results:/app/public/results
    environment:
      - NODE_ENV=production
```

Run with:
```bash
docker-compose up -d
```

---

### Option 4: Heroku

Perfect for:
- Quick cloud deployments
- Automatic Git integration
- Simple configuration

Steps:
```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

### Option 5: DigitalOcean

Perfect for:
- Affordable VPS
- Simple management
- Good support

1. Create droplet (Ubuntu 22.04)
2. Follow "AWS EC2" steps above
3. Use DigitalOcean's firewall for security

---

### Option 6: Azure/GCP

Use same approach as AWS EC2 with respective cloud provider's VMs.

---

## Data Persistence Setup

For any deployment, ensure these directories are persistent:

```
/public/data/          # Question database
/public/results/       # Quiz results
/public/uploads/       # Uploaded files
```

### On EC2/VPS
```bash
# These are already in the repo
# Just ensure they're backed up
sudo cp -r ~/quiz_app/public /backup/
```

### With Docker
Mount volumes:
```bash
docker run -v /host/path/data:/app/public/data:rw \
           -v /host/path/results:/app/public/results:rw \
           aws-quiz-app
```

### With Vercel
Files are stored in `/tmp` which persists during deployment but is lost on function restart. For production:
- Use AWS S3 or similar
- Or use Vercel's KV storage

---

## Database Migration (Future)

When ready to migrate from file-based to database:

1. Update `/app/api/questions/route.ts`
2. Update `/app/api/results/route.ts`
3. Add database URL to environment variables
4. Run migration script
5. Update `.gitignore` to exclude `/public/` files

---

## Environment Variables

Create `.env.production` for production deployments:

```bash
# Database (when migrating)
# DATABASE_URL=postgresql://...

# Security headers
# API_KEY_SECRET=your-secret-key

# Feature flags
# MAINTENANCE_MODE=false
```

---

## SSL/HTTPS Setup

### Automatic (Vercel)
Built-in - just use your domain

### AWS EC2 (Let's Encrypt + Certbot)
```bash
sudo certbot certonly --standalone -d your-domain.com
```

Nginx config:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    # ... rest of config
}
```

---

## Monitoring & Logging

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 logs quiz-app      # View logs
pm2 save               # Save process list
pm2 startup            # Auto-start on reboot
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# With npm start (pm2)
pm2 logs quiz-app --lines 100
```

---

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/quiz_app_$DATE.tar.gz /home/ubuntu/quiz_app/public/
find /backup -name "quiz_app_*.tar.gz" -mtime +7 -delete
```

Schedule with cron:
```bash
0 2 * * * /home/ubuntu/backup.sh
```

---

## Performance Optimization

### 1. Enable Gzip Compression
Nginx:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 2. Enable Caching Headers
```nginx
location ~* \.(css|js|jpg|png|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use CDN
- Cloudflare (Free tier available)
- CloudFront (AWS)
- Bunny CDN

### 4. Monitor Performance
```bash
# Lighthouse audit (CLI)
npm install -g @lhci/cli@latest
lhci autorun

# Check bundle size
npm run build
du -sh .next/
```

---

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set security headers in Nginx
- [ ] Enable firewall
- [ ] Regular backups
- [ ] Keep Node.js updated
- [ ] Use environment variables for secrets
- [ ] Regular security audits
- [ ] Enable CORS if needed
- [ ] Rate limiting on API
- [ ] Input validation

### Nginx Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Out of Memory
```bash
# Increase PM2 memory limit
pm2 start npm --name "quiz-app" -- start --max-memory-restart 1G

# Or increase Node.js heap
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 list

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart
pm2 restart quiz-app
sudo systemctl restart nginx
```

### Files Not Persisting
```bash
# Check directory permissions
ls -la /home/ubuntu/quiz_app/public/

# Fix if needed
chmod -R 755 /home/ubuntu/quiz_app/public/
```

---

## Rollback Procedure

If something goes wrong:

```bash
# Stop current version
pm2 stop quiz-app

# Get previous version
git revert <commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart quiz-app
```

---

## Scaling Considerations

### Current Setup (File-based)
- Good for: < 100 concurrent users
- Single server deployment
- No database needed

### To Scale Further
1. Move to database (PostgreSQL/MongoDB)
2. Use load balancer (AWS ALB, Nginx)
3. Multiple application instances
4. Separate file storage (S3, Google Cloud Storage)
5. Redis for caching

---

## Next Steps

1. **Test Locally**
   ```bash
   npm run build
   npm start
   ```

2. **Choose Deployment Option** - Use Vercel for easiest setup

3. **Configure Domain** - Point DNS to your server

4. **Setup Monitoring** - Enable performance tracking

5. **Plan Scaling** - Document expected growth

---

## Support

For deployment issues:
1. Check `/var/log/` for error logs
2. Run `npm run build` locally first
3. Verify Node.js version
4. Check disk space and memory
5. Test API endpoints: `curl http://localhost:3000/api/questions`

---

**Happy deploying!**

For questions, refer to README.md or CONVERSION_COMPLETE.md
