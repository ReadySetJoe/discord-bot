# System Architecture

## How Everything Works Together

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR DISCORD SERVER                      │
│  • Members join/leave voice                                      │
│  • Messages sent                                                 │
│  • New members join                                              │
│  • Milestones reached                                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Discord Gateway (Events)
                      ▼
         ┌────────────────────────┐
         │    DISCORD BOT         │
         │    (bot.js)            │
         │                        │
         │  • Listens for events  │
         │  • Tracks voice state  │
         │  • Monitors messages   │
         │  • Detects milestones  │
         └───────────┬────────────┘
                     │
                     │ WebSocket Connection
                     ▼
         ┌────────────────────────┐
         │  WEBSOCKET SERVER      │
         │  (server.js)           │
         │                        │
         │  • Receives from bot   │
         │  • Broadcasts to all   │
         │  • Stores recent data  │
         │  • Serves HTML files   │
         └───────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Overlay │  │Overlay │  │Overlay │
    │   1    │  │   2    │  │   3    │
    └────────┘  └────────┘  └────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     │ Browser Sources
                     ▼
         ┌────────────────────────┐
         │         OBS            │
         │                        │
         │  📹 Your Stream!       │
         └────────────────────────┘
                     │
                     │
                     ▼
         ┌────────────────────────┐
         │       TWITCH           │
         │                        │
         │  👥 Your Viewers       │
         └────────────────────────┘
```

## Data Flow Example

### When someone joins voice chat:

1. **Discord** → Member enters voice channel
2. **Discord Bot** detects `VoiceStateUpdate` event
3. **Bot** formats data (username, avatar, channel name)
4. **Bot** sends via WebSocket: `{"type": "voice_join", "data": {...}}`
5. **WebSocket Server** receives and broadcasts to all connected overlays
6. **Overlay** receives update via WebSocket
7. **Overlay** updates display (adds member to list)
8. **OBS** shows updated overlay on stream
9. **Viewers** see who joined in real-time! 🎉

### When a message is sent:

1. **Discord** → Message posted in tracked channel
2. **Bot** detects `MessageCreate` event
3. **Bot** filters (checks if channel should be tracked)
4. **Bot** sends: `{"type": "message", "data": {...}}`
5. **Server** broadcasts to overlays
6. **Activity Feed** adds message to top of feed
7. **OBS** displays the new activity
8. **Viewers** see the conversation! 💬

## Deployment Architecture

### Local Development
```
Your Computer
├── Discord Bot (bot.js) → localhost:8080
├── WebSocket Server (server.js) → localhost:8080
└── OBS Browser Sources → http://localhost:8080/overlay.html
```

### Production Setup
```
                ┌─────────────────────┐
                │   HOSTING SERVICE   │
                │  (Railway/Heroku)   │
                │                     │
                │  ┌───────────────┐  │
                │  │  Discord Bot  │  │
                │  └───────────────┘  │
                │  ┌───────────────┐  │
                │  │  WS Server    │  │
                │  └───────────────┘  │
                │  ┌───────────────┐  │
                │  │  Overlays     │  │
                │  └───────────────┘  │
                └──────────┬──────────┘
                           │
              https://your-app.railway.app
                           │
                           ▼
                 ┌─────────────────┐
                 │  OBS (on your   │
                 │    computer)    │
                 └─────────────────┘
```

## WebSocket Communication

### Event Types

**From Bot → Server:**
```javascript
{
  type: 'voice_join' | 'voice_leave' | 'voice_update',
  data: { username, avatar, channelName, ... },
  timestamp: 1234567890
}

{
  type: 'message',
  data: { username, content, channelName, ... },
  timestamp: 1234567890
}

{
  type: 'stats',
  data: { memberCount, onlineCount, voiceCount },
  timestamp: 1234567890
}

{
  type: 'milestone',
  data: { type, count, message },
  timestamp: 1234567890
}
```

**From Server → Overlays:**
- Same format as above
- Server adds recent events cache
- New connections get replayed recent data

## Performance Considerations

### Bandwidth
- WebSocket: ~1-5 KB per event
- Avatar images: Cached by browser
- Updates: Only on actual changes

### CPU Usage
- Bot: Minimal (event-driven)
- Server: Low (simple relay)
- Overlays: Lightweight (DOM updates only)

### Scalability
- Single bot handles one Discord server
- WebSocket server handles 100+ concurrent overlay connections
- Each overlay independently connects

## Security Notes

### Environment Variables
- `DISCORD_BOT_TOKEN` - Keep private! Never commit to git
- `WS_SERVER_URL` - Can be public (no sensitive data)

### WebSocket
- No authentication by default (overlay data is public)
- Add authentication if needed for sensitive servers
- Data transmitted is already visible in Discord

### Bot Permissions
- Read-only by default
- No message sending (unless you add it)
- No member management
- No admin permissions needed

## Extending the System

### Add New Overlay
1. Create new HTML file in `/overlays`
2. Connect to WebSocket
3. Handle events in JavaScript
4. Add to OBS as browser source

### Add New Events
1. Add event listener in `bot.js`
2. Format and send data via WebSocket
3. Handle in overlay JavaScript
4. Update display logic

### Add Database
```
Bot → WebSocket Server → Database
                       ↓
                   Overlays
```

Benefits:
- Historical data
- Analytics
- Persistent stats
- Replay capability

### Add Authentication
```javascript
// In server.js
ws.on('connection', (ws, req) => {
  const token = req.headers['authorization'];
  if (!validateToken(token)) {
    ws.close();
  }
});
```

## Monitoring

### Health Checks
- Server: `GET /health` endpoint
- Returns: Status, connected clients, uptime

### Logging
- Bot: Console logs for events
- Server: Connection logs
- Overlays: Browser console

### Debugging
1. Check bot logs for Discord events
2. Check server logs for WebSocket connections
3. Check browser console for overlay errors
4. Use WebSocket inspector tools

## Best Practices

✅ **DO:**
- Keep overlays lightweight
- Cache images and assets
- Use environment variables for config
- Enable "Shutdown when not visible" in OBS
- Test before going live

❌ **DON'T:**
- Commit `.env` file to git
- Share bot token publicly
- Run multiple bots with same token
- Fetch same data repeatedly
- Ignore error logs

## Troubleshooting Flow

```
Issue: Overlay not updating
        │
        ├─ Check: Is server running?
        │   └─ NO → Start with `npm run dev`
        │   └─ YES ↓
        │
        ├─ Check: Is bot connected to Discord?
        │   └─ NO → Check token and intents
        │   └─ YES ↓
        │
        ├─ Check: WebSocket connection in browser console?
        │   └─ NO → Check WS_SERVER_URL
        │   └─ YES ↓
        │
        └─ Check: Are events being sent?
            └─ Look at bot logs
            └─ Look at server logs
            └─ Verify bot permissions
```

This architecture provides real-time updates with minimal latency and resource usage! 🚀