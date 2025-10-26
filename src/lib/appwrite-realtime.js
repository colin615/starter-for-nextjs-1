import { Client, Account } from "appwrite";

/**
 * Minimal Appwrite client for realtime subscriptions only
 * This is used for notifications and other realtime features
 * while auth is handled by Supabase
 */

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.warn("Appwrite environment variables not set. Realtime features will be disabled.");
}

/**
 * Create a minimal Appwrite client
 */
export function createAppwriteClient() {
  if (!endpoint || !projectId) {
    return null;
  }

  return new Client().setEndpoint(endpoint).setProject(projectId);
}

/**
 * Create an account instance for JWT generation
 */
export function createAccount() {
  if (!endpoint || !projectId) {
    return null;
  }

  const client = createAppwriteClient();
  return new Account(client);
}

/**
 * Create an account instance with JWT for realtime
 */
export async function createAccountWithJWT(jwt) {
  if (!endpoint || !projectId || !jwt) {
    return null;
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  return new Account(client);
}

