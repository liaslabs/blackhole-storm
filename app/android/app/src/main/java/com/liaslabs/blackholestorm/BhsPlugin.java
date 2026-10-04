package com.liaslabs.blackholestorm;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// The game's own small bridge to Android:
// - the back button / back gesture goes to the game first (it pauses play or closes the open panel);
//   only on the main menu does the game ask to leave;
// - vibration on the game channel (follows the phone's media vibration setting, not touch feedback).
@CapacitorPlugin(name = "Bhs")
public class BhsPlugin extends Plugin {
    private OnBackPressedCallback back;

    @Override
    public void load() {
        back = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (hasListeners("back")) {
                    notifyListeners("back", new JSObject());
                    return;
                }
                setEnabled(false);
                getActivity().getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        };
        getActivity().runOnUiThread(() -> getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), back));
    }

    @PluginMethod
    public void leave(PluginCall call) {
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().moveTaskToBack(true));
    }

    @PluginMethod
    public void vibrate(PluginCall call) {
        long[] on;
        try {
            JSArray p = call.getArray("pattern", new JSArray());
            on = new long[p.length()];
            for (int i = 0; i < on.length; i++) on[i] = Math.max(0, Math.min(400, p.getLong(i)));
        } catch (Exception e) {
            call.reject("bad pattern");
            return;
        }
        if (on.length == 0) {
            call.resolve();
            return;
        }
        Vibrator v = vibrator();
        if (v == null || !v.hasVibrator()) {
            call.resolve();
            return;
        }
        long[] timings = new long[on.length + 1]; // waveform timings start with a wait
        System.arraycopy(on, 0, timings, 1, on.length);
        if (Build.VERSION.SDK_INT >= 33) {
            v.vibrate(VibrationEffect.createWaveform(timings, -1), VibrationAttributes.createForUsage(VibrationAttributes.USAGE_MEDIA));
        } else if (Build.VERSION.SDK_INT >= 26) {
            AudioAttributes a = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).build();
            v.vibrate(VibrationEffect.createWaveform(timings, -1), a);
        } else {
            v.vibrate(timings, -1);
        }
        call.resolve();
    }

    private Vibrator vibrator() {
        Context c = getContext();
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager m = (VibratorManager) c.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return m != null ? m.getDefaultVibrator() : null;
        }
        return (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
    }
}
