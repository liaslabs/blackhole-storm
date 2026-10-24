package com.liaslabs.blackholestorm;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

// Full-screen game: status and navigation bars hidden (a swipe shows them for a moment, as in the TWA version).
// The game is kept clear of a camera cutout by padding its container, so the HUD never sits under the notch.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        watchStart(this);
        registerPlugin(BhsPlugin.class);
        try {
            com.google.android.gms.games.PlayGamesSdk.initialize(this); // Play Games signs the player in by itself when it can (cloud backup)
        } catch (Throwable e) { report("BOOT games", e); } // the game runs without the cloud backup rather than not at all
        super.onCreate(savedInstanceState);
        try {
            EdgeToEdge.enable(this); // 1.5.2: after super.onCreate (in 1.4.5 it ran before and the window came up with a title bar over the game)
        } catch (Throwable e) { report("BOOT edge", e); }
        getWindow().getDecorView().setBackgroundColor(0xFF03040A);
        try {
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
        } catch (Throwable e) { report("BOOT window", e); } // a plain window with bars is still a game
        lockPhonePortrait(getResources().getConfiguration());
        started = true;
    }

    // 24 Oct: on Android 8 and 9 (a Lenovo "seoul" among them) the app closed in onCreate with a NoClassDefFoundError, and Play shows no
    // trace for it. The steps above that reach newer platform or Play services code are guarded now, and whatever still stops the app
    // before the game's page has loaded (that page reports every other error) is sent to the same error log by the app itself.
    private static volatile boolean started;
    private static String ver = "app";
    private static void watchStart(android.content.Context ctx) {
        try { ver = "app-" + ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).versionCode; } catch (Throwable ignored) { }
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {
            if (!started) report("BOOT crash", e);
            if (prev != null) prev.uncaughtException(t, e);
        });
    }
    static void report(String what, Throwable e) {
        StringWriter w = new StringWriter();
        e.printStackTrace(new PrintWriter(w));
        final String m = what + " " + e + " · " + Build.MANUFACTURER + " " + Build.MODEL + " a" + Build.VERSION.SDK_INT, s = w.toString();
        Thread th = new Thread(() -> { // the network may not be used on the main thread; wait a moment for it, never long
            try {
                JSONObject o = new JSONObject().put("m", m.length() > 300 ? m.substring(0, 300) : m).put("s", s.length() > 900 ? s.substring(0, 900) : s)
                    .put("v", ver).put("p", "app");
                HttpURLConnection c = (HttpURLConnection) new URL("https://blackhole-storm-lb.liaslabs-games.workers.dev/err").openConnection();
                c.setConnectTimeout(2500); c.setReadTimeout(2500); c.setDoOutput(true); c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                try (OutputStream out = c.getOutputStream()) { out.write(o.toString().getBytes(StandardCharsets.UTF_8)); }
                c.getResponseCode(); c.disconnect();
            } catch (Throwable ignored) { }
        });
        th.start();
        try { th.join(3000); } catch (InterruptedException ignored) { }
    }

    // Phones stay in portrait; tablets and unfolded foldables may turn (Google Play: no orientation lock on large screens,
    // Android 16 ignores it there anyway). The game redraws itself for any size.
    private void lockPhonePortrait(Configuration c) {
        setRequestedOrientation(c.smallestScreenWidthDp < 600 ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
    }

    @Override
    public void onConfigurationChanged(Configuration c) {
        super.onConfigurationChanged(c);
        lockPhonePortrait(c); // a foldable opened or closed
    }

    static volatile boolean onScreen; // reminders are not shown while the game is open

    @Override
    public void onResume() {
        super.onResume();
        onScreen = true;
    }

    @Override
    public void onPause() {
        onScreen = false;
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        try {
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(WindowInsetsCompat.Type.systemBars());
        } catch (Throwable e) { if (!barsFailed) { barsFailed = true; report("BOOT bars", e); } } // asked again at every focus: said once
    }
    private static boolean barsFailed;
}
