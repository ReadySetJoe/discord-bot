# Discord Stream Overlays 🎮

A real-time overlay system for Twitch streamers that displays Discord activity, voice chat participants, and server milestones directly on stream using OBS.

## Features

- **Discord Squad Overlay**: Shows who's currently in voice chat with avatars
- **Activity Feed Overlay**: Displays recent messages, new members, and server activity
- **Milestone Tracker**: Tracks server stats and celebrates milestones with animations
- **Real-time Updates**: WebSocket-based instant updates without page refreshes
- **Customizable**: Easy to modify colors, layouts, and behavior

## Preview

### Discord Squad
Shows all members currently in voice channels with their avatars and display names.

### Activity Feed
Real-time feed of Discord messages, new members, and important events.

### Milestone Tracker
Live server statistics with progress bars toward the next member milestone.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Discord bot token ([create one here](https://discord.com/developers/applications))
- OBS Studio or streaming software that supports browser sources

### Installation

1. **Clone this repository**
   ```bash
   git clone <your-repo-url>
   cd discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Discord bot token:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   WS_SERVER_URL=ws://localhost:8080
   ```

4. **Set up your Discord bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application or select existing one
   - Go to "Bot" section and copy your token
   - Enable these Privileged Gateway Intents:
     - Server Members Intent
     - Message Content Intent
   - Invite bot to your server with these permissions:
     - Read Messages/View Channels
     - Read Message History
     - View Server Insights

5. **Run the system**
   ```bash
   npm run dev
   ```
   
   This starts both the WebSocket server and Discord bot.

6. **Add overlays to OBS**
   - In OBS, add a Browser Source
   - Set URL to:
     - Discord Squad: `http://localhost:8080/discord-squad.html`
     - Activity Feed: `http://localhost:8080/activity-feed.html`
     - Milestone Tracker: `http://localhost:8080/milestone-tracker.html`
   - Set Width: 800, Height: 600 (adjust as needed)
   - Check "Shutdown source when not visible" for better performance

## Deployment

### Option 1: Railway (Recommended - Free Tier Available)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add environment variables in Railway dashboard:
   - `DISCORD_BOT_TOKEN`

4. Update OBS browser sources to use your Railway URL (e.g., `https://your-app.railway.app/simple-stat.html`)
   - The overlays will automatically detect the production environment and connect via secure WebSocket

### Option 2: Heroku

1. Install Heroku CLI and login

2. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Add buildpack:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. Set config vars:
   ```bash
   heroku config:set DISCORD_BOT_TOKEN=your_token
   heroku config:set WS_SERVER_URL=wss://your-app-name.herokuapp.com
   ```

5. Create `Procfile`:
   ```
   web: node server.js
   worker: node bot.js
   ```

6. Deploy:
   ```bash
   git push heroku main
   heroku ps:scale web=1 worker=1
   ```

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. SSH into your server

2. Install Node.js 18+

3. Clone repository and install dependencies

4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 start bot.js
   pm2 save
   pm2 startup
   ```

5. Set up nginx as reverse proxy (optional)

### GitHub Actions Auto-Deploy

The included GitHub Action (`.github/workflows/deploy.yml`) can automatically deploy your overlays on every push to main.

**Setup:**
1. Add secrets to your GitHub repository:
   - `RAILWAY_TOKEN` (for Railway) or
   - `HEROKU_API_KEY` and `HEROKU_APP_NAME` (for Heroku)

2. Push to main branch - deployment happens automatically!

## Customization

### Changing Colors

Edit the overlay HTML files in `/overlays/`:
- **Discord Squad**: `.header` gradient for header color
- **Activity Feed**: `.header` gradient and event backgrounds
- **Milestone Tracker**: `.card-header` gradient and progress bar colors

### Adding New Events

In `bot.js`, add new event listeners:

```javascript
client.on(Events.YourEvent, (data) => {
  sendToOverlay('your_event_type', {
    // your data
  });
});
```

Then handle it in your overlay HTML:

```javascript
function handleMessage(message) {
  switch (message.type) {
    case 'your_event_type':
      // handle your event
      break;
  }
}
```

### Tracking Specific Channels

Set `TRACK_CHANNELS` in `.env` to track only specific channels:
```
TRACK_CHANNELS=123456789,987654321
```

Get channel IDs by enabling Developer Mode in Discord, right-clicking a channel, and selecting "Copy ID".

### Custom Milestones

Edit the `MILESTONES` array in `bot.js`:
```javascript
const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
```

## Troubleshooting

### Overlays not updating

1. Check WebSocket connection in browser console (F12)
2. Verify `WS_SERVER_URL` matches your server URL
3. Ensure bot has proper permissions in Discord
4. Check server logs for errors

### Bot not connecting

1. Verify bot token is correct
2. Ensure Privileged Gateway Intents are enabled
3. Check bot has been invited to your server
4. Verify Node.js version is 18+

### "Cannot find module" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

## Advanced Features

### Adding Sound Effects

Add sound effects when milestones are reached:

```javascript
// In milestone-tracker.html
function showMilestoneCelebration(milestone) {
  const audio = new Audio('path/to/celebration.mp3');
  audio.play();
  // ... rest of celebration code
}
```

### Multiple Streamer Support

To track multiple streamers' Discord servers, run multiple bot instances with different configurations, or modify the bot to connect to multiple guilds simultaneously.

### Database Integration

For persistent stats and historical data, consider adding a database:
- SQLite for simple setups
- PostgreSQL for production
- Redis for caching

## Architecture

```
┌─────────────────┐
│  Discord Bot    │ ← Listens to Discord events
└────────┬────────┘
         │
         ↓ WebSocket
┌─────────────────┐
│  WebSocket      │ ← Relays events to overlays
│  Server         │
└────────┬────────┘
         │
         ↓ WebSocket
┌─────────────────┐
│  HTML Overlays  │ ← Display in OBS
│  (Browser)      │
└─────────────────┘
```

## Performance Tips

- Enable "Shutdown source when not visible" in OBS browser sources
- Set appropriate refresh rates (WebSocket is real-time, no polling needed)
- Limit MAX_EVENTS in activity feed for better performance
- Use WebSocket compression for lower bandwidth

## Contributing

Pull requests welcome! Ideas for new overlays:
- Subscriber announcements with animations
- Clip compilation displays
- Poll/voting systems
- Stream schedule display
- Raid notifications

## License

MIT License - feel free to modify and use for your streams!

## Support

Having issues? Check:
1. Console logs in browser (F12)
2. Server logs in terminal
3. Discord bot logs
4. [Discord.js documentation](https://discord.js.org/)

## Credits

Built for streamers who want to showcase their Discord community on stream! 🎉