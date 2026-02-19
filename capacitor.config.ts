import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.18463dfe77ad45d8933431923b4b69ae",
  appName: "mycollegetime",
  webDir: "dist",
  server: {
    url: "https://18463dfe-77ad-45d8-9334-31923b4b69ae.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#2563eb",
      sound: "beep.wav",
    },
  },
};

export default config;
