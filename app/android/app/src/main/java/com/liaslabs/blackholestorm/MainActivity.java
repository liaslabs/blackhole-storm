package com.liaslabs.blackholestorm;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// Full-screen game: status and navigation bars hidden (a swipe shows them for a moment, as in the TWA version).
// The game is kept clear of a camera cutout by padding its container, so the HUD never sits under the notch.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BhsPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(0xFF03040A);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View web = getBridge().getWebView();
        View box = (View) web.getParent();
        box.setBackgroundColor(0xFF03040A);
        ViewCompat.setOnApplyWindowInsetsListener(box, (v, insets) -> {
            Insets c = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            v.setPadding(c.left, c.top, c.right, c.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
