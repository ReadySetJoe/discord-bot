# 🚀 Quick Start Guide

## What You Just Got

A complete Discord overlay system for your Twitch streams! Here's what's included:

### 📦 Files Overview

```
discord-bot/
├── bot.js                          # Discord bot that tracks activity
├── server.js                       # WebSocket server for real-time updates
├── overlays/                       # HTML overlays for OBS
│   ├── discord-squad.html         # Shows who's in voice chat
│   ├── activity-feed.html         # Recent Discord messages
│   ├── milestone-tracker.html     # Server stats & milestones
│   └── simple-stat.html           # Customizable single stat
├── .github/workflows/deploy.yml   # Auto-deployment via GitHub Actions
├── package.json                    # Dependencies
├── README.md                       # Full documentation
└── OBS_SETUP.md                   # OBS configuration guide
```

## 🏃 Get Started in 5 Minutes

### 1. Install & Configure

```bash
cd discord-bot
npm install
cp .env.example .env
```

Edit `.env` and add your Discord bot token:
```
DISCORD_BOT_TOKEN=your_token_here
```

### 2. Run Locally

```bash
npm run dev
```

This starts both the server and bot!

### 3. Add to OBS

1. Add Browser Source in OBS
2. URL: `http://localhost:8080/discord-squad.html`
3. Size: 600x600
4. Done! 🎉

## 🌐 Deploy to Production

### Railway (Easiest)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Then update your OBS browser sources to use your Railway URL!

### Heroku

```bash
heroku create your-app-name
heroku config:set DISCORD_BOT_TOKEN=your_token
git push heroku main
```

## 📋 Discord Bot Setup

1. Go to https://discord.com/developers/applications
2. Create new application → Bot section
3. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Copy bot token to `.env`
5. Invite bot to server with these permissions:
   - Read Messages/View Channels
   - Read Message History
   - View Server Insights

**Invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=66560&scope=bot
```
(Replace YOUR_CLIENT_ID with your bot's client ID)

## 🎨 Overlay Descriptions

### Discord Squad
**Perfect for:** Showing your active community  
**Shows:** Real-time list of everyone in voice chat with avatars  
**Best position:** Bottom corner of stream

### Activity Feed  
**Perfect for:** Showcasing Discord engagement  
**Shows:** Recent messages, new members, server milestones  
**Best position:** Side panel or dedicated scene

### Milestone Tracker
**Perfect for:** Growth motivation  
**Shows:** Member count, online count, progress to next milestone  
**Best position:** Top corner with stats

### Simple Stat
**Perfect for:** Clean, minimal display  
**Shows:** Any single stat with custom text  
**Customizable:** Change stat, label, icon via URL parameters

## 🔧 Customization Ideas

### Track specific channels only
Add to `.env`:
```
TRACK_CHANNELS=123456789,987654321
```

### Change milestone celebrations
Edit `bot.js`, change the milestones array:
```javascript
const milestones = [100, 500, 1000, 5000];
```

### Change colors
Edit overlay HTML files, modify the gradient CSS:
```css
background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR2 100%);
```

### Add more events
In `bot.js`:
```javascript
client.on(Events.YourEvent, (data) => {
  sendToOverlay('custom_event', { /* data */ });
});
```

## 🐛 Common Issues

**"Cannot connect to WebSocket"**
- Server not running: `npm run dev`
- Wrong URL: Check `WS_SERVER_URL` in `.env`

**"Bot not responding"**
- Check token is correct
- Verify intents are enabled
- Ensure bot has permissions in server

**"Overlays not showing in OBS"**
- Check browser source URL is correct
- Try refreshing the source (right-click → Refresh)
- Check browser console for errors (Ctrl+Shift+I)

## 📚 Next Steps

1. ✅ Read `README.md` for detailed docs
2. ✅ Read `OBS_SETUP.md` for layout tips
3. ✅ Customize colors and appearance
4. ✅ Deploy to production
5. ✅ Set up GitHub Actions for auto-deploy

## 💡 Pro Tips

- Use different overlays for different scenes in OBS
- Enable "Shutdown source when not visible" for performance
- Combine with your existing alerts system
- Test everything before going live!
- Join our community (oh wait, that's YOUR Discord 😄)

## 🚨 Remember

When you deploy to production:
1. Update `WS_SERVER_URL` in `.env` to your deployed URL
2. Use `wss://` (secure WebSocket) for https sites
3. Update WebSocket URL in each HTML overlay file
4. Update OBS browser sources to new URL

## 🎮 Ready to Stream!

You now have a professional Discord overlay system! Your viewers will love seeing your active community right on stream.

Questions? Check the README.md or documentation!

Happy streaming! 🎬✨