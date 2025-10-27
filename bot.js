require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const WebSocket = require('ws');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// WebSocket connection to overlay server
let ws;
const WS_SERVER = process.env.WS_SERVER_URL || 'ws://localhost:8080';

function connectWebSocket() {
  ws = new WebSocket(WS_SERVER);
  
  ws.on('open', () => {
    console.log('Connected to overlay server');
  });
  
  ws.on('close', () => {
    console.log('Disconnected from overlay server, reconnecting in 5s...');
    setTimeout(connectWebSocket, 5000);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

function sendToOverlay(type, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
  }
}

// Track voice channel members
const voiceChannelCache = new Map();

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  connectWebSocket();
  
  // Initialize voice channel cache
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(channel => {
      if (channel.isVoiceBased()) {
        const members = Array.from(channel.members.values()).map(member => ({
          id: member.id,
          username: member.user.username,
          displayName: member.displayName,
          avatar: member.user.displayAvatarURL({ format: 'png', size: 128 }),
        }));
        voiceChannelCache.set(channel.id, members);
      }
    });
  });
  
  // Send initial stats
  sendStats();
  
  // Send stats every 30 seconds
  setInterval(sendStats, 30000);
});

function sendStats() {
  const guild = client.guilds.cache.first();
  if (!guild) return;
  
  const stats = {
    memberCount: guild.memberCount,
    onlineCount: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
    voiceCount: guild.members.cache.filter(m => m.voice.channel).size,
  };
  
  sendToOverlay('stats', stats);
}

// Voice state updates
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const member = newState.member;
  
  // Joined a voice channel
  if (!oldState.channel && newState.channel) {
    const memberData = {
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
      avatar: member.user.displayAvatarURL({ format: 'png', size: 128 }),
      channelName: newState.channel.name,
    };
    
    sendToOverlay('voice_join', memberData);
    
    // Update cache
    const channelMembers = voiceChannelCache.get(newState.channel.id) || [];
    channelMembers.push(memberData);
    voiceChannelCache.set(newState.channel.id, channelMembers);
  }
  
  // Left a voice channel
  if (oldState.channel && !newState.channel) {
    const memberData = {
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
      channelName: oldState.channel.name,
    };
    
    sendToOverlay('voice_leave', memberData);
    
    // Update cache
    const channelMembers = voiceChannelCache.get(oldState.channel.id) || [];
    voiceChannelCache.set(
      oldState.channel.id,
      channelMembers.filter(m => m.id !== member.id)
    );
  }
  
  // Send updated voice channel list
  sendVoiceChannelUpdate();
});

function sendVoiceChannelUpdate() {
  const allVoiceMembers = [];
  voiceChannelCache.forEach((members, channelId) => {
    const channel = client.channels.cache.get(channelId);
    if (channel && members.length > 0) {
      allVoiceMembers.push({
        channelName: channel.name,
        members: members,
      });
    }
  });
  
  sendToOverlay('voice_update', allVoiceMembers);
}

// New member joins
client.on(Events.GuildMemberAdd, (member) => {
  sendToOverlay('member_join', {
    username: member.user.username,
    displayName: member.displayName,
    avatar: member.user.displayAvatarURL({ format: 'png', size: 128 }),
  });
  
  sendStats();
});

// Activity feed (messages in specific channels)
client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  
  // Only track messages in channels you specify
  const trackChannels = process.env.TRACK_CHANNELS?.split(',') || [];
  if (trackChannels.length > 0 && !trackChannels.includes(message.channel.id)) {
    return;
  }
  
  sendToOverlay('message', {
    username: message.author.username,
    displayName: message.member?.displayName || message.author.username,
    avatar: message.author.displayAvatarURL({ format: 'png', size: 128 }),
    content: message.content.substring(0, 200), // Truncate long messages
    channelName: message.channel.name,
  });
});

// Milestone detection (can be customized)
client.on(Events.GuildMemberAdd, async (member) => {
  const guild = member.guild;
  const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
  
  if (milestones.includes(guild.memberCount)) {
    sendToOverlay('milestone', {
      type: 'members',
      count: guild.memberCount,
      message: `🎉 ${guild.memberCount} members!`,
    });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);