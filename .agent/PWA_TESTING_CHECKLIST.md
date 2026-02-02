# PWA Testing Checklist

## Pre-Deployment Testing

### ✅ Service Worker Registration

- [ ] Service worker registers successfully on page load
- [ ] No console errors during registration
- [ ] Service worker shows as "activated" in DevTools
- [ ] Service worker scope is set to "/"

**How to test:**
1. Open DevTools → Application → Service Workers
2. Verify status shows "activated and is running"
3. Check console for `[PWA] Service worker registered successfully`

---

### ✅ Manifest Validation

- [ ] Manifest loads without errors
- [ ] All icons are accessible (check Network tab)
- [ ] Theme color matches brand (#ea580c)
- [ ] App name displays correctly
- [ ] Shortcuts are defined

**How to test:**
1. Open DevTools → Application → Manifest
2. Click "Update" to refresh
3. Verify all fields are populated
4. Check for any warnings

---

### ✅ Caching Strategy

#### Static Assets
- [ ] JS files are cached on first visit
- [ ] CSS files are cached on first visit
- [ ] Fonts are cached (if any)
- [ ] Logo/icons are cached

**How to test:**
1. Open DevTools → Application → Cache Storage
2. Check `grubdash-v1.0.0-static` cache
3. Verify assets are listed

#### API Requests
- [ ] API requests use network-first strategy
- [ ] Failed API requests fall back to cache
- [ ] Fresh data is always fetched when online

**How to test:**
1. Make an API request (e.g., load restaurants)
2. Go offline (DevTools → Network → Offline)
3. Reload page - should show cached data
4. Go online - should fetch fresh data

#### Images
- [ ] Images are cached after first load
- [ ] Cached images load instantly on revisit
- [ ] Cloudinary images are cached

**How to test:**
1. Load a page with images
2. Check `grubdash-v1.0.0-images` cache
3. Reload page - images should load from cache

---

### ✅ Offline Functionality

- [ ] Offline page loads when network is unavailable
- [ ] Previously visited pages work offline
- [ ] Cached images display offline
- [ ] "Try Again" button works
- [ ] "Go to Home" link works

**How to test:**
1. Visit several pages while online
2. Go offline (DevTools → Network → Offline)
3. Try navigating to a new page
4. Should see offline page
5. Try navigating to a previously visited page
6. Should load from cache

---

### ✅ Update Detection

- [ ] Update banner appears when new version is available
- [ ] Banner shows correct message
- [ ] "Update Now" button works
- [ ] "Dismiss" button works
- [ ] Banner reappears after 1 hour if dismissed
- [ ] Page reloads after update

**How to test:**
1. Deploy app with version 1.0.0
2. Update `CACHE_VERSION` in `sw.js` to 1.0.1
3. Deploy new version
4. Visit app (should see update banner)
5. Click "Update Now"
6. Verify page reloads with new version

---

### ✅ Critical Route Protection

- [ ] Update banner does NOT force reload on `/checkout`
- [ ] Update banner does NOT force reload on `/payment`
- [ ] Update banner does NOT force reload on `/orders`
- [ ] Update banner does NOT force reload on `/verify-payment`
- [ ] Banner is hidden on these routes

**How to test:**
1. Trigger an update while on checkout page
2. Verify banner doesn't appear
3. Navigate away from checkout
4. Verify banner appears

---

### ✅ Install Prompt

#### Android (Chrome)
- [ ] Install prompt appears after 5 seconds
- [ ] Custom UI shows (not browser default)
- [ ] "Install" button works
- [ ] App installs successfully
- [ ] Installed app opens in standalone mode
- [ ] Prompt doesn't show if already installed
- [ ] Prompt respects dismissal

**How to test:**
1. Open app in Chrome (Android)
2. Wait 5 seconds
3. Verify custom install prompt appears
4. Click "Install"
5. Verify app is added to home screen
6. Open installed app
7. Verify it opens in standalone mode (no browser UI)

#### iOS (Safari)
- [ ] Install prompt appears after 10 seconds
- [ ] Tapping "Install" shows iOS instructions
- [ ] Instructions are clear and accurate
- [ ] Modal can be dismissed
- [ ] Prompt doesn't show if already installed

**How to test:**
1. Open app in Safari (iOS)
2. Wait 10 seconds
3. Verify custom install prompt appears
4. Tap "Install"
5. Verify iOS instructions modal appears
6. Follow instructions to add to home screen
7. Open installed app
8. Verify it opens in standalone mode

---

### ✅ Session & Auth Safety

- [ ] Login works in PWA
- [ ] Logout works in PWA
- [ ] Session persists across app closes
- [ ] Cookies are sent with API requests
- [ ] Auth state is correct after update
- [ ] No auth data is cached inappropriately

**How to test:**
1. Install PWA
2. Login to app
3. Close and reopen PWA
4. Verify still logged in
5. Trigger an update
6. Verify still logged in after update
7. Logout
8. Verify logged out state persists

---

### ✅ Existing Flows (No Breaking Changes)

- [ ] Browse restaurants works
- [ ] View food details works
- [ ] Add to cart works
- [ ] Checkout flow works
- [ ] Payment flow works
- [ ] Order tracking works
- [ ] Profile management works
- [ ] Vendor dashboard works (if applicable)
- [ ] Admin dashboard works (if applicable)

**How to test:**
1. Go through entire user flow
2. Verify no errors in console
3. Verify all features work as before
4. Test both in browser and installed PWA

---

### ✅ Performance

- [ ] Initial load time not significantly increased
- [ ] Subsequent loads are faster (cached assets)
- [ ] No janky animations
- [ ] Smooth scrolling
- [ ] No layout shifts
- [ ] Images load quickly

**How to test:**
1. Open DevTools → Performance
2. Record page load
3. Verify no long tasks (>50ms)
4. Check Lighthouse score (aim for 90+)

---

### ✅ Splash Screen Compatibility

- [ ] Splash screen shows on first visit
- [ ] Splash screen doesn't wait for service worker
- [ ] Splash screen doesn't block app initialization
- [ ] Splash screen works for installed PWA
- [ ] Splash screen works for non-installed users

**How to test:**
1. Clear all caches
2. Visit app
3. Verify splash screen shows
4. Verify app loads after splash
5. Install PWA
6. Open installed app
7. Verify splash screen still works

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All icons generated and optimized
- [ ] Manifest URLs updated to production domain
- [ ] Service worker cache version updated
- [ ] HTTPS enabled and verified
- [ ] SSL certificate valid
- [ ] All tests passed locally

### Post-Deployment

- [ ] Service worker registers on production
- [ ] Manifest loads on production
- [ ] Icons load on production
- [ ] Install prompt works on production
- [ ] Offline page works on production
- [ ] Update flow works on production

### Real Device Testing

#### Android
- [ ] Chrome (latest)
- [ ] Samsung Internet
- [ ] Firefox (if applicable)

#### iOS
- [ ] Safari (latest)
- [ ] Safari (iOS 15+)

### Lighthouse Audit

- [ ] PWA score: 90+ ✅
- [ ] Performance score: 85+ ✅
- [ ] Accessibility score: 90+ ✅
- [ ] Best Practices score: 90+ ✅
- [ ] SEO score: 90+ ✅

**How to run:**
1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Click "Generate report"
4. Fix any issues

---

## Monitoring (Post-Launch)

### Metrics to Track

- [ ] Installation rate (% of visitors who install)
- [ ] Update adoption rate (% who update within 24h)
- [ ] Offline usage (% of sessions that go offline)
- [ ] Cache hit rate (% of requests served from cache)
- [ ] Service worker errors (track in analytics)

### User Feedback

- [ ] Monitor support tickets for PWA issues
- [ ] Track install prompt dismissals
- [ ] Survey users about PWA experience
- [ ] Monitor app store reviews (if applicable)

---

## Rollback Plan

If PWA causes issues in production:

1. **Immediate Fix:**
   - Unregister service worker via console
   - Clear caches
   - Hard reload

2. **Code Rollback:**
   - Remove PWA components from `ClientLayout.jsx`
   - Remove service worker registration
   - Deploy previous version

3. **Communication:**
   - Notify users of temporary issue
   - Provide workaround instructions
   - Set timeline for fix

---

## Common Issues & Solutions

### Issue: Service worker not updating

**Solution:**
1. Update `CACHE_VERSION` in `sw.js`
2. Deploy changes
3. Users will see update banner on next visit

### Issue: Install prompt not showing

**Solution:**
1. Verify manifest is valid
2. Check icons are accessible
3. Ensure HTTPS is enabled
4. Wait 5-10 seconds after page load

### Issue: Offline page not working

**Solution:**
1. Check `/offline` route exists
2. Verify service worker is active
3. Test with DevTools offline mode
4. Check cache storage in DevTools

### Issue: Update banner showing on critical routes

**Solution:**
1. Check `CRITICAL_ROUTES` array in `PWAUpdateManager.jsx`
2. Add missing routes
3. Deploy fix

---

## Sign-Off

### Tested By: ___________________
### Date: ___________________
### Environment: [ ] Local [ ] Staging [ ] Production
### Devices Tested:
- [ ] Android (Chrome)
- [ ] iOS (Safari)
- [ ] Desktop (Chrome)
- [ ] Desktop (Firefox)
- [ ] Desktop (Edge)

### Notes:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**PWA Version:** 1.0.0
**Last Updated:** 2026-02-02
