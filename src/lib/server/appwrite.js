import { Client, Account, Databases, TablesDB, Storage } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

  const cookieStore = await cookies();
  const session = cookieStore.get("appwrite-session");
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get tablesdb() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get tablesdb() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}
