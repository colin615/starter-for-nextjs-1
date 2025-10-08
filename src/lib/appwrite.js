import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Try to set session from cookie if available
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

// Function to initialize/update session
export const setClientSession = (sessionSecret) => {
  client.setSession(sessionSecret);
};

export { client, account, databases };
