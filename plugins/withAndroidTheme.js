const {
  withAndroidStyles,
  withAndroidColors,
  withDangerousMod,
} = require("@expo/config-plugins");
const { resolve } = require("node:path");
const { writeFileSync, mkdirSync, existsSync } = require("node:fs");

function withAndroidThemeColors(config) {
  return withAndroidColors(config, (config) => {
    const colors = config.modResults.resources.color || [];

    const setColor = (name, value) => {
      const existing = colors.findIndex((c) => c.$.name === name);
      if (existing >= 0) {
        colors[existing]._ = value;
      } else {
        colors.push({ $: { name }, _: value });
      }
    };

    setColor("splashscreen_background", "#000000");
    setColor("colorPrimary", "#ffffff");
    setColor("colorPrimaryDark", "#ffffff");
    setColor("colorAccent", "#ffffff");
    setColor("activityBackground", "#000000");

    config.modResults.resources.color = colors;
    return config;
  });
}

function withAndroidThemeStyles(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style || [];

    const appTheme = styles.find((s) => s.$.name === "AppTheme");
    if (appTheme) {
      appTheme.item = appTheme.item || [];

      const setItem = (name, value, attrs = {}) => {
        const existing = appTheme.item.findIndex((i) => i.$.name === name);
        const item = { $: { name, ...attrs }, _: value };
        if (existing >= 0) {
          appTheme.item[existing] = item;
        } else {
          appTheme.item.push(item);
        }
      };

      setItem("android:enforceNavigationBarContrast", "true", {
        "tools:targetApi": "29",
      });
      setItem("android:statusBarColor", "#ffffff");
      setItem("android:windowBackground", "@color/activityBackground");
      // Explicitly set these as theme attributes (not just color resources) so
      // the Android system uses white for cursor handles, tinted widgets, etc.
      setItem("colorPrimary", "@color/colorPrimary");
      setItem("colorAccent", "@color/colorAccent");
      setItem("colorControlActivated", "@color/colorAccent");
      setItem("colorControlHighlight", "@color/colorAccent");
      // Override WebView text selection handles with white drawables.
      // colorAccent alone does not tint WebView handles — these theme attrs do.
      setItem("android:textSelectHandle", "@drawable/text_select_handle_middle");
      setItem("android:textSelectHandleLeft", "@drawable/text_select_handle_left");
      setItem("android:textSelectHandleRight", "@drawable/text_select_handle_right");
    }

    const splashTheme = styles.find(
      (s) => s.$.name === "Theme.App.SplashScreen"
    );
    if (splashTheme) {
      splashTheme.item = splashTheme.item || [];

      const setOrAdd = (name, value) => {
        const existing = splashTheme.item.find((i) => i.$.name === name);
        if (existing) {
          existing._ = value;
        } else {
          splashTheme.item.push({ $: { name }, _: value });
        }
      };

      setOrAdd(
        "windowSplashScreenBackground",
        "@color/splashscreen_background"
      );
      setOrAdd(
        "windowSplashScreenAnimatedIcon",
        "@drawable/transparent_splash_icon"
      );
    }

    if (!config.modResults.resources.$) {
      config.modResults.resources.$ = {};
    }
    config.modResults.resources.$["xmlns:tools"] =
      "http://schemas.android.com/tools";

    return config;
  });
}

function withSplashDrawable(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const drawablePath = resolve(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/drawable"
      );

      if (!existsSync(drawablePath)) {
        mkdirSync(drawablePath, { recursive: true });
      }

      const launcherBg = `<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
</layer-list>
`;

      const transparentIcon = `<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item>
    <shape android:shape="rectangle">
      <solid android:color="#00000000"/>
    </shape>
  </item>
</layer-list>
`;

      // White cursor handle (single teardrop centered under cursor)
      const handleMiddle = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="22dp"
    android:height="29dp"
    android:viewportWidth="22"
    android:viewportHeight="29">
  <path android:fillColor="#FFFFFF"
      android:pathData="M11,1 C5.477,1 1,5.477 1,11 C1,16.523 5.477,21 11,21 C16.523,21 21,16.523 21,11 C21,5.477 16.523,1 11,1Z"/>
  <path android:fillColor="#FFFFFF"
      android:pathData="M9,20.5 L11,28.5 L13,20.5Z"/>
</vector>
`;

      // White left selection handle (stem points bottom-left, circle on right)
      const handleLeft = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="22dp"
    android:height="29dp"
    android:viewportWidth="22"
    android:viewportHeight="29">
  <path android:fillColor="#FFFFFF"
      android:pathData="M11,1 C5.477,1 1,5.477 1,11 C1,16.523 5.477,21 11,21 C16.523,21 21,16.523 21,11 C21,5.477 16.523,1 11,1Z"/>
  <path android:fillColor="#FFFFFF"
      android:pathData="M1,21 L1,28.5 L9,21Z"/>
</vector>
`;

      // White right selection handle (stem points bottom-right, circle on left)
      const handleRight = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="22dp"
    android:height="29dp"
    android:viewportWidth="22"
    android:viewportHeight="29">
  <path android:fillColor="#FFFFFF"
      android:pathData="M11,1 C5.477,1 1,5.477 1,11 C1,16.523 5.477,21 11,21 C16.523,21 21,16.523 21,11 C21,5.477 16.523,1 11,1Z"/>
  <path android:fillColor="#FFFFFF"
      android:pathData="M21,21 L21,28.5 L13,21Z"/>
</vector>
`;

      writeFileSync(
        resolve(drawablePath, "ic_launcher_background.xml"),
        launcherBg
      );
      writeFileSync(
        resolve(drawablePath, "transparent_splash_icon.xml"),
        transparentIcon
      );
      writeFileSync(
        resolve(drawablePath, "text_select_handle_middle.xml"),
        handleMiddle
      );
      writeFileSync(
        resolve(drawablePath, "text_select_handle_left.xml"),
        handleLeft
      );
      writeFileSync(
        resolve(drawablePath, "text_select_handle_right.xml"),
        handleRight
      );

      return config;
    },
  ]);
}

module.exports = function withAndroidTheme(config) {
  let result = withAndroidThemeColors(config);
  result = withAndroidThemeStyles(result);
  result = withSplashDrawable(result);
  return result;
};
