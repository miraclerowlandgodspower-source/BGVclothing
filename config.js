// ==========================================
// BAGGY CLOTHING — SHARED CONFIG
// ==========================================
// Vercel serves the storefront and /api from the same domain.
// Live Server uses another local port, so call the backend on 3000.
// Open local pages with Live Server, not by double-clicking HTML files.

const API_BASE = ["localhost", "127.0.0.1", "[::1]"]
    .includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : window.location.origin;
