// DailyOS Service Worker — handles Web Push notifications
const CACHE_NAME = "dailyos-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ── Push event — show notification ──────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "DailyOS", body: event.data.text() };
  }

  const { title, body, icon, badge, tag, url, image, actions, data } = payload;

  const options = {
    body: body || "",
    icon: icon || "/BrandLogo_Header.png",
    badge: badge || "/BrandLogo_Header.png",
    tag: tag || "dailyos-notification",
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [80, 40, 80, 40, 120],
    timestamp: Date.now(),
    // Large hero image (Android / desktop only — iOS ignores it gracefully)
    ...(image ? { image } : {}),
    data: { url: url || "/dashboard", ...data },
    // Use the action buttons sent from the server, falling back to a sensible default
    actions: Array.isArray(actions) && actions.length
      ? actions
      : [
          { action: "open",    title: "Open DailyOS" },
          { action: "dismiss", title: "Dismiss" },
        ],
  };

  event.waitUntil(self.registration.showNotification(title || "DailyOS", options));
});

// ── Notification click — open the relevant page ──────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NAVIGATE", url });
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
