// Cache busting script - Version 2025-08-01-14:00
console.log('Cache bust script loaded - forcing refresh');

// Force service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update();
      console.log('Service worker updated');
    });
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('Deleted cache:', name);
    });
  });
}

// Force page reload after cache clear
setTimeout(() => {
  console.log('Forcing page reload after cache clear');
  window.location.reload(true);
}, 1000);