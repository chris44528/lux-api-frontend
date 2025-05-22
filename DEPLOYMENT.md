# LUX Frontend Deployment Guide

## Production Build

The frontend has been successfully built and is ready for deployment.

### Build Status
✅ **Production build completed successfully**
- Bundle size: 1.88 MB (513 KB gzipped)
- All critical TypeScript errors resolved
- Optimized for production

### Deployment Options

#### Option 1: Static File Hosting (Recommended)

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/lux-frontend/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/lux-frontend/dist
    
    <Directory /var/www/lux-frontend/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### Option 2: Docker Deployment

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Commands:**
```bash
# Build image
docker build -t lux-frontend .

# Run container
docker run -d -p 80:80 lux-frontend
```

### Environment Setup

1. **Create production .env file:**
   ```env
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

2. **Rebuild for production (if environment changes):**
   ```bash
   npm run build
   ```

### Deployment Steps

1. **Upload files to server:**
   ```bash
   # Copy dist folder to server
   scp -r dist/ user@server:/var/www/lux-frontend/
   ```

2. **Set proper permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/lux-frontend/
   sudo chmod -R 755 /var/www/lux-frontend/
   ```

3. **Configure web server (Nginx/Apache)**
4. **Test deployment**
5. **Set up SSL certificate (recommended)**

### Performance Optimizations

- ✅ Code splitting implemented
- ✅ Asset compression enabled
- ✅ Bundle size optimized
- ✅ Production build created

### Monitoring

Monitor these metrics after deployment:
- **Page load times**
- **Bundle size impact**
- **API response times**
- **Error rates**

### Troubleshooting

**Common Issues:**
1. **404 on refresh** - Ensure client-side routing is configured
2. **API connection failed** - Check VITE_API_BASE_URL environment variable
3. **Assets not loading** - Verify file permissions and paths

**Health Check:**
```bash
curl -I https://your-domain.com
```

### Rollback Plan

Keep previous builds for quick rollback:
```bash
# Backup current
mv /var/www/lux-frontend /var/www/lux-frontend-backup

# Restore previous
mv /var/www/lux-frontend-previous /var/www/lux-frontend
```