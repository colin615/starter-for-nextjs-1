import { createSessionClient } from "./appwrite";
import { ID, Query } from "node-appwrite";

const DATABASE_ID = "skapex-dash-db"; // Replace with env var if needed
const COLLECTION_ID = "profiles";

export async function getUserProfile(userId) {
  const { databases } = await createSessionClient();

  try {
    const profile = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      userId,
    );
    return profile;
  } catch (error) {
    if (error.code === 404) return null;
    throw error;
  }
}

export async function createUserProfile(userId) {
  const { tablesdb } = await createSessionClient();

  const existing = await tablesdb.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    queries: [
      Query.equal('userId', userId)
    ]
  });
 
  console.log(existing)

  if (existing.rows[0]) return existing.rows[0]

  const profile = await tablesdb.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    rowId: ID.unique(),
    data: { userId, leaderboards: [] }
  });

  console.log(profile)

  return profile;
}

export async function getOrCreateUserProfile(userId) {
  let profile = await getUserProfile(userId);
  if (!profile) {
    profile = await createUserProfile(userId);
  }
  return profile;
}

export async function getUserLeaderboards(userId) {
  const profile = await getOrCreateUserProfile(userId);
  let lbs = []
  profile.leaderboards.map((item, x) => {
    lbs.push(JSON.parse(item))
  })
  return lbs;
}
