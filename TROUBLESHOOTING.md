# Troubleshooting Guide

This guide helps resolve common issues with the Educational Runner Game deployment and development.

## 🚀 Deployment Issues

### GitHub Actions Failing

**Problem**: GitHub Actions workflow fails during deployment

**Solutions**:

1. **Check the Actions tab** in your GitHub repository to see specific error messages

2. **Common fixes**:
   ```bash
   # Ensure all required files are committed
   git add .
   git commit -m "Fix missing files"
   git push
   ```

3. **Use the simple deployment workflow** if the main one fails:
   - Go to your repository on GitHub
   - Click "Actions" tab
   - Click "Simple Deploy (Backup)" on the left
   - Click "Run workflow" button
   - Click the green "Run workflow" button

4. **Manual deployment validation**:
   ```bash
   npm run validate:deployment
   npm run test:ci
   ```

### GitHub Pages Not Working

**Problem**: GitHub Pages shows 404 or doesn't load the game

**Solutions**:

1. **Check GitHub Pages settings**:
   - Go to repository Settings → Pages
   - Ensure Source is set to "Deploy from a branch"
   - Ensure Branch is set to "main" and folder is "/ (root)"

2. **Wait for deployment**: GitHub Pages can take 5-10 minutes to update

3. **Check the URL**: Should be `https://YOUR_USERNAME.github.io/educational-runner-game`

4. **Force refresh**: Clear browser cache or try incognito mode

### Files Missing After Deployment

**Problem**: Some files don't appear on the deployed site

**Check the exclude list** in `.github/workflows/deploy.yml`:
```yaml
exclude_assets: |
  test/**
  scripts/**
  node_modules/**
  .github/**
  *.md
  package*.json
  jest.config.js
  .gitignore
```

Make sure your game files aren't in the exclude list.

## 🎮 Game Issues

### Game Won't Load Locally

**Problem**: Game shows errors when running locally

**Solutions**:

1. **Use a local server** (required for loading JSON files):
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Node.js
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```

2. **Check browser console** for error messages (F12 → Console)

3. **Verify file structure**:
   ```
   /
   ├── index.html
   ├── main.js
   ├── sw.js
   ├── game/
   │   ├── content-loader.js
   │   ├── game-state.js
   │   └── ...
   └── data/
       ├── math-basic.json
       └── ...
   ```

### Questions Not Loading

**Problem**: Game loads but questions don't appear

**Solutions**:

1. **Validate question files**:
   ```bash
   npm run validate
   ```

2. **Check JSON syntax**:
   - Open question files in a JSON validator
   - Look for missing commas, brackets, or quotes

3. **Check browser console** for loading errors

4. **Verify file paths** in `game/subject-config.js`

### Mobile Issues

**Problem**: Game doesn't work properly on mobile devices

**Solutions**:

1. **Check viewport meta tag** in `index.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Test touch controls**: Ensure touch events work for answer selection

3. **Check mobile browser console**: Use remote debugging tools

## 🧪 Testing Issues

### Tests Failing Locally

**Problem**: `npm test` shows failures

**Solutions**:

1. **Run simple tests first**:
   ```bash
   npm run test:ci
   npm run validate
   npm run validate:deployment
   ```

2. **Check test environment**:
   ```bash
   # Install missing dependencies
   npm install
   
   # Update Jest configuration if needed
   npm install --save-dev jest-environment-jsdom
   ```

3. **Run specific test suites**:
   ```bash
   npm run test:content-loader
   npm run test:game-state
   ```

### Jest Configuration Issues

**Problem**: Jest tests fail with environment errors

**Solution**: Update `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  // ... other config
};
```

## 📱 Browser Compatibility

### Game Not Working in Specific Browsers

**Problem**: Game works in some browsers but not others

**Solutions**:

1. **Check browser support**:
   - Chrome 80+
   - Firefox 75+
   - Safari 13+
   - Edge 80+

2. **Check JavaScript features**:
   - ES6+ support required
   - Canvas API support required
   - Service Worker support (optional)

3. **Disable service worker** temporarily:
   - Comment out service worker registration in `index.html`

### Performance Issues

**Problem**: Game runs slowly or stutters

**Solutions**:

1. **Check performance monitor**: Open browser dev tools → Performance tab

2. **Reduce particle effects**: Modify settings in `game/runner-engine.js`

3. **Lower frame rate**: Adjust game loop timing

4. **Check memory usage**: Look for memory leaks in dev tools

## 🔧 Development Issues

### Local Development Setup

**Problem**: Can't get development environment working

**Solutions**:

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

### Git Issues

**Problem**: Can't push changes to GitHub

**Solutions**:

1. **Check remote URL**:
   ```bash
   git remote -v
   ```

2. **Set up authentication**:
   - Use personal access token instead of password
   - Or set up SSH keys

3. **Force push** (if safe):
   ```bash
   git push --force-with-lease
   ```

## 🆘 Getting Help

### Where to Get Support

1. **Check GitHub Issues**: Look for similar problems in the repository issues

2. **Create an Issue**: If you find a bug, create a detailed issue report

3. **Community Support**: Ask in relevant forums or communities

4. **Documentation**: Check all README files and documentation

### Creating a Good Bug Report

Include:
- **Browser and version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Console error messages**
- **Screenshots if applicable**

### Emergency Deployment

If all else fails, you can deploy manually:

1. **Download repository as ZIP**
2. **Extract files**
3. **Upload to any static hosting service**:
   - Netlify (drag and drop)
   - Vercel (drag and drop)
   - GitHub Pages (manual upload)
   - Any web hosting service

The game is designed to work as static files, so it should work on any web server.

---

## 📞 Quick Reference

**Validation Commands**:
```bash
npm run validate              # Validate question sets
npm run validate:deployment   # Check deployment readiness
npm run test:ci              # Run basic CI tests
```

**Development Commands**:
```bash
npm start                    # Start local server
npm test                     # Run all tests
npm run dev                  # Development mode
```

**Deployment URLs**:
- **GitHub Pages**: `https://USERNAME.github.io/educational-runner-game`
- **Local**: `http://localhost:8000`

**Important Files**:
- `index.html` - Main game page
- `main.js` - Game initialization
- `game/` - Core game code
- `data/` - Question sets
- `.github/workflows/deploy.yml` - Deployment automation