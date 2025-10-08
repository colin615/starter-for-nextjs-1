import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize session from cookie for cross-subdomain authentication
if (typeof window !== "undefined") {
  const sessionCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("appwrite-session-client="));
  
  if (sessionCookie) {
    const sessionSecret = sessionCookie.split("=")[1];
    client.setSession(sessionSecret);
  }
}

const account = new Account(client);
const databases = new Databases(client);

// Function to clear JWT cache (session cookie is httpOnly, managed by server)
export const clearClientSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appwrite-realtime-jwt");
  }
};

export { client, account, databases };
