package com.liaslabs.blackholestorm;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.activity.OnBackPressedCallback;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONObject;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.StandardIntegrityManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// The game's own small bridge to Android:
// - the back button / back gesture goes to the game first (it pauses play or closes the open panel);
//   only on the main menu does the game ask to leave;
// - vibration on the game channel (follows the phone's media vibration setting, not touch feedback);
// - Google Play purchases. The app only reports what Google Play says; the game asks the server to check
//   each purchase with Google before anything is granted, and the server then acknowledges or consumes it;
// - Play Integrity tokens, so the server can tell a genuine Play install from a modified copy;
// - game reminders: the game hands over a short list (lab done, fuel full, daily reward) each time it goes to the
//   background; they are inexact alarms (no exact-alarm permission), shown by NotifReceiver, cleared when the game opens;
// - AdMob: a rewarded ad (the player chooses to watch it for a reward) and an ad between levels (the game decides when),
//   after the consent form Google's User Messaging Platform shows where the law requires one.
@CapacitorPlugin(name = "Bhs", permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notif") })
public class BhsPlugin extends Plugin {
    private OnBackPressedCallback back;
    private BillingClient billing;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private PluginCall buyCall; // the purchase flow that is open right now
    private StandardIntegrityManager.StandardIntegrityTokenProvider integrity;
    private long integrityProject;

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

    // ---- Google Play Billing ----

    @PluginMethod
    public void billingStart(PluginCall call) {
        if (billing == null) {
            billing = BillingClient.newBuilder(getContext())
                .setListener(this::onPurchases)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        }
        if (billing.isReady()) {
            call.resolve(ok(true));
            return;
        }
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult r) {
                JSObject o = ok(r.getResponseCode() == BillingClient.BillingResponseCode.OK);
                o.put("code", r.getResponseCode());
                call.resolve(o);
            }

            @Override
            public void onBillingServiceDisconnected() {}
        });
    }

    // {inapp:[ids], subs:[ids]} -> {list:[{id, price, micros, currency}]}; products missing from Play Console are left out
    @PluginMethod
    public void products(PluginCall call) {
        if (!ready(call)) return;
        List<String> inapp = strings(call.getArray("inapp", new JSArray())), subs = strings(call.getArray("subs", new JSArray()));
        JSArray out = new JSArray();
        int[] left = { (inapp.isEmpty() ? 0 : 1) + (subs.isEmpty() ? 0 : 1) };
        if (left[0] == 0) {
            JSObject o = new JSObject();
            o.put("list", out);
            call.resolve(o);
            return;
        }
        for (int k = 0; k < 2; k++) {
            List<String> ids = k == 0 ? inapp : subs;
            if (ids.isEmpty()) continue;
            String type = k == 0 ? BillingClient.ProductType.INAPP : BillingClient.ProductType.SUBS;
            List<QueryProductDetailsParams.Product> ps = new ArrayList<>();
            for (String id : ids) ps.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(type).build());
            billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(ps).build(), (r, res) -> {
                synchronized (out) {
                    if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && res != null) {
                        for (ProductDetails d : res.getProductDetailsList()) {
                            details.put(d.getProductId(), d);
                            JSObject o = new JSObject();
                            o.put("id", d.getProductId());
                            ProductDetails.OneTimePurchaseOfferDetails one = d.getOneTimePurchaseOfferDetails();
                            if (one != null) {
                                o.put("price", one.getFormattedPrice());
                                o.put("micros", one.getPriceAmountMicros());
                                o.put("currency", one.getPriceCurrencyCode());
                            } else if (d.getSubscriptionOfferDetails() != null && !d.getSubscriptionOfferDetails().isEmpty()) {
                                List<ProductDetails.PricingPhase> ph = d.getSubscriptionOfferDetails().get(0).getPricingPhases().getPricingPhaseList();
                                ProductDetails.PricingPhase last = ph.get(ph.size() - 1);
                                o.put("price", last.getFormattedPrice());
                                o.put("micros", last.getPriceAmountMicros());
                                o.put("currency", last.getPriceCurrencyCode());
                            }
                            out.put(o);
                        }
                    }
                    if (--left[0] == 0) {
                        JSObject o = new JSObject();
                        o.put("list", out);
                        call.resolve(o);
                    }
                }
            });
        }
    }

    // {id, account} -> {code, list:[purchase]}; code 0 = paid (or pending), 1 = cancelled, 7 = already owned
    @PluginMethod
    public void buy(PluginCall call) {
        if (!ready(call)) return;
        ProductDetails d = details.get(call.getString("id", ""));
        if (d == null) {
            call.reject("unknown product");
            return;
        }
        if (buyCall != null) {
            call.reject("busy");
            return;
        }
        BillingFlowParams.ProductDetailsParams.Builder pp = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d);
        if (d.getSubscriptionOfferDetails() != null && !d.getSubscriptionOfferDetails().isEmpty()) pp.setOfferToken(d.getSubscriptionOfferDetails().get(0).getOfferToken());
        List<BillingFlowParams.ProductDetailsParams> list = new ArrayList<>();
        list.add(pp.build());
        BillingFlowParams.Builder fb = BillingFlowParams.newBuilder().setProductDetailsParamsList(list);
        String acc = call.getString("account", "");
        if (acc != null && !acc.isEmpty()) fb.setObfuscatedAccountId(acc); // the install id: the server checks a purchase belongs to the install that claims it
        BillingFlowParams fp = fb.build();
        buyCall = call;
        getActivity().runOnUiThread(() -> {
            BillingResult r = billing.launchBillingFlow(getActivity(), fp);
            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) finishBuy(r.getResponseCode(), null);
        });
    }

    private void onPurchases(BillingResult r, List<Purchase> list) {
        if (buyCall != null) {
            finishBuy(r.getResponseCode(), list);
            return;
        }
        if (list == null || list.isEmpty()) return; // a pending payment completed later, or a purchase made outside the app
        JSObject o = new JSObject();
        o.put("list", toJs(list));
        notifyListeners("purchases", o);
    }

    private void finishBuy(int code, List<Purchase> list) {
        PluginCall c = buyCall;
        buyCall = null;
        if (c == null) return;
        JSObject o = new JSObject();
        o.put("code", code);
        o.put("list", toJs(list));
        c.resolve(o);
    }

    // purchases Google Play still holds for this account: one-time products owned, consumables not consumed yet, active subscriptions
    @PluginMethod
    public void purchases(PluginCall call) {
        if (!ready(call)) return;
        List<Purchase> all = new ArrayList<>();
        int[] left = { 2 };
        for (String type : new String[] { BillingClient.ProductType.INAPP, BillingClient.ProductType.SUBS }) {
            billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build(), (r, list) -> {
                synchronized (all) {
                    if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && list != null) all.addAll(list);
                    if (--left[0] == 0) {
                        JSObject o = new JSObject();
                        o.put("list", toJs(all));
                        call.resolve(o);
                    }
                }
            });
        }
    }

    // fallbacks: normally the server acknowledges or consumes a purchase once it has checked it
    @PluginMethod
    public void consume(PluginCall call) {
        if (!ready(call)) return;
        billing.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(call.getString("token", "")).build(), (r, t) -> call.resolve(ok(r.getResponseCode() == BillingClient.BillingResponseCode.OK)));
    }

    @PluginMethod
    public void acknowledge(PluginCall call) {
        if (!ready(call)) return;
        billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(call.getString("token", "")).build(), r -> call.resolve(ok(r.getResponseCode() == BillingClient.BillingResponseCode.OK)));
    }

    private boolean ready(PluginCall call) {
        if (billing != null && billing.isReady()) return true;
        call.reject("billing not ready");
        return false;
    }

    private static JSArray toJs(List<Purchase> list) {
        JSArray a = new JSArray();
        if (list == null) return a;
        for (Purchase p : list) {
            JSObject o = new JSObject();
            o.put("token", p.getPurchaseToken());
            o.put("ids", new JSArray(p.getProducts()));
            o.put("state", p.getPurchaseState()); // 1 purchased, 2 pending
            o.put("acked", p.isAcknowledged());
            o.put("order", p.getOrderId());
            o.put("account", p.getAccountIdentifiers() != null ? p.getAccountIdentifiers().getObfuscatedAccountId() : null);
            a.put(o);
        }
        return a;
    }

    private static List<String> strings(JSArray a) {
        List<String> l = new ArrayList<>();
        for (int i = 0; i < a.length(); i++) {
            String s = a.optString(i, "");
            if (!s.isEmpty()) l.add(s);
        }
        return l;
    }

    private static JSObject ok(boolean v) {
        JSObject o = new JSObject();
        o.put("ok", v);
        return o;
    }

    // ---- Play Integrity (standard requests) ----

    // {project: Google Cloud project number, hash: a digest of the request it vouches for} -> {token}
    @PluginMethod
    public void integrity(PluginCall call) {
        long project = 0;
        try {
            project = Long.parseLong(call.getString("project", "0"));
        } catch (NumberFormatException e) {}
        String hash = call.getString("hash", "");
        if (project <= 0 || hash == null || hash.isEmpty()) {
            call.reject("integrity not configured");
            return;
        }
        if (integrity != null && integrityProject == project) {
            request(call, hash);
            return;
        }
        long pj = project;
        IntegrityManagerFactory.createStandard(getContext())
            .prepareIntegrityToken(StandardIntegrityManager.PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(pj).build())
            .addOnSuccessListener(p -> {
                integrity = p;
                integrityProject = pj;
                request(call, hash);
            })
            .addOnFailureListener(e -> call.reject("integrity: " + e.getMessage()));
    }

    private void request(PluginCall call, String hash) {
        integrity
            .request(StandardIntegrityManager.StandardIntegrityTokenRequest.builder().setRequestHash(hash).build())
            .addOnSuccessListener(t -> {
                JSObject o = new JSObject();
                o.put("token", t.token());
                call.resolve(o);
            })
            .addOnFailureListener(e -> {
                integrity = null; // a stale provider is prepared again next time
                call.reject("integrity: " + e.getMessage());
            });
    }

    // ---- game reminders ----
    private static final int NOTIF_BASE = 100, NOTIF_MAX = 8;

    // -> {granted}; asks Android 13+ for the notification permission (the game asks the player first)
    @PluginMethod
    public void notifPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notif") == PermissionState.GRANTED) {
            notifResult(call);
            return;
        }
        requestPermissionForAlias("notif", call, "notifPermDone");
    }

    @PermissionCallback
    private void notifPermDone(PluginCall call) {
        notifResult(call);
    }

    @PluginMethod
    public void notifState(PluginCall call) {
        notifResult(call);
    }

    private void notifResult(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        call.resolve(o);
    }

    // {channel: name shown in Android settings, list:[{at: epoch ms, title, body}]} -> replaces everything scheduled before
    @PluginMethod
    public void notifSchedule(PluginCall call) {
        Context c = getContext();
        notifClear(c);
        NotifReceiver.channel(c, call.getString("channel", "Blackhole Storm"));
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        JSArray list = call.getArray("list", new JSArray());
        int n = 0;
        for (int i = 0; i < list.length() && n < NOTIF_MAX && am != null; i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null) continue;
            long at = o.optLong("at", 0);
            if (at <= System.currentTimeMillis()) continue;
            int code = NOTIF_BASE + n++;
            Intent in = new Intent(c, NotifReceiver.class).putExtra("title", o.optString("title")).putExtra("body", o.optString("body")).putExtra("code", code);
            PendingIntent pi = PendingIntent.getBroadcast(c, code, in, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi); // inexact: Android may deliver it a little later
        }
        JSObject r = new JSObject();
        r.put("n", n);
        call.resolve(r);
    }

    // the game is open: nothing pending, and earlier reminders leave the notification shade
    @PluginMethod
    public void notifCancel(PluginCall call) {
        notifClear(getContext());
        NotificationManagerCompat.from(getContext()).cancelAll();
        call.resolve();
    }

    private static void notifClear(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        for (int i = 0; i < NOTIF_MAX; i++) {
            PendingIntent pi = PendingIntent.getBroadcast(c, NOTIF_BASE + i, new Intent(c, NotifReceiver.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                if (am != null) am.cancel(pi);
                pi.cancel();
            }
        }
    }

    // ---- AdMob ----
    private boolean adsReady;
    private RewardedAd rewarded;
    private InterstitialAd inter;
    private String rewardedUnit = "", interUnit = "";

    // {rewarded, interstitial: ad unit ids} -> {ok, privacy: true when a "privacy options" entry must be offered}
    @PluginMethod
    public void adsStart(PluginCall call) {
        rewardedUnit = call.getString("rewarded", "");
        interUnit = call.getString("interstitial", "");
        ConsentInformation ci = UserMessagingPlatform.getConsentInformation(getContext());
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(false).build();
        getActivity().runOnUiThread(() -> ci.requestConsentInfoUpdate(getActivity(), params,
            () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(), err -> adsAfterConsent(call, ci)),
            err -> adsAfterConsent(call, ci))); // no answer from the consent service: ads only if consent was given before
    }

    private void adsAfterConsent(PluginCall call, ConsentInformation ci) {
        JSObject o = new JSObject();
        o.put("privacy", ci.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
        if (!ci.canRequestAds()) {
            o.put("ok", false);
            call.resolve(o);
            return;
        }
        if (!adsReady) {
            adsReady = true;
            MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG) // a game for 13+: no mature ads
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
                .build());
            new Thread(() -> MobileAds.initialize(getContext(), st -> getActivity().runOnUiThread(() -> {
                loadRewarded();
                loadInter();
            }))).start();
        }
        o.put("ok", true);
        call.resolve(o);
    }

    // the "privacy options" form, so a player in the EEA/UK can change the consent choice later (from Settings)
    @PluginMethod
    public void adsPrivacy(PluginCall call) {
        getActivity().runOnUiThread(() -> UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), err -> call.resolve()));
    }

    private void loadRewarded() {
        if (rewardedUnit.isEmpty() || rewarded != null) return;
        RewardedAd.load(getContext(), rewardedUnit, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(RewardedAd ad) {
                rewarded = ad;
            }

            @Override
            public void onAdFailedToLoad(LoadAdError e) {
                rewarded = null;
            }
        });
    }

    private void loadInter() {
        if (interUnit.isEmpty() || inter != null) return;
        InterstitialAd.load(getContext(), interUnit, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(InterstitialAd ad) {
                inter = ad;
            }

            @Override
            public void onAdFailedToLoad(LoadAdError e) {
                inter = null;
            }
        });
    }

    // -> {shown, earned}; earned only when the player watched long enough for the reward
    @PluginMethod
    public void adsRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            RewardedAd ad = rewarded;
            JSObject o = new JSObject();
            if (ad == null) {
                loadRewarded();
                o.put("shown", false);
                o.put("earned", false);
                call.resolve(o);
                return;
            }
            rewarded = null;
            boolean[] earned = { false };
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    o.put("shown", true);
                    o.put("earned", earned[0]);
                    call.resolve(o);
                    loadRewarded();
                }

                @Override
                public void onAdFailedToShowFullScreenContent(AdError e) {
                    o.put("shown", false);
                    o.put("earned", false);
                    call.resolve(o);
                    loadRewarded();
                }
            });
            ad.show(getActivity(), item -> earned[0] = true);
        });
    }

    // -> {shown}
    @PluginMethod
    public void adsInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            InterstitialAd ad = inter;
            JSObject o = new JSObject();
            if (ad == null) {
                loadInter();
                o.put("shown", false);
                call.resolve(o);
                return;
            }
            inter = null;
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    o.put("shown", true);
                    call.resolve(o);
                    loadInter();
                }

                @Override
                public void onAdFailedToShowFullScreenContent(AdError e) {
                    o.put("shown", false);
                    call.resolve(o);
                    loadInter();
                }
            });
            ad.show(getActivity());
        });
    }
}
