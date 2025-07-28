# Progressive Web App (PWA) Guide

Markets Feeds is a fully featured Progressive Web App that can be installed on desktop and mobile devices for a native app-like experience.

## 📱 Installation

### Desktop (Chrome, Edge, Safari)

**Option 1: Install Banner**
- A subtle install prompt appears in the bottom-right corner
- Click "Install App" to install
- Banner auto-dismisses after 8 seconds if ignored

**Option 2: Browser Install Button**
- Look for install icon in address bar
- Click to install directly

**Option 3: Browser Menu**
- Chrome/Edge: Three dots menu → "Install Markets Feeds"
- Safari: Share button → "Add to Dock"

### Mobile (iOS/Android)

**Android Chrome:**
- Install banner appears automatically
- OR: Menu → "Add to Home screen"
- OR: Menu → "Install app"

**iOS Safari:**
- Share button → "Add to Home Screen"
- Follow the prompts to install

## ✨ PWA Features

### Standalone App Experience
- Launches in its own window (no browser UI)
- Custom app icon on home screen/desktop
- Native feel with proper windowing
- System integration (taskbar, app switcher)

### Offline Functionality
- **Smart Caching**: Intelligent content caching with TTL expiration
- **Offline Reading**: Previously viewed articles available offline
- **Background Sync**: Content updates when connection restored
- **Graceful Degradation**: Informative offline messages

### App Shortcuts
Quick access to key sections via app shortcuts:
- **News**: Latest market news
- **Research**: Research articles and analysis  
- **Technology**: Tech-focused financial content

### Push Notifications (Future)
Framework ready for:
- Breaking news alerts
- Daily digest notifications
- Custom content alerts

## 🔧 Technical Implementation

### Manifest Configuration

```json
{
  "name": "Markets Feeds",
  "short_name": "Markets Feeds",
  "description": "Real-time aggregation of premium financial news",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary"
}
```

### Service Worker Features

**Intelligent Caching Strategy:**
```javascript
// Cache Duration by Content Type
HTML Pages:     5 minutes    // Fresh navigation
CSS/JS Assets:  24 hours     // Rarely change  
Images:         7 days       // Never change
Feed Data:      2 minutes    // Very frequent updates
```

**Network Strategies:**
- **Network-first**: HTML documents for fresh content
- **Cache-first**: Static assets for performance
- **Stale-while-revalidate**: Background updates

### Cache Management

**Automatic Invalidation:**
- Build timestamp injected on every deployment
- Cache version updates automatically
- Old cache versions cleaned up
- Expired entries removed hourly

**Manual Cache Control:**
```javascript
// Force cache refresh (dev only)
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
```

## 🎨 App Appearance

### Icons & Branding
- **16x16**: Favicon and browser tabs
- **32x32**: Desktop shortcuts and bookmarks
- **180x180**: iOS home screen icon
- **Maskable**: Adaptive icons for Android

### Theme Integration
- **System Theme**: Respects user's dark/light preference
- **Manual Toggle**: Users can override system setting
- **Status Bar**: Matches app theme color
- **Title Bar**: Custom app name and icon

### App Shortcuts
Configured shortcuts for quick access:
```json
[
  {
    "name": "Latest News",
    "url": "/news",
    "description": "View latest market news"
  },
  {
    "name": "Research",
    "url": "/research", 
    "description": "Browse research articles"
  },
  {
    "name": "Technology",
    "url": "/technology",
    "description": "Technology news and updates"
  }
]
```

## 📊 Performance Benefits

### Load Performance
- **Instant Loading**: Cached content loads immediately
- **Background Updates**: Fresh content syncs in background
- **Reduced Bandwidth**: Only changed content downloaded
- **Offline Resilience**: Works without internet connection

### User Experience
- **Native Feel**: Full-screen app experience
- **Fast Navigation**: Client-side routing with prefetching
- **Smooth Animations**: Hardware-accelerated transitions
- **Memory Efficient**: Optimized for mobile devices

## 🔍 Debugging PWA

### Chrome DevTools

**Application Tab:**
- **Manifest**: View parsed manifest.json
- **Service Workers**: Debug worker status and cache
- **Storage**: Inspect cached content and size
- **Offline**: Test offline functionality

**Lighthouse:**
- **PWA Audit**: Check PWA compliance
- **Performance**: Measure load times and core vitals
- **Accessibility**: Ensure inclusive design
- **Best Practices**: Web standards compliance

### Console Commands

```javascript
// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker ready:', registration);
});

// View cache contents  
caches.keys().then(names => {
  console.log('Cache names:', names);
});

// Check manifest
console.log('Manifest:', window.__WB_MANIFEST);

// Test install prompt
window.deferredPrompt?.prompt();
```

## 🐛 Troubleshooting

### Installation Issues

**Install prompt doesn't appear:**
- Clear browser cache and storage
- Check manifest.json is valid
- Verify HTTPS is enabled
- Ensure service worker registered successfully

**App won't install:**
- Check browser compatibility
- Verify all required manifest fields
- Test in incognito/private mode
- Check console for errors

### Caching Problems

**Content not updating:**
- Check service worker update mechanism
- Verify cache expiration settings
- Force refresh with Ctrl+F5
- Check network tab for cache hits

**Offline functionality broken:**
- Verify service worker registration
- Check cached resources in DevTools
- Test network throttling
- Review cache strategies

### Performance Issues

**Slow loading:**
- Check cache hit rates
- Verify asset optimization
- Test on slow network conditions
- Review Lighthouse performance audit

## 🚀 Future Enhancements

### Planned Features
- **Background Sync**: Offline actions sync when online
- **Push Notifications**: Breaking news and custom alerts
- **Advanced Caching**: Predictive content prefetching
- **Share Target**: Share articles to the app
- **File Handling**: Open RSS files directly in app

### API Integration
- **Web Share API**: Native sharing capabilities
- **Badging API**: Unread count badges
- **Shortcuts API**: Dynamic shortcut updates
- **Contact Picker**: Share with contacts

---

**PWA Resources:**
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)