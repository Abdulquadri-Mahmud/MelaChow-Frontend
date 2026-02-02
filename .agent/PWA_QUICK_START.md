# PWA Quick Start Guide

## 🚀 Getting Started

Your GrubDash app now has full PWA support! Here's how to test it locally.

---

## Step 1: Generate PWA Icons

### Option A: Online Tool (Recommended - 2 minutes)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `public/logo.png`
3. Download the generated icon pack
4. Extract all icons to `public/icons/` folder

### Option B: Quick Fallback (Already Done)

The app is currently using `public/logo.png` as temporary icons. This works for testing but should be replaced with properly sized icons for production.

---

## Step 2: Build & Run

```bash
# Build the production version
npm run build

# Start the production server
npm start
```

**Important:** PWA features only work in production mode or on HTTPS. Development mode (`npm run dev`) won't register the service worker.

---

## Step 3: Test Locally

### Open in Browser

```
http://localhost:3000
```

### Verify Service Worker

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. You should see: `sw.js` with status "activated and is running"

### Verify Manifest

1. In DevTools → **Application** tab
2. Click **Manifest** in left sidebar
3. You should see:
   - Name: "GrubDash - Food Delivery"
   - Theme color: #ea580c
   - Icons: Multiple sizes listed

---

## Step 4: Test Install Prompt

### Android (Chrome)

1. Wait 5 seconds after page load
2. You should see a custom install banner at the bottom
3. Click "Install"
4. App should be added to your home screen

### iOS (Safari)

1. Wait 10 seconds after page load
2. You should see a custom install banner
3. Click "Install"
4. Follow the iOS-specific instructions shown

---

## Step 5: Test Offline

1. Open DevTools → **Network** tab
2. Change throttling to **Offline**
3. Try navigating to a new page
4. You should see the offline page with helpful instructions
5. Navigate to a previously visited page
6. It should load from cache

---

## Step 6: Test Updates

### Trigger an Update

1. Open `public/sw.js`
2. Change line 11:
   ```javascript
   const CACHE_VERSION = 'grubdash-v1.0.1'; // Change from v1.0.0
   ```
3. Save and rebuild:
   ```bash
   npm run build
   npm start
   ```
4. Reload the app in your browser
5. You should see an update banner at the top
6. Click "Update Now"
7. Page should reload with new version

---

## Common Issues & Fixes

### Issue: Service worker not registering

**Fix:**
- Make sure you're running `npm start` (production mode)
- Check browser console for errors
- Try hard reload (Ctrl+Shift+R)

### Issue: Install prompt not showing

**Fix:**
- Wait 5-10 seconds after page load
- Make sure you're on localhost or HTTPS
- Check if app is already installed
- Try in incognito mode

### Issue: Offline page not working

**Fix:**
- Make sure service worker is active
- Visit a few pages while online first
- Then go offline and try navigating

---

## Testing Checklist

- [ ] Service worker registers successfully
- [ ] Manifest loads without errors
- [ ] Install prompt appears
- [ ] App can be installed
- [ ] Offline page works
- [ ] Update banner appears when version changes
- [ ] All existing features still work

---

## Next Steps

### For Development

1. Continue building features normally
2. PWA components won't interfere with development
3. Test PWA features periodically in production mode

### For Production

1. Generate high-quality icons (see Step 1)
2. Update manifest URLs to production domain
3. Run full testing checklist (`.agent/PWA_TESTING_CHECKLIST.md`)
4. Deploy to production
5. Test on real Android and iOS devices

---

## Useful Commands

```bash
# Development (PWA disabled)
npm run dev

# Production (PWA enabled)
npm run build
npm start

# Check service worker in console
navigator.serviceWorker.getRegistrations()

# Unregister service worker (for testing)
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})
```

---

## Resources

- **Full Documentation:** `.agent/PWA_DOCUMENTATION.md`
- **Testing Checklist:** `.agent/PWA_TESTING_CHECKLIST.md`
- **Implementation Summary:** `.agent/PWA_IMPLEMENTATION_SUMMARY.md`
- **Icon Generation:** `public/icons/README.md`

---

## Need Help?

1. Check browser console for errors
2. Review documentation files in `.agent/` folder
3. Test in incognito mode to rule out cache issues
4. Try unregistering service worker and starting fresh

---

**Happy Testing! 🎉**

The PWA integration is complete and ready for testing. All existing features continue to work unchanged.
