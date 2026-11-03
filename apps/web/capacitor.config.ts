import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.borsaweb.app",
  appName: "BorsaWeb",
  webDir: "public",
  server: {
    // Geliştirme: localhost; prodüksiyon: deploy edilen site URL'i
    url: process.env.CAPACITOR_SERVER_URL || "http://localhost:3000",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;