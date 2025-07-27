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
//require('dotenv').config({ path: './token.env' });//

// --- Chemins fichiers ---
const configPath = path.resolve(__dirname, 'config.json');
const reactionsFile = path.resolve(__dirname, 'reactionsData.json');
const usersFile = path.resolve(__dirname, 'users.json');

// --- Données en mémoire ---
let configsByGuild = {};
let reactionsByGuild = {};
let usersByGuild = {};

// --- Chargement initial des fichiers ---
function loadJSON(filePath, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch {
    return defaultValue;
  }
}

configsByGuild = loadJSON(configPath, {});
reactionsByGuild = loadJSON(reactionsFile, {});
const rawUsers = loadJSON(usersFile, {});

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

// --- Mise à jour du statut du bot par nombre total d'utilisateurs (sur tous les serveurs) ---
function updateBotStatus(client) {
  let totalUsers = 0;
  for (const guildId in usersByGuild) {
    totalUsers += usersByGuild[guildId].size;
  }
  client.user.setPresence({
    activities: [{
      name: `${totalUsers} utilisateurs 🧙`,
      type: 3 // "Écoute"
    }],
    status: 'online'
  });
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

  const rolePing = `<@&1275693513085943862>`; // Remplace par le vrai rôle Atoraxion sur ton serveur

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
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  updateBotStatus(client);
});

// --- Commandes slash ---
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
    )
].map(cmd => cmd.toJSON());

// --- Déploiement commandes ---
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
  }
  else if (commandName === 'setdungeonchannel') {
  if (!interaction.guild) {
    await interaction.reply({ content: "Cette commande ne peut être utilisée que dans un serveur.", ephemeral: true });
    return;
  }

  const member = interaction.member;
  if (!member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'Tu dois être admin pour faire ça.', ephemeral: true });
    return;
  }

  const channel = interaction.options.getChannel('channel');
  config.dungeonChannelId = channel.id;
  saveConfigs();
  await interaction.reply(`📌 Channel donjon défini sur ${channel.toString()}`);
}
  else if (commandName === 'postdungeons') {
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
  }
  else if (commandName === 'dungeonstatus') {
    const embed = buildDungeonEmbed(guildId);
    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
  else if (commandName === 'clear') {
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
  }
  else if (commandName === 'setupdateschannel') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'Tu dois être admin pour faire ça.', ephemeral: true });
      return;
    }
    const channel = interaction.options.getChannel('channel');
    config.updatesChannelId = channel.id;
    saveConfigs();
    await interaction.reply(`📌 Channel mises à jour défini sur ${channel.toString()}`);
  }
});

// --- Gestion des réactions ---
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
        // Ajouter utilisateur à la liste globale users
usersData.add(interaction.user.id);
saveUsers();
updateBotStatus(client);
    }
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

  // Ajout ou mise à jour du statut utilisateur
  reactionsData[user.id] = { canDoDungeons: emoji === '✅' };
  usersData.add(user.id);

  saveReactions();
  saveUsers();
  updateBotStatus(client);

  // Mettre à jour l'embed
  try {
    const channel = await client.channels.fetch(config.dungeonChannelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(config.dungeonMessageId);
    if (!msg) return;

    const embed = buildDungeonEmbed(guildId);
    await msg.edit({ embeds: [embed] });
  } catch {
    // Ne rien faire en cas d'erreur
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const config = getConfig(guildId);
  if (!config.dungeonMessageId || message.id !== config.dungeonMessageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  const reactionsData = getReactionsData(guildId);
  const usersData = getUsersData(guildId);

  // Ajout ou mise à jour du statut utilisateur
  reactionsData[user.id] = { canDoDungeons: emoji === '✅' };
  usersData.add(user.id);

  saveReactions();
  saveUsers();
  updateBotStatus(client);

  // Mettre à jour l'embed avec la date mémorisée
  try {
    const channel = await client.channels.fetch(config.dungeonChannelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(config.dungeonMessageId);
    if (!msg) return;

    const embed = buildDungeonEmbed(guildId, config.dungeonDatetime || '');
    await msg.edit({ embeds: [embed] });
  } catch {
    // Silencieux
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const config = getConfig(guildId);
  if (!config.dungeonMessageId || message.id !== config.dungeonMessageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  const reactionsData = getReactionsData(guildId);

  // Suppression de la donnée utilisateur
  delete reactionsData[user.id];

  saveReactions();
  updateBotStatus(client);

  // Mettre à jour l'embed avec la date mémorisée
  try {
    const channel = await client.channels.fetch(config.dungeonChannelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(config.dungeonMessageId);
    if (!msg) return;

    const embed = buildDungeonEmbed(guildId, config.dungeonDatetime || '');
    await msg.edit({ embeds: [embed] });
  } catch {
    // Silencieux
  }
});

// --- Connexion ---
client.login(process.env.DISCORD_TOKEN);
const token = process.env.DISCORD_TOKEN;