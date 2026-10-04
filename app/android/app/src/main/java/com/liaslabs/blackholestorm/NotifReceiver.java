package com.liaslabs.blackholestorm;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

// Shows one game reminder (lab done, fuel full, daily reward) that the game scheduled before it went to the background.
// Tapping it opens the game. Nothing is shown if the player turned notifications off.
public class NotifReceiver extends BroadcastReceiver {
    static final String CHANNEL = "bhs_game";

    static void channel(Context c, String name) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager m = c.getSystemService(NotificationManager.class);
        if (m == null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, name, NotificationManager.IMPORTANCE_DEFAULT);
        m.createNotificationChannel(ch); // creating it again only renames it
    }

    @Override
    public void onReceive(Context c, Intent in) {
        if (MainActivity.onScreen) return;
        NotificationManagerCompat nm = NotificationManagerCompat.from(c);
        if (!nm.areNotificationsEnabled()) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager m = c.getSystemService(NotificationManager.class);
            if (m != null && m.getNotificationChannel(CHANNEL) == null) channel(c, "Blackhole Storm");
        }
        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bhs)
            .setColor(0xFFF2A93B)
            .setContentTitle(in.getStringExtra("title"))
            .setContentText(in.getStringExtra("body"))
            .setStyle(new NotificationCompat.BigTextStyle().bigText(in.getStringExtra("body")))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);
        try {
            nm.notify(in.getIntExtra("code", 1), b.build());
        } catch (SecurityException e) {
            // permission withdrawn in the meantime
        }
    }
}
