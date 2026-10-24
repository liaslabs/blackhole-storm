# 1.5.2: R8 keep rules. The web game talks to Android only through Capacitor, which finds its plugins and their methods by
# reflection (annotations), so those must keep their names. Play Billing, AdMob, UMP, Play Games, Integrity and Review
# bring their own consumer rules inside their libraries.

# Capacitor core, its plugins and anything they reach by name
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-keep class org.apache.cordova.** { *; }

# this app: the plugin the game calls (Bhs), the reminder receiver named in the manifest, the activity
-keep class com.liaslabs.blackholestorm.** { *; }

# crash reports with file names and line numbers (deobfuscated in Play with the uploaded mapping file)
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
