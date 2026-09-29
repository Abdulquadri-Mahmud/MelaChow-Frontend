package com.melachow.customer;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.util.Map;

/** Serves Next.js' exported pages while retaining Capacitor's bridge injection. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getServerUrl() == null) {
            bridge.setWebViewClient(new ExportWebViewClient(bridge));
        }
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
