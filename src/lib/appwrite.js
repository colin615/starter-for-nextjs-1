import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Try to set session from cookie or localStorage
if (typeof window !== "undefined") {
  // First try to get from cookie (works in production on same domain)
  const sessionCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("appwrite-session-client="));
  
  if (sessionCookie) {
    const sessionSecret = sessionCookie.split("=")[1];
    client.setSession(sessionSecret);
  } else {
    // Fallback to localStorage (works on localhost)
    const sessionSecret = localStorage.getItem("appwrite-session");
    if (sessionSecret) {
      client.setSession(sessionSecret);
    }
  }
}

const account = new Account(client);
const databases = new Databases(client);

// Function to initialize/update session
export const setClientSession = (sessionSecret) => {
  client.setSession(sessionSecret);
  // Also store in localStorage for localhost development
  if (typeof window !== "undefined") {
    localStorage.setItem("appwrite-session", sessionSecret);
  }
};

// Function to clear session
export const clearClientSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appwrite-session");
  }
};

export { client, account, databases };
