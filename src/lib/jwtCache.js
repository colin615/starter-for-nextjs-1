/**
 * JWT Cache Utility
 * 
 * Caches JWT tokens to prevent hitting rate limits by creating
 * a new JWT on every request. The JWT is stored in memory and
 * only refreshed when it expires or is missing.
 */

import { account } from "./appwrite";

// In-memory cache for JWT
let jwtCache = {
  token: null,
  expiresAt: null,
};

// JWT expiration buffer (refresh 30 seconds before actual expiration)
const EXPIRATION_BUFFER = 30 * 1000; // 30 seconds in milliseconds

/**
 * Get a valid JWT token. Returns cached token if still valid,
 * otherwise creates a new one.
 * 
 * @param {boolean} forceRefresh - Force creation of a new JWT
 * @returns {Promise<string>} Valid JWT token
 */
export async function getJWT(forceRefresh = false) {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (
    !forceRefresh &&
    jwtCache.token &&
    jwtCache.expiresAt &&
    jwtCache.expiresAt > now + EXPIRATION_BUFFER
  ) {
    console.log("Using cached JWT (expires in", Math.round((jwtCache.expiresAt - now) / 1000), "seconds)");
    return jwtCache.token;
  }
  
  try {
    console.log("Creating new JWT...");
    const jwtResponse = await account.createJWT();
    
    // JWTs from Appwrite are valid for 15 minutes (900 seconds)
    // Calculate expiration time
    const expiresAt = now + (15 * 60 * 1000); // 15 minutes from now
    
    // Cache the new token
    jwtCache = {
      token: jwtResponse.jwt,
      expiresAt: expiresAt,
    };
    
    console.log("New JWT cached (valid for 15 minutes)");
    return jwtCache.token;
  } catch (error) {
    console.error("Error creating JWT:", error);
    throw error;
  }
}

/**
 * Clear the JWT cache. Useful when logging out or
 * when you need to force a refresh.
 */
export function clearJWTCache() {
  jwtCache = {
    token: null,
    expiresAt: null,
  };
  console.log("JWT cache cleared");
}

/**
 * Check if there's a valid cached JWT
 * @returns {boolean}
 */
export function hasValidJWT() {
  const now = Date.now();
  return (
    jwtCache.token !== null &&
    jwtCache.expiresAt !== null &&
    jwtCache.expiresAt > now + EXPIRATION_BUFFER
  );
}

