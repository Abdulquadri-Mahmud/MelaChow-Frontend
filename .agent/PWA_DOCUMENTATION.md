# GrubDash PWA Integration

## Overview

GrubDash now has full Progressive Web App (PWA) support, allowing users to install the app on their devices for a native-like experience.

---

## Features

### ✅ Implemented

1. **Service Worker**
   - Network-first strategy for API requests (fresh data priority)
   - Cache-first strategy for static assets (performance)
   - Offline fallback page
   - Automatic cache cleanup

2. **Update Management**
   - Non-blocking update banner
   - Critical route protection (no forced updates during checkout/payment)
   - User-controlled update timing
   - Automatic update check every 30 minutes

3. **Install Prompt**
   - Custom install UI (better than browser default)
   - iOS-specific installation instructions
   - Respects user dismissal
   - Detects if app is already installed

4. **Manifest**
   - App name, icons, theme colors
   - Standalone display mode
   - Shortcuts (Browse Restaurants, My Orders)
   - Maskable icons for Android

5. **Offline Support**
   - Dedicated offline page with helpful instructions
   - Cached static assets work offline
   - Graceful degradation

---

## File Structure

```
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
└── icons/                  # PWA icons
    ├── icon-192x192.png
    ├── icon-512x512.png
    ├── icon-maskable-192x192.png
    └── icon-maskable-512x512.png

src/app/
├── components/PWA/
│   ├── PWAUpdateManager.jsx    # Update detection & banner
│   └── PWAInstallPrompt.jsx    # Install prompt UI
├── lib/
│   └── pwa-utils.js            # Service worker registration
└── offline/
    └── page.jsx                # Offline fallback page
```

---

## Configuration

### Service Worker Caching Strategy

| Resource Type | Strategy | Cache Duration |
|---------------|----------|----------------|
| API Requests | Network-first | Dynamic |
| HTML Pages | Network-first | Dynamic |
| Static Assets (JS/CSS) | Cache-first | Indefinite |
| Images | Cache-first | 30 days |

### Critical Routes (No Forced Updates)

The following routes are protected from forced updates:
- `/checkout`
- `/payment`
- `/orders`
- `/verify-payment`

Users on these routes will see the update banner but won't be forced to update immediately.

---

## Usage

### For Users

#### Android (Chrome)
1. Visit GrubDash in Chrome
2. Tap the "Install" button in the custom prompt
3. Or tap the menu (⋮) → "Install app"

#### iOS (Safari)
1. Visit GrubDash in Safari
2. Tap the Share button (⬆️)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### For Developers

#### Testing PWA Locally

1. **Build the app:**
   ```bash
   npm run build
   npm start
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Test installation:**
   - Open DevTools → Application → Manifest
   - Click "Update" to refresh manifest
   - Check "Service Workers" tab for registration

4. **Test offline:**
   - Open DevTools → Network
   - Set throttling to "Offline"
   - Navigate to any page

#### Debugging Service Worker

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered service workers:', registrations);
});

// Unregister service worker (for testing)
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

#### Force Update

To force an update:
1. Update `CACHE_VERSION` in `public/sw.js`
2. Deploy the changes
3. Users will see the update banner on next visit

---

## Icon Generation

### Quick Method (Recommended)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `public/logo.png`
3. Download the generated icon pack
4. Extract to `public/icons/`

### Manual Method (ImageMagick)

```bash
# Install ImageMagick first
# Then run:

mkdir -p public/icons

# Standard icons
magick public/logo.png -resize 72x72 public/icons/icon-72x72.png
magick public/logo.png -resize 96x96 public/icons/icon-96x96.png
magick public/logo.png -resize 128x128 public/icons/icon-128x128.png
magick public/logo.png -resize 144x144 public/icons/icon-144x144.png
magick public/logo.png -resize 152x152 public/icons/icon-152x152.png
magick public/logo.png -resize 192x192 public/icons/icon-192x192.png
magick public/logo.png -resize 384x384 public/icons/icon-384x384.png
magick public/logo.png -resize 512x512 public/icons/icon-512x512.png

# Maskable icons (with safe area padding)
magick public/logo.png -resize 154x154 -gravity center -extent 192x192 -background white public/icons/icon-maskable-192x192.png
magick public/logo.png -resize 410x410 -gravity center -extent 512x512 -background white public/icons/icon-maskable-512x512.png
```

---

## Update Workflow

### How Updates Work

1. **User visits app** → Service worker checks for updates
2. **New version detected** → New service worker installed in background
3. **Update banner appears** → User can choose to update now or later
4. **User clicks "Update Now"** → Service worker activates and page reloads
5. **App updated** → User sees new version

### Update Frequency

- Automatic check: Every 30 minutes
- Manual check: On page reload
- Forced check: On app focus (if idle for >1 hour)

### Preventing Forced Updates

Updates are **never forced** on these routes:
- Checkout flow
- Payment processing
- Active order tracking

The update banner will show but users can dismiss it and update later.

---

## Security Considerations

### Cookie Safety

The service worker **does NOT cache**:
- Authentication cookies
- Session data
- User credentials

All API requests use **network-first** strategy, ensuring:
- Fresh authentication checks
- Up-to-date session validation
- No stale user data

### HTTPS Requirement

PWAs require HTTPS in production. Ensure your deployment uses:
- Valid SSL certificate
- HTTPS redirect
- Secure cookie flags (`Secure`, `HttpOnly`, `SameSite`)

---

## Performance Impact

### Initial Load
- **No impact** on first visit (service worker registers in background)
- **Slight improvement** on subsequent visits (cached assets)

### Bundle Size
- Service worker: ~5KB (gzipped)
- PWA components: ~8KB (gzipped)
- Total overhead: **~13KB**

### Caching Benefits
- Static assets: **Instant load** from cache
- Images: **30-day cache** reduces bandwidth
- API requests: **Network-first** ensures fresh data

---

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Ensure you're on HTTPS (or localhost)
3. Verify `public/sw.js` exists
4. Check `public/manifest.json` is valid

### Update Banner Not Showing

1. Clear browser cache
2. Unregister existing service worker
3. Hard reload (Ctrl+Shift+R)
4. Check `PWAUpdateManager` is mounted

### Install Prompt Not Appearing

1. Ensure manifest is valid
2. Check icons are accessible
3. Verify HTTPS is enabled
4. Wait 5-10 seconds after page load

### Offline Page Not Working

1. Check `/offline` route exists
2. Verify service worker is active
3. Test with DevTools offline mode
4. Check cache storage in DevTools

---

## Browser Support

| Browser | Install | Offline | Updates |
|---------|---------|---------|---------|
| Chrome (Android) | ✅ | ✅ | ✅ |
| Safari (iOS) | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ⚠️ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ |

⚠️ Firefox supports PWAs but doesn't show install prompt on desktop

---

## Deployment Checklist

Before deploying PWA to production:

- [ ] Generate all icon sizes
- [ ] Update manifest.json with production URLs
- [ ] Test on real Android device
- [ ] Test on real iOS device
- [ ] Verify HTTPS is enabled
- [ ] Test offline functionality
- [ ] Test update flow
- [ ] Verify critical routes are protected
- [ ] Check Lighthouse PWA score (aim for 90+)

---

## Monitoring

### Metrics to Track

1. **Installation Rate**
   - Track `appinstalled` event
   - Monitor install prompt dismissals

2. **Update Adoption**
   - Track update banner clicks
   - Monitor time to update

3. **Offline Usage**
   - Track offline page visits
   - Monitor cache hit rates

4. **Performance**
   - Measure cache vs network load times
   - Track service worker overhead

---

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Order status updates
   - Promotional offers
   - Delivery tracking

2. **Background Sync**
   - Queue orders when offline
   - Sync when connection restored

3. **Advanced Caching**
   - Predictive prefetching
   - Smart cache invalidation

4. **Share Target**
   - Share food items from other apps
   - Share restaurant links

---

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (Advanced PWA)](https://developers.google.com/web/tools/workbox)

---

## Support

For PWA-related issues:
1. Check browser console for errors
2. Review service worker logs
3. Test in incognito mode
4. Clear cache and retry

---

**Last Updated:** 2026-02-02
**PWA Version:** 1.0.0
