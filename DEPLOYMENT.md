# Deployment Guide

This guide covers various deployment options for the Educational Runner Game.

## 🚀 Static Hosting Options

### GitHub Pages

1. **Fork or create repository**:
   - Fork this repository or create a new one
   - Upload all game files to the repository

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder
   - Click Save

3. **Access your game**:
   - Your game will be available at: `https://yourusername.github.io/repository-name`
   - It may take a few minutes to deploy

4. **Custom domain** (optional):
   - Add a `CNAME` file with your domain name
   - Configure DNS settings with your domain provider

### Netlify

1. **Connect repository**:
   - Sign up at [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository

2. **Deploy settings**:
   - Build command: Leave empty (static site)
   - Publish directory: Leave empty (root)
   - The `netlify.toml` file will handle configuration

3. **Custom domain**:
   - Go to Site settings → Domain management
   - Add your custom domain
   - Netlify will handle SSL certificates automatically

### Vercel

1. **Import project**:
   - Sign up at [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from your Git repository

2. **Deploy settings**:
   - Framework Preset: Other
   - Build and Output Settings: Leave default
   - The `vercel.json` file will handle configuration

3. **Custom domain**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Vercel will handle SSL certificates automatically

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configure firebase.json**:
   ```json
   {
     "hosting": {
       "public": ".",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**",
         "test/**",
         "*.md"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**/*.@(js|css)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=604800"
             }
           ]
         }
       ]
     }
   }
   ```

4. **Deploy**:
   ```bash
   firebase deploy
   ```

## 🔧 Server Configuration

### Apache (.htaccess)

The included `.htaccess` file provides:
- Gzip compression
- Cache headers
- Security headers
- CORS support for JSON files

### Nginx

Create an nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/educational-runner-game;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache JSON files
    location ~* \.json$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📱 Mobile Optimization

### PWA Configuration

The game includes service worker support. To make it a full PWA:

1. **Create manifest.json**:
   ```json
   {
     "name": "Educational Runner Game",
     "short_name": "EduRunner",
     "description": "Educational runner game with JSON-driven content",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#87CEEB",
     "theme_color": "#4ECDC4",
     "icons": [
       {
         "src": "assets/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "assets/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Add to index.html**:
   ```html
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#4ECDC4">
   ```

### iOS Safari Optimization

Add these meta tags to index.html:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="EduRunner">
<link rel="apple-touch-icon" href="assets/icon-180.png">
```

## 🔒 Security Considerations

### Content Security Policy

The included CSP headers allow:
- Scripts from same origin and unpkg.com (for Kaboom.js)
- Styles from same origin with inline styles
- Images from same origin and data URLs
- Connections to same origin only

### HTTPS Requirements

Modern browsers require HTTPS for:
- Service Workers
- Geolocation (if added)
- Push notifications (if added)
- Some mobile features

All recommended hosting providers (Netlify, Vercel, GitHub Pages) provide free SSL certificates.

## 📊 Performance Optimization

### Compression

All hosting configurations include gzip compression for:
- HTML, CSS, JavaScript files
- JSON data files
- SVG images

### Caching Strategy

- **HTML files**: 1 hour cache
- **CSS/JS files**: 1 week cache
- **JSON files**: 1 day cache
- **Images**: 1 month cache

### CDN Integration

For high-traffic deployments, consider using a CDN:

1. **Cloudflare** (free tier available):
   - Automatic optimization
   - Global CDN
   - DDoS protection

2. **AWS CloudFront**:
   - Integrates with S3 hosting
   - Custom cache behaviors
   - Edge locations worldwide

## 🧪 Testing Deployment

### Local Testing

Before deploying, test locally:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

### Production Testing

After deployment, verify:

1. **Functionality**:
   - Game loads correctly
   - Questions display properly
   - All interactions work
   - Mobile responsiveness

2. **Performance**:
   - Page load speed
   - Service worker registration
   - Offline functionality

3. **Security**:
   - HTTPS enabled
   - Security headers present
   - No mixed content warnings

### Monitoring

Set up monitoring for:
- **Uptime**: Use services like UptimeRobot
- **Performance**: Google PageSpeed Insights
- **Errors**: Browser console errors
- **Analytics**: Google Analytics (if desired)

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

### Automated Testing

Include testing in your deployment pipeline:
- Unit tests must pass
- Performance benchmarks met
- No console errors
- All question sets validate

This ensures only working code reaches production.