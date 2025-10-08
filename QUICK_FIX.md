# QUICK FIX - 2 Minutes

## Your Error
```
User (role: guests) missing scopes (["account"])
```

## The Fix (2 steps)

### 1. Go to Appwrite Console

https://cloud.appwrite.io → Your Project → Settings → Platforms → Add Platform

### 2. Add This Platform

```
Type: Web App
Name: Local Development
Hostname: localhost
```

**IMPORTANT**: Just type `localhost` - nothing else!

- ❌ NO: `http://localhost:3000`
- ❌ NO: `localhost:3000`  
- ✅ YES: `localhost`

### 3. Done!

- Click Save/Next
- Wait 10 seconds
- Refresh your browser (Cmd+Shift+R)
- Try logging in again

## It Should Work Now

You should see:
```
🔐 Authenticating client SDK...
✅ Client SDK authenticated for user: abc123
```

## Still Not Working?

1. **Double-check the hostname is exactly:** `localhost`
2. **Wait 20 seconds** (takes time to propagate)
3. **Hard refresh** your browser (Cmd+Shift+R or Ctrl+Shift+R)
4. **Clear browser storage**: DevTools (F12) → Application → Clear site data
5. **Try incognito window**

## For Production

When you deploy, add another platform:
```
Type: Web App
Name: Production  
Hostname: yourdomain.com
```

(Again, just the domain - no http://, no www, no paths)

---

**That's it!** The platform whitelist is the issue. Once it's added, everything will work.

