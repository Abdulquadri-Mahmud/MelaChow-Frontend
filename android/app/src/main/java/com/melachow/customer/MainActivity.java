package com.melachow.customer;

import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.WebViewListener;
import java.util.Map;

/** Serves Next.js' exported pages while retaining Capacitor's bridge injection. */
public class MainActivity extends BridgeActivity {
    private volatile boolean initialWebPageVisible = false;
    private final Handler startupHandler = new Handler(Looper.getMainLooper());
    private final Runnable startupTimeout = () -> initialWebPageVisible = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !initialWebPageVisible);
        bridgeBuilder.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageCommitVisible(WebView view, String url) {
                if (bridge == null || url == null) return;
                Uri local = Uri.parse(bridge.getLocalUrl());
                Uri committed = Uri.parse(url);
                if (local.getScheme().equals(committed.getScheme())
                    && local.getHost().equals(committed.getHost())
                    && local.getPort() == committed.getPort()) {
                    initialWebPageVisible = true;
                    startupHandler.removeCallbacks(startupTimeout);
                }
            }
        });
        super.onCreate(savedInstanceState);
        // Avoid leaving the system splash up indefinitely if the WebView fails.
        startupHandler.postDelayed(startupTimeout, 8000);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Android 15+ draws transparent system bars over the window. Keep the
        // window surface white and the startup artwork inside the WebView.
        getWindow().setBackgroundDrawableResource(android.R.color.white);
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        } else {
            getWindow().setStatusBarColor(Color.WHITE);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            getWindow(), getWindow().getDecorView()
        );
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
        controller.show(WindowInsetsCompat.Type.systemBars());

        View content = findViewById(android.R.id.content);
        content.setBackgroundColor(Color.WHITE);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            int insetTypes = WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout();
            Insets insets = windowInsets.getInsets(insetTypes);
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
            return new WindowInsetsCompat.Builder(windowInsets)
                .setInsets(insetTypes, Insets.NONE)
                .build();
        });
        ViewCompat.requestApplyInsets(content);

        if (bridge != null && bridge.getWebView() != null) {
            // Keep the splash artwork visible through the WebView startup gap.
            bridge.getWebView().setBackgroundResource(R.drawable.native_startup_background);
        }
        if (bridge != null && bridge.getServerUrl() == null) {
            bridge.setWebViewClient(new ExportWebViewClient(bridge));
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
        controller.show(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            controller.setAppearanceLightStatusBars(true);
            controller.setAppearanceLightNavigationBars(true);
            controller.show(WindowInsetsCompat.Type.systemBars());
        }
    }

    @Override
    public void onDestroy() {
        startupHandler.removeCallbacks(startupTimeout);
        super.onDestroy();
    }

    private static final class ExportWebViewClient extends BridgeWebViewClient {
        private final Uri localOrigin;

        ExportWebViewClient(Bridge bridge) {
            super(bridge);
            localOrigin = Uri.parse(bridge.getLocalUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String route = uri.getPath();
            String lastSegment = uri.getLastPathSegment();
            boolean local = localOrigin.getScheme().equals(uri.getScheme())
                && localOrigin.getHost().equals(uri.getHost())
                && localOrigin.getPort() == uri.getPort();
            if (request.isForMainFrame() && "GET".equals(request.getMethod()) && local
                && route != null && (lastSegment == null || !lastSegment.contains("."))) {
                // Rewrite only the asset lookup, not the visible URL or query parameters.
                // Passing the .html request through Capacitor preserves native JS injection.
                String asset = (route.endsWith("/") ? route : route + "/") + "index.html";
                Uri rewritten = uri.buildUpon().path(asset).build();
                return super.shouldInterceptRequest(view, new AssetRequest(request, rewritten));
            }
            return super.shouldInterceptRequest(view, request);
        }
    }

    private static final class AssetRequest implements WebResourceRequest {
        private final WebResourceRequest original;
        private final Uri uri;

        AssetRequest(WebResourceRequest original, Uri uri) {
            this.original = original;
            this.uri = uri;
        }

        @Override public Uri getUrl() { return uri; }
        @Override public boolean isForMainFrame() { return original.isForMainFrame(); }
        @Override public boolean isRedirect() { return original.isRedirect(); }
        @Override public boolean hasGesture() { return original.hasGesture(); }
        @Override public String getMethod() { return original.getMethod(); }
        @Override public Map<String, String> getRequestHeaders() { return original.getRequestHeaders(); }
    }
}
