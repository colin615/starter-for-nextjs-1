import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize session from localStorage if available
if (typeof window !== "undefined") {
  const sessionSecret = localStorage.getItem("appwrite-session");
  if (sessionSecret) {
    client.setSession(sessionSecret);
  }
}

const account = new Account(client);
const databases = new Databases(client);

// Function to set client session (used after login)
export const setClientSession = (sessionSecret) => {
  client.setSession(sessionSecret);
  if (typeof window !== "undefined") {
    localStorage.setItem("appwrite-session", sessionSecret);
  }
};

// Function to clear session and JWT cache
export const clearClientSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appwrite-session");
    localStorage.removeItem("appwrite-realtime-jwt");
  }
};

export { client, account, databases };
