// index.js — BOT BDO complet + Twitch Alerts + BDO Patch Notes (FR)
// Dépendances : discord.js, axios, cheerio
require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// --- Chemins fichiers ---
const configPath = path.resolve(__dirname, 'config.json');
const reactionsFile = path.resolve(__dirname, 'reactionsData.json');
const usersFile = path.resolve(__dirname, 'users.json');
const twitchDataFile = path.resolve(__dirname, 'twitchStreamers.json');
const bdoUpdatesFile = path.resolve(__dirname, 'bdoUpdates.json');

// --- Données en mémoire ---
let configsByGuild = {};
let reactionsByGuild = {};
let usersByGuild = {};
let twitchStreamersByGuild = {};
let bdoSeen = {}; // { guildId: [link,...] } or global set

// --- Chargement initial des fichiers ---
function loadJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Erreur lecture JSON', filePath, e);
    return defaultValue;
  }
}

configsByGuild = loadJSON(configPath, {});
reactionsByGuild = loadJSON(reactionsFile, {});
const rawUsers = loadJSON(usersFile, {});
twitchStreamersByGuild = loadJSON(twitchDataFile, {});
bdoSeen = loadJSON(bdosFile, { seen: [] });

// Convertir listes en Set pour usersByGuild
for (const guildId in rawUsers) {
  usersByGuild[guildId] = new Set(rawUsers[guildId]);
}

// --- Fonctions d'accès par guild ---
function getConfig(guildId) {
  if (!configsByGuild[guildId]) configsByGuild[guildId] = {};
  return configsByGuild[guildId];
}

function getReactionsData(guildId) {
  if (!reactionsByGuild[guildId]) reactionsByGuild[guildId] = {};
  return reactionsByGuild[guildId];
}

function getUsersData(guildId) {
  if (!usersByGuild[guildId]) usersByGuild[guildId] = new Set();
  return usersByGuild[guildId];
}

// --- Fonctions de sauvegarde ---
function saveConfigs() {
  fs.writeFileSync(configPath, JSON.stringify(configsByGuild, null, 2));
}

function saveReactions() {
  fs.writeFileSync(reactionsFile, JSON.stringify(reactionsByGuild, null, 2));
}

function saveUsers() {
  const objToSave = {};
  for (const guildId in usersByGuild) {
    objToSave[guildId] = [...usersByGuild[guildId]];
  }
  fs.writeFileSync(usersFile, JSON.stringify(objToSave, null, 2));
}

function saveTwitchData() {
  fs.writeFileSync(twitchDataFile, JSON.stringify(twitchStreamersByGuild, null, 2));
}

function saveBDOSeen() {
  fs.writeFileSync(bdosFile, JSON.stringify(bdoSeen, null, 2));
}

// --- Mise à jour du statut du bot par nombre total d'utilisateurs (sur tous les serveurs) ---
function updateBotStatus(client) {
  let totalUsers = 0;
  for (const guildId in usersByGuild) {
    totalUsers += usersByGuild[guildId].size;
  }
  if (client && client.user && client.user.setPresence) {
    try {
      client.user.setPresence({
        activities: [{
          name: `${totalUsers} utilisateurs 🧙`,
          type: 3 // "Écoute"
        }],
        status: 'online'
      });
    } catch (error) {
      console.error('Erreur lors du setPresence:', error);
    }
  }
}

// --- Donjons ---
const dungeonsList = [
  '📘 **1. Vahmalkea** *(Atoraxxion - Valmakea)*',
  '💧 **2. Sycrakea** *(Atoraxxion - Sycrakea)*',
  '🔥 **3. Yolunakea** *(Atoraxxion - Yolunkea)*',
  '⚙️ **4. Orzekea** *(Atoraxxion - Orzekea)*'
];

// --- Construction de l'embed donjon ---
function buildDungeonEmbed(guildId, datetime = '') {
  const reactionsData = getReactionsData(guildId);

  const canUsers = [];
  const cantUsers = [];

  for (const userId in reactionsData) {
    const entry = reactionsData[userId];
    if (entry.canDoDungeons === true) canUsers.push(`<@${userId}>`);
    else if (entry.canDoDungeons === false) cantUsers.push(`<@${userId}>`);
  }

  const conf = getConfig(guildId);
  const rolePing = conf.atoraxxionRoleId ? `<@&${conf.atoraxxionRoleId}>` : `<@&1275693513085943862>`; // default id placeholder

  const participantsText =
    `__**📋 Participants :**__\n\n` +
    `✅ **Disponibles** (${canUsers.length})\n${canUsers.length ? canUsers.join(', ') : 'Aucun'}\n\n` +
    `❌ **Indisponibles** (${cantUsers.length})\n${cantUsers.length ? cantUsers.join(', ') : 'Aucun'}`;

  const dateLine = datetime ? `🕒 **Date & Heure :** \`${datetime}\`\n` : '';

  const embed = new EmbedBuilder()
    .setTitle('🏰 Donjons Atoraxxion - Planification')
    .setColor('#2F3136')
    .setDescription(
      `${rolePing}\n\n__**📌 Liste des Donjons :**__\n${dungeonsList.join('\n')}\n\n${dateLine}${participantsText}`
    )
    .setFooter({ text: 'Réagis avec ✅ si tu es dispo ou ❌ si tu ne l’es pas.' });

  return embed;
}

// --- Initialisation client Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  updateBotStatus(client);
  // démarrer Twitch si credentials et BDO check
  if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_SECRET) {
    fetchTwitchToken().catch(() => {});
  }
  // Lancer checks périodiques après ready
  setIntervalSafely(checkLiveStreams, 60_000); // Twitch every 60s
  setIntervalSafely(checkBDOUpdates, 60 * 60 * 1000); // BDO every 1 hour
});

// helper to avoid overlapping intervals
function setIntervalSafely(fn, ms) {
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try { await fn(); } catch (e) { console.error('Erreur interval:', e); }
    running = false;
  }, ms);
}

// --- Commandes slash (incluant Twitch + BDO updates) ---
const commands = [
  new SlashCommandBuilder()
    .setName('postdungeons')
    .setDescription('Poste la liste des donjons avec réactions.')
    .addStringOption(option =>
      option.setName('datetime')
        .setDescription('Date et heure du donjon (ex: 2025-07-28 20:00)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('setdungeonchannel')
    .setDescription('Définit le salon de donjon.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Salon de destination')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('dungeonstatus')
    .setDescription('Affiche qui peut faire les donjons'),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime des messages')
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Raconte une blague'),
  new SlashCommandBuilder()
    .setName('setupdateschannel')
    .setDescription('Définit le salon des mises à jour BDO')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Salon de destination pour les mises à jour')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('setrole')
    .setDescription('Définit le rôle Atoraxxion à pinger dans l’embed.')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à utiliser pour les donjons')
        .setRequired(true)
    ),

  // ---- TWITCH COMMANDS ----
  new SlashCommandBuilder()
    .setName('settwitch')
    .setDescription('Ajoute un streamer Twitch à surveiller')
    .addStringOption(option =>
      option.setName('twitchname')
        .setDescription('Nom du streamer Twitch (login)')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('removetwitch')
    .setDescription('Supprime un streamer Twitch suivi')
    .addStringOption(option =>
      option.setName('twitchname')
        .setDescription('Nom du streamer Twitch à retirer')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('showtwitch')
    .setDescription('Liste tous les streamers suivis'),
  new SlashCommandBuilder()
    .setName('settwitchrole')
    .setDescription('Définit le rôle à mentionner lors des annonces Twitch')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à mentionner')
        .setRequired(true)
    ),

  // ---- BDO UPDATES ----
  new SlashCommandBuilder()
    .setName('setbdoupdatechannel')
    .setDescription('Définit le salon pour les patch notes BDO (FR)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Salon de destination')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('showbdoupdatesconfig')
    .setDescription('Affiche la configuration BDO updates pour ce serveur')
].map(cmd => cmd.toJSON());

// --- Déploiement commandes (global) ---
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log('Déploiement des commandes slash...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Commandes déployées avec succès.');
  } catch (error) {
    console.error('Erreur de déploiement :', error);
  }
})();

// --- Gestion des interactions (commandes) ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    return;
  }

  const config = getConfig(guildId);
  const reactionsData = getReactionsData(guildId);
  const usersData = getUsersData(guildId);

  const { commandName } = interaction;

  // ---------- GENERAL ----------
  if (commandName === 'joke') {
    try {
      const response = await axios.get("https://blague-api.vercel.app/api?mode=global", { timeout: 5000 });
      const data = response.data;
      const blague = data.blagues || data.blague || data.setup || "Pas de blague dispo.";
      const reponse = data.reponses || data.reponse || data.punchline || "";
      await interaction.reply(`${blague}\n${reponse}`);
    } catch {
      await interaction.reply("Impossible de récupérer une blague.");
    }
    return;
  }

  // ---------- setdungeonchannel & setrole (admin checks) ----------
  if (commandName === 'setdungeonchannel' || commandName === 'setrole' || commandName === 'setbdoupdatechannel' || commandName === 'settwitchrole') {
    if (!interaction.guild) {
      await interaction.reply({ content: "Cette commande ne peut être utilisée que dans un serveur.", ephemeral: true });
      return;
    }

    // require admin in current channel
    const member = interaction.member;
    if (!member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'Tu dois être admin pour faire ça.', ephemeral: true });
      return;
    }
  }

  if (commandName === 'setrole') {
    const role = interaction.options.getRole('role');
    config.atoraxxionRoleId = role.id;
    saveConfigs();
    await interaction.reply(`📌 Rôle Atoraxxion défini sur ${role.toString()}`);
    return;
  }

  if (commandName === 'setdungeonchannel') {
    const channel = interaction.options.getChannel('channel');
    config.dungeonChannelId = channel.id;
    saveConfigs();
    await interaction.reply(`📌 Channel donjon défini sur ${channel.toString()}`);
    return;
  }

  // ---------- postdungeons ----------
  if (commandName === 'postdungeons') {
    if (!config.dungeonChannelId) {
      await interaction.reply({ content: 'Le channel de donjon n\'est pas défini. Utilise /setdungeonchannel.', ephemeral: true });
      return;
    }
    const channel = await client.channels.fetch(config.dungeonChannelId).catch(() => null);
    if (!channel) {
      await interaction.reply({ content: 'Le channel configuré est introuvable ou inaccessible.', ephemeral: true });
      return;
    }

    const datetime = interaction.options.getString('datetime') || '';
    config.dungeonDatetime = datetime;
    const embed = buildDungeonEmbed(guildId, datetime);

    try {
      const msg = await channel.send({ embeds: [embed] });

      // Remise à zéro des réactions existantes
      reactionsByGuild[guildId] = {};

      // Ajouter réactions
      await msg.react('✅');
      await msg.react('❌');

      // Sauvegarder messageId
      config.dungeonMessageId = msg.id;
      saveConfigs();
      saveReactions();

      await interaction.reply({ content: `Donjons postés dans ${channel.toString()}`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'Erreur lors de l\'envoi du message.', ephemeral: true });
    }
    return;
  }

  // ---------- dungeonstatus ----------
  if (commandName === 'dungeonstatus') {
    const embed = buildDungeonEmbed(guildId);
    await interaction.reply({ embeds: [embed], ephemeral: false });
    return;
  }

  // ---------- clear ----------
  if (commandName === 'clear') {
    if (!interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'Tu dois avoir la permission de gérer les messages pour faire ça.', ephemeral: true });
      return;
    }
    const nombre = interaction.options.getInteger('nombre');
    if (nombre < 1 || nombre > 100) {
      await interaction.reply({ content: 'Tu peux supprimer entre 1 et 100 messages.', ephemeral: true });
      return;
    }
    try {
      await interaction.channel.bulkDelete(nombre, true);
      await interaction.reply({ content: `🧹 ${nombre} messages supprimés.`, ephemeral: true });
    } catch {
      await interaction.reply({ content: 'Impossible de supprimer les messages.', ephemeral: true });
    }
    return;
  }

  // ---------- setupdateschannel ----------
  if (commandName === 'setupdateschannel') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'Tu dois être admin pour faire ça.', ephemeral: true });
      return;
    }
    const channel = interaction.options.getChannel('channel');
    config.updatesChannelId = channel.id;
    saveConfigs();
    await interaction.reply(`📌 Channel mises à jour défini sur ${channel.toString()}`);
    return;
  }

  // ---------- TWITCH commands ----------
  if (commandName === 'settwitch') {
    const twitchName = interaction.options.getString('twitchname').toLowerCase();
    if (!twitchStreamersByGuild[guildId]) twitchStreamersByGuild[guildId] = [];
    if (!twitchStreamersByGuild[guildId].includes(twitchName)) {
      twitchStreamersByGuild[guildId].push(twitchName);
      saveTwitchData();
      await interaction.reply(`✅ Streamer **${twitchName}** ajouté.`);
    } else {
      await interaction.reply(`⚠️ Le streamer **${twitchName}** est déjà suivi.`);
    }
    return;
  }

  if (commandName === 'removetwitch') {
    const twitchName = interaction.options.getString('twitchname').toLowerCase();
    if (!twitchStreamersByGuild[guildId]) twitchStreamersByGuild[guildId] = [];
    const index = twitchStreamersByGuild[guildId].indexOf(twitchName);
    if (index !== -1) {
      twitchStreamersByGuild[guildId].splice(index, 1);
      saveTwitchData();
      await interaction.reply(`❌ Streamer **${twitchName}** retiré.`);
    } else {
      await interaction.reply(`⚠️ Le streamer **${twitchName}** n’est pas suivi.`);
    }
    return;
  }

  if (commandName === 'showtwitch') {
    const streamers = twitchStreamersByGuild[guildId] || [];
    if (streamers.length === 0) {
      await interaction.reply('📭 Aucun streamer suivi pour ce serveur.');
    } else {
      await interaction.reply(`📡 Streamers suivis :\n• ${streamers.join('\n• ')}`);
    }
    return;
  }

  if (commandName === 'settwitchrole') {
    const role = interaction.options.getRole('role');
    config.twitchRoleId = role.id;
    saveConfigs();
    await interaction.reply(`✅ Le rôle **${role.name}** sera mentionné lors des annonces Twitch.`);
    return;
  }

  // ---------- BDO updates commands ----------
  if (commandName === 'setbdoupdatechannel') {
    const channel = interaction.options.getChannel('channel');
    config.bdoUpdateChannelId = channel.id;
    saveConfigs();
    await interaction.reply({ content: `📌 Channel BDO updates défini sur ${channel.toString()}`, ephemeral: true });
    return;
  }

  if (commandName === 'showbdoupdatesconfig') {
    const channelId = config.bdoUpdateChannelId;
    await interaction.reply({ content: channelId ? `🔎 Channel BDO updates: <#${channelId}>` : 'Aucun channel BDO updates configuré.', ephemeral: true });
    return;
  }
});

// --- Gestion des réactions (add/remove) consolidated ---
async function handleReactionAddCommon(reaction, user) {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const config = getConfig(guildId);
  if (!config.dungeonMessageId) return;
  if (message.id !== config.dungeonMessageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  const reactionsData = getReactionsData(guildId);
  const usersData = getUsersData(guildId);

  reactionsData[user.id] = { canDoDungeons: emoji === '✅' };
  usersData.add(user.id);

  saveReactions();
  saveUsers();
  updateBotStatus(client);

  // Update embed
  try {
    const channel = await client.channels.fetch(config.dungeonChannelId);
    if (!channel) return;
    const msg = await channel.messages.fetch(config.dungeonMessageId);
    if (!msg) return;
    const embed = buildDungeonEmbed(guildId, config.dungeonDatetime || '');
    await msg.edit({ embeds: [embed] });
  } catch { /* silent */ }
}

client.on('messageReactionAdd', handleReactionAddCommon);

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const config = getConfig(guildId);
  if (!config.dungeonMessageId || message.id !== config.dungeonMessageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  const reactionsData = getReactionsData(guildId);

  delete reactionsData[user.id];

  saveReactions();
  updateBotStatus(client);

  try {
    const channel = await client.channels.fetch(config.dungeonChannelId);
    if (!channel) return;
    const msg = await channel.messages.fetch(config.dungeonMessageId);
    if (!msg) return;
    const embed = buildDungeonEmbed(guildId, config.dungeonDatetime || '');
    await msg.edit({ embeds: [embed] });
  } catch { /* silent */ }
});

// -----------------------------
// TWITCH : token, check & annonces
// -----------------------------
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
let twitchAccessToken = null;
let twitchTokenObtainedAt = 0;
const TOKEN_TTL_MS = 1000 * 60 * 50; // 50 minutes
let alreadyAnnounced = {}; // { guild_login: true }

async function fetchTwitchToken() {
  if (!TWITCH_CLIENT_ID || !TWITCH_SECRET) return;
  try {
    const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: { client_id: TWITCH_CLIENT_ID, client_secret: TWITCH_SECRET, grant_type: 'client_credentials' }
    });
    twitchAccessToken = res.data.access_token;
    twitchTokenObtainedAt = Date.now();
    console.log('✅ Token Twitch obtenu.');
  } catch (err) {
    console.error('Erreur obtention token Twitch:', err.response?.data || err.message);
  }
}

async function isStreamerLive(login) {
  if (!twitchAccessToken) return null;
  try {
    const res = await axios.get('https://api.twitch.tv/helix/streams', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${twitchAccessToken}`
      },
      params: { user_login: login }
    });
    return (res.data.data && res.data.data.length > 0) ? res.data.data[0] : null;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      twitchAccessToken = null;
      console.warn('Twitch token invalide, on renouvellera.');
    }
    console.error(`Erreur Twitch (${login}) :`, err.response?.data || err.message);
    return null;
  }
}

async function checkLiveStreams() {
  if (!TWITCH_CLIENT_ID || !TWITCH_SECRET) return;
  if (!twitchAccessToken || (Date.now() - twitchTokenObtainedAt) > TOKEN_TTL_MS) {
    await fetchTwitchToken();
  }
  if (!twitchAccessToken) return;

  for (const guildId in twitchStreamersByGuild) {
    const streamers = twitchStreamersByGuild[guildId];
    if (!Array.isArray(streamers) || streamers.length === 0) continue;

    const conf = getConfig(guildId);
    const channelId = conf.updatesChannelId;
    if (!channelId) continue;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) continue;

    for (const login of streamers) {
      const data = await isStreamerLive(login);
      const key = `${guildId}_${login}`;
      if (data && !alreadyAnnounced[key]) {
        const url = `https://twitch.tv/${login}`;
        const title = data.title || 'Live en cours';
        const game = data.game_name || 'Jeu inconnu';
        const thumbnail = (data.thumbnail_url || '').replace('{width}', '640').replace('{height}', '360');

        let mentionText = '';
        if (conf.twitchRoleId) mentionText = `<@&${conf.twitchRoleId}> `;

        const embed = new EmbedBuilder()
          .setTitle(`${data.user_name} est en live !`)
          .setURL(url)
          .setDescription(`🎮 **${game}**\n📝 ${title}`)
          .setImage(thumbnail || undefined)
          .setColor(0x9146FF)
          .setTimestamp();

        try {
          await channel.send({ content: `${mentionText}🔴 **${data.user_name}** est en live : ${url}`, embeds: [embed] });
          alreadyAnnounced[key] = true;
        } catch (err) {
          console.error('Erreur envoi annonce Twitch:', err.message || err);
        }
      } else if (!data && alreadyAnnounced[key]) {
        delete alreadyAnnounced[key];
      }
    }
  }
}

// -----------------------------
// BDO Patch Notes (FR) — checks hourly
// -----------------------------
// We'll scrape the official EU/FR news page and detect entries containing "mise à jour" or "notes de mise à jour"
// Source used: https://www.eu.playblackdesert.com/fr-FR/News/Notice
const BDO_NEWS_LIST_URL = 'https://www.eu.playblackdesert.com/fr-FR/News/Notice';

async function fetchBDONewsListHtml() {
  try {
    const res = await axios.get(BDO_NEWS_LIST_URL, { timeout: 10000, headers: { 'User-Agent': 'BDO-Discord-Bot' }});
    return res.data;
  } catch (e) {
    console.error('Erreur fetch BDO news list:', e.message || e);
    return null;
  }
}

// Heuristic to find relevant links on the page
function extractBDONewsCandidates(html) {
  const $ = cheerio.load(html);
  const results = [];
  // Try to find anchors that link to Notice detail pages
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (!href || !text) return;
    // common pattern contains '/fr-FR/News/Notice' or '/News/Notice/Detail'
    if (/\/News\/Notice/i.test(href) || /\/Notice\/Detail/i.test(href)) {
      const full = href.startsWith('http') ? href : ('https://www.eu.playblackdesert.com' + href);
      results.push({ title: text, url: full });
    }
  });
  // Deduplicate by url
  const uniq = [];
  const seen = new Set();
  for (const r of results) {
    if (!seen.has(r.url)) { seen.add(r.url); uniq.push(r); }
  }
  return uniq;
}

// Determine if a title is a patch note (French)
function isBDOUpdateTitle(title) {
  if (!title) return false;
  return /mise à jour|notes de mise à jour|note de mise à jour|patch/i.test(title.toLowerCase());
}

// Fetch the article detail page and extract a short excerpt and date
async function fetchBDOArticleDetail(url) {
  try {
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'BDO-Discord-Bot' }});
    const $ = cheerio.load(res.data);
    // Try to extract date and first paragraph
    let date = $('time').first().text().trim() || $('.date, .board-date').first().text().trim();
    if (!date) {
      // fallback: try meta
      date = $('meta[property="article:published_time"]').attr('content') || '';
    }
    let excerpt = $('article p').first().text().trim() || $('div.content p').first().text().trim() || '';
    if (!excerpt) {
      // fallback: first 200 chars of body text
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      excerpt = text.slice(0, 250);
    }
    return { date: date || '', excerpt: excerpt || '' };
  } catch (e) {
    console.error('Erreur fetch article detail:', e.message || e);
    return { date: '', excerpt: '' };
  }
}

async function checkBDOUpdates() {
  console.log('🔎 Vérification BDO Patch Notes (FR)...');
  const html = await fetchBDONewsListHtml();
  if (!html) return;

  const candidates = extractBDONewsCandidates(html);
  if (!candidates || candidates.length === 0) return;

  // We'll only consider entries whose title matches our heuristic (French patch notes)
  const updates = candidates.filter(c => isBDOUpdateTitle(c.title));

  if (updates.length === 0) {
    console.log('Aucun patch note FR détecté dans la page.');
    return;
  }

  // bdoSeen.seen is global list of urls already posted
  if (!bdoSeen.seen) bdoSeen.seen = [];

  // For each update, if not seen, fetch detail and post to all guilds that configured channel
  for (const upd of updates) {
    if (bdoSeen.seen.includes(upd.url)) continue; // already posted
    // fetch detail
    const detail = await fetchBDOArticleDetail(upd.url);
    const title = upd.title;
    const date = detail.date;
    const excerpt = detail.excerpt;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(upd.url)
      .setDescription(excerpt ? (excerpt.length > 700 ? excerpt.slice(0,700) + '...' : excerpt) : 'Voir l\'article complet.')
      .addFields(
        { name: 'Source', value: 'Black Desert Online — EU/FR', inline: true },
        { name: 'Date', value: date || 'Non spécifiée', inline: true }
      )
      .setColor(0x00A6FF)
      .setTimestamp();

    // Send to every guild that configured bdoUpdateChannelId
    for (const guildId in configsByGuild) {
      const conf = getConfig(guildId);
      const channelId = conf.bdoUpdateChannelId;
      if (!channelId) continue;
      try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) continue;
        await channel.send({ content: `🛠️ **Nouvelle mise à jour BDO (FR)** — ${title}\n${upd.url}`, embeds: [embed] });
      } catch (e) {
        console.error('Erreur envoi BDO update:', e.message || e);
      }
    }

    // Mark seen (global), save immediately
    bdoSeen.seen.push(upd.url);
    saveBDOSeen();
    console.log('Publié patch note:', title);
  }
}

// --- Connexion ---
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Erreur login Discord:', err);
});

