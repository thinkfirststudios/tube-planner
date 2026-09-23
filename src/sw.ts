/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Offline first. Every file the app needs (HTML, JS, CSS, fonts, icons, seed data
// bundled into JS) is cached at install, so the tube list opens with no signal.
self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Any navigation falls back to the cached app shell.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
