import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Client will be authenticated via JWT for realtime connections
// Session cookies are used for server-side auth only

const account = new Account(client);
const databases = new Databases(client);

// Function to clear cached JWT
export const clearClientSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appwrite-realtime-jwt");
  }
};

export { client, account, databases };
