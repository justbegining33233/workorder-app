package com.fixtray.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // After Capacitor initialises — push status/nav bars ABOVE the WebView
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
