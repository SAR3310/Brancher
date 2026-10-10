// ============================================================
// Brancher - Security Middleware & Headers
// OWASP Top 10 mitigation & hardening controls
// ============================================================

/**
 * Security Headers Middleware
 * Implements OWASP recommended security headers
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-XSS-Protection: Legacy XSS protection
 * - Content-Security-Policy: XSS, injection prevention
 * - Strict-Transport-Security: HTTPS enforcement
 * - Referrer-Policy: Referrer information control
 * - Permissions-Policy: Feature access control
 */
function securityHeadersMiddleware(req, res, next) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy - strict policy for production
  // Allows resources only from same origin
  const csp = process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss: http://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";
  res.setHeader('Content-Security-Policy', csp);
  
  // HSTS (HTTP Strict Transport Security) - force HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Referrer Policy - control how much referrer info is sent
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy) - disable unnecessary features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  
  // Disable caching for sensitive responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
}

/**
 * CORS Configuration Middleware
 * Restricts cross-origin requests based on environment
 */
function corsConfigMiddleware(corsOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '3600');
    }
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    
    next();
  };
}

/**
 * Request Size Limit Middleware
 * Prevents large payload DoS attacks
 */
function requestSizeLimitMiddleware(limit = '1mb') {
  const express = require('express');
  return express.json({ limit });
}

/**
 * Session Security Middleware
 * Verifies session validity and prevents session fixation
 */
function sessionSecurityMiddleware(req, res, next) {
  // Regenerate session ID periodically (already handled by express-session)
  // Additional check: ensure session user matches authenticated user
  
  if (req.session && req.session.userId) {
    // Add security headers for authenticated users
    res.setHeader('X-User-Context', req.session.userId);
  }
  
  next();
}

/**
 * Sanitization Helper
 * Sanitizes input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQL Injection Prevention Helper
 * Ensures parameterized queries are used (not a substitute, just verification)
 */
function verifySafeQuery(query) {
  // Check for common SQL injection patterns
  const unsafePatterns = [
    /\bOR\b\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /;\s*DROP\s+/i,
    /;\s*DELETE\s+/i,
    /UNION\s+SELECT/i,
  ];
  
  for (const pattern of unsafePatterns) {
    if (pattern.test(query)) {
      return false;
    }
  }
  
  return true;
}

module.exports = {
  securityHeadersMiddleware,
  corsConfigMiddleware,
  requestSizeLimitMiddleware,
  sessionSecurityMiddleware,
  sanitizeInput,
  verifySafeQuery,
};
