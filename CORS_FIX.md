# CORS Configuration Fix

## Issue
The backend was sending `Access-Control-Allow-Origin: https://studybuddy-project.vercel.app/` (with trailing slash) but the actual origin was `https://studybuddy-project.vercel.app` (without trailing slash), causing CORS errors.

## Solution
Updated the CORS configuration in `server.js` to:
1. Normalize origins by removing trailing slashes
2. Return the normalized origin in the response header
3. Explicitly allow the Vercel frontend URL

## Environment Variable
Make sure your Render backend has the `FRONTEND_URL` environment variable set:

```
FRONTEND_URL=https://studybuddy-project.vercel.app
```

(Without trailing slash)

## After Deployment
1. Update the environment variable in Render dashboard
2. Redeploy the backend
3. The CORS error should be resolved

