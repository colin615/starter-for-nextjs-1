# API Implementation Guide

## Overview

This document outlines the implementation of the enhanced Roobet API data collection and storage system with improved activity tracking, lastSeen functionality, and activity scoring.

## Data Structure

### Enhanced User Data Format

Each user record now includes the following fields:

```json
{
  "uid": "61268455-915e-472a-b4f6-e1ef8ce89992",
  "username": "roryeast",
  "favoriteGameId": "housegames:mines",
  "favoriteGameTitle": "Mines",
  "wagered": 127.87469100000001,
  "weightedWagered": 127.87469100000001,
  "rankLevel": 10,
  "rankLevelImage": "https://roobet.com/cdn-cgi/image/metadata=none,format=auto/https://roobet.com/immutable/rewards/levelcons/emerald2.png",
  "highestMultiplier": {
    "multiplier": 3,
    "wagered": 2.5500000000000003,
    "payout": 7.65,
    "gameId": "housegames:mines",
    "gameTitle": "Mines"
  },
  "lastSeen": "2024-01-15T14:30:00.000Z",
  "activityScore": 85,
  "totalDaysActive": 12,
  "lastActivityUpdate": "2024-01-15T14:30:00.000Z"
}
```

### New Fields Explained

- **`lastSeen`**: ISO timestamp of when the user was last active (appears in API data)
- **`activityScore`**: Score from 0-100 indicating user activity level over the last 30 days
- **`totalDaysActive`**: Number of unique days the user was active in the last 30 days
- **`lastActivityUpdate`**: ISO timestamp of when the activity score was last calculated

## Database Schema

### Tables

1. **`statistic_quarters`** - 15-minute interval data
2. **`statistic_hours`** - Hourly data
3. **`statistic_days`** - Daily data
4. **`linked_apis`** - User API connections
5. **`internal_stats`** - Service statistics

### Table Structure

Each statistics table has the following structure:

```sql
CREATE TABLE statistic_quarters (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  quarter_id VARCHAR(100) NOT NULL UNIQUE,
  data_raw TEXT NOT NULL,
  data_key JSON NOT NULL,
  datetime TIMESTAMP NOT NULL,
  identifier VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Activity Tracking System

### LastSeen Logic

The `lastSeen` field is updated whenever a user appears in the API response, regardless of whether their wagered amount changed. This provides accurate activity tracking.

**Algorithm:**
1. Fetch data for a time window (15min, hour, or day)
2. If user appears in the API response, update `lastSeen` to the start of that time window
3. Preserve existing `lastSeen` for users not in the current API response

### Activity Score Calculation

The activity score (0-100) is calculated based on:

1. **Frequency Score (0-60 points)**: Based on days active in the last 30 days
   - Formula: `(daysActive / totalDays) * 60`
   
2. **Recency Score (0-40 points)**: Based on time since last activity
   - 24 hours or less: 40 points
   - 72 hours or less: 30 points
   - 1 week or less: 20 points
   - 2 weeks or less: 10 points
   - More than 2 weeks: 0 points

**Total Score**: `min(100, frequencyScore + recencyScore)`

## Time Windows

### 15-Minute Intervals
- **Purpose**: High-frequency activity tracking
- **Storage**: `statistic_quarters` table
- **ID Format**: `{userId}:{YYYY-MM-DD-HH-MM}`
- **Processing**: Every 15 minutes

### Hourly Intervals
- **Purpose**: Standard activity tracking
- **Storage**: `statistic_hours` table
- **ID Format**: `{userId}:{YYYY-MM-DD-HH}`
- **Processing**: Every hour

### Daily Intervals
- **Purpose**: Long-term trend analysis
- **Storage**: `statistic_days` table
- **ID Format**: `{userId}:{YYYY-MM-DD}`
- **Processing**: Once per day

## API Endpoints

### Frontend API Routes

#### 1. Get User Activity Data

```http
GET /api/users/{userId}/activity
```

**Query Parameters:**
- `period`: `15min`, `hour`, `day` (default: `hour`)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `limit`: Number of records (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "summary": {
      "totalUsers": 150,
      "activeUsers": 45,
      "avgActivityScore": 67.5,
      "totalWagered": 12500.50
    },
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 150
    }
  }
}
```

#### 2. Get User Activity History

```http
GET /api/users/{userId}/history
```

**Query Parameters:**
- `days`: Number of days to look back (default: 30)
- `includeInactive`: Boolean (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "activityHistory": [
      {
        "date": "2024-01-15",
        "activityScore": 85,
        "lastSeen": "2024-01-15T14:30:00.000Z",
        "totalWagered": 250.75,
        "totalWeighted": 250.75
      }
    ],
    "summary": {
      "avgActivityScore": 67.5,
      "totalDaysActive": 12,
      "lastSeen": "2024-01-15T14:30:00.000Z"
    }
  }
}
```

#### 3. Get Activity Leaderboard

```http
GET /api/leaderboard/activity
```

**Query Parameters:**
- `period`: `15min`, `hour`, `day` (default: `day`)
- `limit`: Number of users (default: 50)
- `minActivityScore`: Minimum activity score (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "roryeast",
        "activityScore": 95,
        "totalDaysActive": 28,
        "lastSeen": "2024-01-15T14:30:00.000Z",
        "totalWagered": 12500.50
      }
    ],
    "period": "day",
    "generatedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

### Backend API Implementation

#### Appwrite Functions

1. **Roobet Service** (`roobetService.js`)
   - Runs every 15 minutes
   - Fetches data for 15-minute, hourly, and daily intervals
   - Updates activity tracking and scores

2. **Onboarding Service** (`main.js`)
   - Triggered when user links API
   - Performs initial data backfill
   - Sets up activity tracking

#### Database Queries

```javascript
// Get user activity data for a specific period
const getActivityData = async (userId, period, startDate, endDate) => {
  const tableName = period === '15min' ? 'statistic_quarters' : 
                   period === 'hour' ? 'statistic_hours' : 'statistic_days';
  
  const queries = [
    Query.equal('userId', userId),
    Query.greaterThanEqual('datetime', startDate),
    Query.lessThanEqual('datetime', endDate),
    Query.orderDesc('datetime'),
    Query.limit(100)
  ];
  
  return await tablesdb.listRows({
    databaseId: 'skapex-dash-db',
    tableId: tableName,
    queries
  });
};
```

## Next.js API Routes Implementation

### API Route Structure

Create the following API routes in your Next.js application:

#### 1. `/pages/api/users/[userId]/activity.js`

```javascript
import { Client, TablesDB } from "node-appwrite";
import { Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesdb = new TablesDB(client);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  const { period = 'hour', startDate, endDate, limit = 100 } = req.query;

  try {
    // Determine table based on period
    const tableMap = {
      '15min': 'statistic_quarters',
      'hour': 'statistic_hours',
      'day': 'statistic_days'
    };

    const tableName = tableMap[period];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid period. Use: 15min, hour, or day' });
    }

    // Build queries
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('datetime'),
      Query.limit(parseInt(limit))
    ];

    if (startDate) {
      queries.push(Query.greaterThanEqual('datetime', startDate));
    }
    if (endDate) {
      queries.push(Query.lessThanEqual('datetime', endDate));
    }

    // Fetch data
    const result = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: tableName,
      queries
    });

    // Process data
    const users = [];
    const userMap = new Map();
    let totalWagered = 0;

    result.rows.forEach(row => {
      try {
        const data = JSON.parse(row.data_raw);
        data.forEach(user => {
          const userId = user.uid || user.userId || user.id || user.username;
          if (!userMap.has(userId)) {
            userMap.set(userId, user);
            totalWagered += user.wagered || 0;
          }
        });
      } catch (err) {
        console.error('Error parsing row data:', err);
      }
    });

    // Convert map to array and sort by activity score
    const userArray = Array.from(userMap.values())
      .sort((a, b) => (b.activityScore || 0) - (a.activityScore || 0));

    // Calculate summary
    const activeUsers = userArray.filter(user => 
      user.lastSeen && 
      new Date(user.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const avgActivityScore = userArray.length > 0 
      ? userArray.reduce((sum, user) => sum + (user.activityScore || 0), 0) / userArray.length 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        users: userArray,
        summary: {
          totalUsers: userArray.length,
          activeUsers,
          avgActivityScore: Math.round(avgActivityScore * 100) / 100,
          totalWagered: Math.round(totalWagered * 100) / 100
        },
        pagination: {
          limit: parseInt(limit),
          offset: 0,
          total: userArray.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch activity data' 
    });
  }
}
```

#### 2. `/pages/api/users/[userId]/history.js`

```javascript
import { Client, TablesDB } from "node-appwrite";
import { Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesdb = new TablesDB(client);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  const { days = 30, includeInactive = false } = req.query;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Fetch daily data
    const dailyResult = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: 'statistic_days',
      queries: [
        Query.equal('userId', userId),
        Query.greaterThanEqual('datetime', cutoffDate.toISOString()),
        Query.orderDesc('datetime')
      ]
    });

    // Process activity history
    const activityHistory = [];
    const userActivityMap = new Map();

    dailyResult.rows.forEach(row => {
      try {
        const data = JSON.parse(row.data_raw);
        const dayDate = new Date(row.datetime).toISOString().split('T')[0];
        
        data.forEach(user => {
          const userId = user.uid || user.userId || user.id || user.username;
          if (!userActivityMap.has(userId)) {
            userActivityMap.set(userId, {
              userId,
              activityHistory: [],
              totalWagered: 0,
              totalWeighted: 0
            });
          }
          
          const userData = userActivityMap.get(userId);
          userData.totalWagered += user.wagered || 0;
          userData.totalWeighted += user.weightedWagered || 0;
          
          // Add to activity history
          userData.activityHistory.push({
            date: dayDate,
            activityScore: user.activityScore || 0,
            lastSeen: user.lastSeen,
            wagered: user.wagered || 0,
            weighted: user.weightedWagered || 0
          });
        });
      } catch (err) {
        console.error('Error parsing daily data:', err);
      }
    });

    // Get the most recent user data
    const mostRecentUser = Array.from(userActivityMap.values())
      .sort((a, b) => {
        const aLastSeen = a.activityHistory[a.activityHistory.length - 1]?.lastSeen;
        const bLastSeen = b.activityHistory[b.activityHistory.length - 1]?.lastSeen;
        return new Date(bLastSeen || 0) - new Date(aLastSeen || 0);
      })[0];

    if (!mostRecentUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'No activity history found' 
      });
    }

    // Calculate summary
    const avgActivityScore = mostRecentUser.activityHistory.length > 0
      ? mostRecentUser.activityHistory.reduce((sum, day) => sum + day.activityScore, 0) / mostRecentUser.activityHistory.length
      : 0;

    const totalDaysActive = new Set(mostRecentUser.activityHistory.map(day => day.date)).size;
    const lastSeen = mostRecentUser.activityHistory[mostRecentUser.activityHistory.length - 1]?.lastSeen;

    res.status(200).json({
      success: true,
      data: {
        userId: mostRecentUser.userId,
        activityHistory: mostRecentUser.activityHistory,
        summary: {
          avgActivityScore: Math.round(avgActivityScore * 100) / 100,
          totalDaysActive,
          lastSeen,
          totalWagered: Math.round(mostRecentUser.totalWagered * 100) / 100,
          totalWeighted: Math.round(mostRecentUser.totalWeighted * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch activity history' 
    });
  }
}
```

#### 3. `/pages/api/leaderboard/activity.js`

```javascript
import { Client, TablesDB } from "node-appwrite";
import { Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesdb = new TablesDB(client);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = 'day', limit = 50, minActivityScore = 0 } = req.query;

  try {
    // Determine table based on period
    const tableMap = {
      '15min': 'statistic_quarters',
      'hour': 'statistic_hours',
      'day': 'statistic_days'
    };

    const tableName = tableMap[period];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid period. Use: 15min, hour, or day' });
    }

    // Get the most recent data
    const result = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: tableName,
      queries: [
        Query.orderDesc('datetime'),
        Query.limit(1)
      ]
    });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No data found' 
      });
    }

    // Process leaderboard data
    const leaderboard = [];
    const userMap = new Map();

    try {
      const data = JSON.parse(result.rows[0].data_raw);
      
      data.forEach(user => {
        const userId = user.uid || user.userId || user.id || user.username;
        if (user.activityScore >= parseInt(minActivityScore)) {
          userMap.set(userId, {
            username: user.username,
            activityScore: user.activityScore || 0,
            totalDaysActive: user.totalDaysActive || 0,
            lastSeen: user.lastSeen,
            totalWagered: user.wagered || 0,
            rankLevel: user.rankLevel,
            favoriteGameTitle: user.favoriteGameTitle
          });
        }
      });
    } catch (err) {
      console.error('Error parsing leaderboard data:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse leaderboard data' 
      });
    }

    // Sort by activity score and limit results
    const sortedUsers = Array.from(userMap.values())
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, parseInt(limit))
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }));

    res.status(200).json({
      success: true,
      data: {
        leaderboard: sortedUsers,
        period,
        generatedAt: new Date().toISOString(),
        totalUsers: sortedUsers.length
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard' 
    });
  }
}
```

### Environment Variables

Add these to your `.env.local` file:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
```

### Usage Examples

#### Fetch User Activity Data
```javascript
// GET /api/users/user123/activity?period=hour&limit=50
const response = await fetch('/api/users/user123/activity?period=hour&limit=50');
const data = await response.json();
```

#### Fetch Activity History
```javascript
// GET /api/users/user123/history?days=30
const response = await fetch('/api/users/user123/history?days=30');
const data = await response.json();
```

#### Fetch Activity Leaderboard
```javascript
// GET /api/leaderboard/activity?period=day&limit=20&minActivityScore=50
const response = await fetch('/api/leaderboard/activity?period=day&limit=20&minActivityScore=50');
const data = await response.json();
```

## Data Processing Flow

### 1. Data Collection
1. **15-minute intervals**: Every 15 minutes, fetch data for the last 15 minutes
2. **Hourly intervals**: Every hour, fetch data for the last hour
3. **Daily intervals**: Once per day, fetch data for the entire day

### 2. Activity Tracking
1. **LastSeen Update**: Update `lastSeen` for all users appearing in API response
2. **Activity Score Calculation**: Calculate score based on 30-day activity history
3. **Data Storage**: Store processed data in appropriate time-based table

### 3. Data Retrieval
1. **Query Optimization**: Use appropriate table based on requested time period
2. **Activity Filtering**: Filter users based on activity score and lastSeen
3. **Pagination**: Implement efficient pagination for large datasets

## Performance Considerations

### Database Indexing
- Index on `userId` and `datetime` for fast queries
- Index on `quarter_id`, `hour_id`, `day_id` for unique lookups
- Composite index on `(userId, datetime)` for user history queries

### Caching Strategy
- Cache activity scores for 5 minutes
- Cache leaderboard data for 1 minute
- Use Redis for high-frequency data

### Rate Limiting
- 15-minute intervals: 2-second delay between API calls
- Hourly intervals: 4-second delay between API calls
- Daily intervals: 4-second delay between API calls

## Error Handling

### API Failures
- Retry failed API calls with exponential backoff
- Log errors for monitoring and debugging
- Continue processing other users if one fails

### Data Validation
- Validate all incoming data from Roobet API
- Sanitize user input in frontend
- Handle missing or malformed data gracefully

### Monitoring
- Track API call success rates
- Monitor database performance
- Alert on high error rates

## Security Considerations

### Data Privacy
- User data is only accessible by the user who owns it
- Activity scores are calculated server-side
- No sensitive data exposed in frontend

### API Security
- Validate all API keys and user IDs
- Rate limit API endpoints
- Log all data access for audit trails

## Deployment

### Environment Variables
```bash
APPWRITE_FUNCTION_API_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=your-project-id
APPWRITE_FUNCTION_KEY=your-api-key
```

### Database Setup
1. Create database: `skapex-dash-db`
2. Create tables: `statistic_quarters`, `statistic_hours`, `statistic_days`, `linked_apis`, `internal_stats`
3. Set up proper permissions and indexes

### Function Deployment
1. Deploy `roobetService.js` as a scheduled function (every 15 minutes)
2. Deploy `main.js` as a webhook function for onboarding
3. Set up monitoring and logging

This implementation provides a robust, scalable system for tracking user activity with accurate lastSeen timestamps and meaningful activity scores.
