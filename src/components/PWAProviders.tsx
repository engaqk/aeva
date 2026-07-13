"use client";

import { useEffect } from "react";

export default function PWAProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        if ((window as any).workbox === undefined) {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log("Service Worker registered successfully with scope:", reg.scope);
            })
            .catch((error) => {
              console.error("Service Worker registration failed:", error);
            });
        }
      } else {
        // Development Mode: Force clear all service workers and caches, then reload if active
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.getRegistrations().then(async (registrations) => {
            for (const registration of registrations) {
              await registration.unregister();
            }
            if (typeof window.caches !== "undefined") {
              const keys = await window.caches.keys();
              await Promise.all(keys.map((key) => window.caches.delete(key)));
            }
            console.log("Stale controlling service worker cleared. Reloading clean page...");
            window.location.reload();
          });
        } else {
          // Even if not controlling, check and unregister any stale workers silently
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          });
          if (typeof window.caches !== "undefined") {
            window.caches.keys().then((keys) => {
              keys.forEach((key) => window.caches.delete(key));
            });
          }
        }
      }
    }
  }, []);

  return <>{children}</>;
}
