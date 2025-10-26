import { Client, Databases, TablesDB } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.warn("Appwrite server environment variables not set. Database operations will fail.");
}

/**
 * Create a session-based Appwrite client for database operations
 * This uses the API key for server-side operations
 */
export async function createSessionClient() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Appwrite server environment variables not configured");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    databases: new Databases(client),
    tablesdb: new TablesDB(client),
    client
  };
}

/**
 * Create an admin Appwrite client for elevated permissions
 */
export async function createAdminClient() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Appwrite server environment variables not configured");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return client;
}

