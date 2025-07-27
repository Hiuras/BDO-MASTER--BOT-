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
require('dotenv').config({ path: './token.env' });

// Chargement config + réactions
const configPath = path.resolve(__dirname, 'config.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath));
} catch {
  config = {};
}

const reactionsFile = path.resolve(__dirname, 'reactionsData.json');
let reactionsData = {};
try {
  reactionsData = JSON.parse(fs.readFileSync(reactionsFile));
} catch {
  reactionsData = {};
}
function saveReactions() {
  fs.writeFileSync(reactionsFile, JSON.stringify(reactionsData, null, 2));
}

const dungeons = [
  { name: 'Atoraxxion: Vahmalkea', minGS: 250 },
  { name: 'Atoraxxion: Sycrakea', minGS: 260 },
  { name: 'Atoraxxion: Yolunakea', minGS: 270 },
  { name: "Atoraxxion: Erethea's Limbo", minGS: 280 }
];

// Initialisation du client Discord
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
});

// Définition des commandes slash à déployer
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
    .setDescription('Raconte une blague')
].map(cmd => cmd.toJSON());

// Déploiement des commandes slash
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

// Fonction pour construire l'embed des donjons avec participants
function buildDungeonEmbed(datetime = '') {
  const canUsers = [];
  const cantUsers = [];

  for (const userId in reactionsData) {
    const entry = reactionsData[userId];
    if (entry.canDoDungeons === true) canUsers.push(`<@${userId}>`);
    else if (entry.canDoDungeons === false) cantUsers.push(`<@${userId}>`);
  }

  let participantsText = '';
  if (canUsers.length > 0) participantsText += `✅ Peuvent faire (${canUsers.length}) :\n${canUsers.join(', ')}\n\n`;
  if (cantUsers.length > 0) participantsText += `❌ Ne peuvent pas faire (${cantUsers.length}) :\n${cantUsers.join(', ')}\n\n`;

  const baseDescription = dungeons.map((d, i) => `${i + 1}. ${d.name} (Min GS: ${d.minGS})`).join('\n');
  const fullDescription = `@Atoraxxion\n${baseDescription}` + (datetime ? `\n\n🕒 Date/Heure : ${datetime}` : '');

  return new EmbedBuilder()
    .setTitle('📘 Tableau des Donjons - Réagis avec ✅ ou ❌')
    .setDescription(fullDescription + (participantsText ? `\n**Participants :**\n${participantsText}` : ''))
    .setColor('#0099ff')
    .setFooter({ text: 'Réagis pour indiquer ta dispo' });
}

// Interaction / Commandes
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'joke') {
    const url = "https://blague-api.vercel.app/api?mode=global";
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const data = response.data;
      const blague = data.blagues || data.blague || data.setup || "Pas de blague dispo.";
      const reponse = data.reponses || data.reponse || data.punchline || "";
      await interaction.reply(`${blague}\n${reponse}`);
    } catch {
      await interaction.reply("Impossible de récupérer une blague.");
    }
  }
  else if (commandName === 'setdungeonchannel') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'Tu dois être admin pour faire ça.', ephemeral: true });
      return;
    }
    const channel = interaction.options.getChannel('channel');
    config.dungeonChannelId = channel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await interaction.reply(`📌 Channel donjon défini sur : ${channel}`);
  }
  else if (commandName === 'postdungeons') {
    if (!config.dungeonChannelId) {
      await interaction.reply({ content: 'Aucun channel donjon configuré. Utilise /setdungeonchannel.', ephemeral: true });
      return;
    }
    const channel = client.channels.cache.get(config.dungeonChannelId);
    if (!channel) {
      await interaction.reply({ content: 'Le channel configuré est introuvable.', ephemeral: true });
      return;
    }
    const datetime = interaction.options.getString('datetime') || '';

    // Clear reactionsData à chaque nouveau post pour repartir à zéro
    reactionsData = {};
    saveReactions();

    const embed = buildDungeonEmbed(datetime);
    const dungeonMessage = await channel.send({ embeds: [embed] });
    await dungeonMessage.react('✅');
    await dungeonMessage.react('❌');

    config.dungeonMessageId = dungeonMessage.id;
    config.dungeonDateTime = datetime;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    await interaction.reply({ content: 'Tableau des donjons posté !', ephemeral: true });
  }
  else if (commandName === 'dungeonstatus') {
    const canUsers = [];
    const cantUsers = [];

    for (const userId in reactionsData) {
      const entry = reactionsData[userId];
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const displayName = member ? member.displayName : `Utilisateur inconnu (${userId})`;

      if (entry.canDoDungeons === true) {
        canUsers.push(`- ${displayName}`);
      } else if (entry.canDoDungeons === false) {
        cantUsers.push(`- ${displayName}`);
      }
    }

    const maxCan = canUsers.slice(0, 5);
    const statusMessage =
      `📋 **Statut des donjons**\n\n` +
      `✅ Peuvent faire (${maxCan.length}) :\n${maxCan.join('\n') || 'Aucun'}\n\n` +
      `❌ Ne peuvent pas faire (${cantUsers.length}) :\n${cantUsers.join('\n') || 'Aucun'}`;

    await interaction.reply(statusMessage);
  }
  else if (commandName === 'clear') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: '❌ Tu n\'as pas la permission d\'utiliser cette commande.', ephemeral: true });
      return;
    }
    const amount = interaction.options.getInteger('nombre');
    if (amount < 1 || amount > 100) {
      await interaction.reply({ content: '⚠️ Utilisation : `/clear nombre` entre 1 et 100', ephemeral: true });
      return;
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `🗑️ ${deleted.size} messages supprimés !`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Erreur lors de la suppression des messages.', ephemeral: true });
    }
  }
});

// Événements de réaction pour mise à jour dynamique

async function updateDungeonEmbed(message) {
  try {
    const datetime = config.dungeonDateTime || '';
    const newEmbed = buildDungeonEmbed(datetime);
    await message.edit({ embeds: [newEmbed] });
  } catch (error) {
    console.error('Erreur mise à jour embed :', error);
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  if (reaction.message.id !== config.dungeonMessageId) return;

  if (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') {
    // Stocke uniquement la dernière réaction valide de l'utilisateur
    reactionsData[user.id] = { canDoDungeons: reaction.emoji.name === '✅' };
    saveReactions();

    // Supprimer l'autre réaction si elle existe pour éviter les doublons
    const otherEmoji = reaction.emoji.name === '✅' ? '❌' : '✅';
    const userReactions = reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id) && r.emoji.name === otherEmoji);
    for (const r of userReactions.values()) {
      try {
        await r.users.remove(user.id);
      } catch {}
    }

    await updateDungeonEmbed(reaction.message);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  if (reaction.message.id !== config.dungeonMessageId) return;

  if (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') {
    // Retirer la donnée de cet utilisateur si il n'a plus de réaction valide
    const msg = reaction.message;
    // Vérifier s'il a encore une réaction valide
    const stillHasValidReaction = msg.reactions.cache.some(r => 
      (r.emoji.name === '✅' || r.emoji.name === '❌') && r.users.cache.has(user.id)
    );
    if (!stillHasValidReaction) {
      delete reactionsData[user.id];
      saveReactions();
      await updateDungeonEmbed(msg);
    }
  }
});

// Connexion
client.login(process.env.DISCORD_TOKEN);
