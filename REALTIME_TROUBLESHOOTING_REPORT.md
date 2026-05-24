# Realtime Chat Troubleshooting Report

## What was broken

### 1) Sender/receiver bubble alignment was wrong

- **Symptom:** messages were showing on the wrong side.
- **Root cause:** the frontend was using a hardcoded user id at first, and later the message mapping relied on the wrong payload field in some responses.
- **Fix:** the frontend now loads the authenticated user from `/profile/me`, stores the current user id locally, and normalizes message sender fields from multiple possible backend shapes.

### 2) Private channel auth for Reverb was failing

- **Symptom:** real-time messages were not arriving in the other client.
- **Root cause:** the private channel auth request was being sent to the wrong endpoint at first, and the channel authorization also needed an explicit Sanctum guard.
- **Fix:** Echo now sends auth to `/broadcasting/auth`, and `routes/channels.php` authorizes `conversations.{conversation}` with the `sanctum` guard.

### 3) Reverb broadcasting jobs were failing in Docker

- **Symptom:** queue jobs like `BroadcastEvent` kept failing with connection errors.
- **Root cause:** the Docker runtime was using `REVERB_HOST=localhost` inside containers, so the app/worker tried to connect to `localhost:8080` instead of the Reverb service container.
- **Fix:** the Docker override now forces the app and queue worker to use `REVERB_HOST=real-time-reverb`.

### 4) API requests were returning `Network Error`

- **Symptom:** frontend console showed Axios `Network Error` while loading user data and conversations.
- **Root cause:** nginx was returning `502 Bad Gateway` because FastCGI upstream to `real-time-app:9000` was failing.
- **Fix:** restarting nginx resolved the upstream connection issue, and the API started returning `401 Unauthorized` instead of `502`, which confirmed the backend was reachable.

## Files changed

- `frontend-chat/src/App.jsx`
- `frontend-chat/src/utils/echo.js`
- `backend/app/Http/Controllers/Api/V1/Chat/MessageController.php`
- `backend/routes/channels.php`
- `real-deployment/docker-compose.override.yml`

## Current working state

- Message bubbles now use the correct sender id.
- Reverb private channels authenticate correctly.
- Reverb queue jobs are no longer failing with the localhost connection error.
- nginx is no longer returning `502` for the API.

## Where to look next if something breaks again

### If messages appear on the wrong side

Check:

- `frontend-chat/src/App.jsx`
- `frontend-chat/src/components/MessageList.jsx`

Look for:

- `currentUser.id`
- `mapMessage(...)`
- `senderId` normalization

### If realtime updates stop working

Check:

- `frontend-chat/src/utils/echo.js`
- `backend/routes/channels.php`
- `backend/app/Events/Chat/MessageSent.php`
- `real-deployment/docker-compose.override.yml`

Look for:

- `authEndpoint`
- `REVERB_HOST`
- `broadcastAs()`
- `PrivateChannel('conversations.' . $conversationId)`

### If the console shows `Network Error`

Check:

- `real-deployment/nginx/default.conf`
- `frontend-chat/src/utils/axios.js`

Look for:

- API base URL
- nginx upstream to `real-time-app:9000`
- container health status

### If `/broadcasting/auth` fails with 403 or 401

Check:

- `backend/routes/channels.php`
- login token storage in the frontend
- `frontend-chat/src/utils/echo.js`

Look for:

- Sanctum guard
- Bearer token header
- authenticated user session

## Quick summary

The main fixes were:

- correct current user detection
- correct message payload mapping
- correct Reverb auth endpoint
- correct Docker internal Reverb host
- correct channel authorization guard
- nginx upstream recovery

With these in place, realtime message delivery works again.
