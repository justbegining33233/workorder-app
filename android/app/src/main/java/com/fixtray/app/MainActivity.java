package com.fixtray.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    // CSS that will be injected into every page load to fix portrait viewport
    private static final String FIX_CSS =
        "*{box-sizing:border-box!important}" +
        "html,body{" +
          "width:100%!important;max-width:100vw!important;" +
          "overflow-x:hidden!important;margin:0!important;" +
        "}" +
        "body{" +
          "padding-top:0!important;padding-bottom:0!important;" +
          "min-height:100vh!important;min-height:100dvh!important;" +
          "overflow-y:auto!important;" +
        "}" +
        "nav{max-width:100vw!important;overflow:hidden!important}" +
        "img,video,canvas,iframe,table,pre,svg{max-width:100%!important}" +
        ".sos-card,.sos-wrap{max-width:100vw!important;overflow-x:hidden!important}" +
        ".sos-content{grid-template-columns:1fr!important}" +
        // Hide elements that cause overflow in portrait
        "@media(max-width:500px){" +
          ".nav-shop-name{display:none!important}" +
          "nav>div>div>div{gap:3px!important}" +
          "nav>div>div{gap:6px!important;padding:0 8px!important}" +
        "}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // System bars sit above WebView, not overlapping
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // -- Configure WebView immediately --
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // No bounce/glow when overscrolling
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);

            WebSettings ws = webView.getSettings();
            // MUST be true so the viewport meta tag is respected
            ws.setUseWideViewPort(true);
            // Don't zoom out to show the whole page
            ws.setLoadWithOverviewMode(false);
        }

        // -- Inject CSS on every page load via Capacitor's proper API --
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                injectViewportCSS(webView);
            }
        });
    }

    private void injectViewportCSS(WebView webView) {
        String js =
            "(function(){" +
              // Remove any previous injection first
              "var old=document.getElementById('cap-vp-fix');" +
              "if(old)old.remove();" +
              // Create and inject style
              "var s=document.createElement('style');" +
              "s.id='cap-vp-fix';" +
              "s.textContent='" + FIX_CSS + "';" +
              "document.head.appendChild(s);" +
              // Ensure viewport meta tag
              "var m=document.querySelector('meta[name=viewport]');" +
              "if(!m){" +
                "m=document.createElement('meta');" +
                "m.name='viewport';" +
                "document.head.appendChild(m);" +
              "}" +
              "m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';" +
            "})();";
        webView.evaluateJavascript(js, null);
    }
}
