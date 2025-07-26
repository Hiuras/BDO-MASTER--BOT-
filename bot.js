const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: './token.env' });

// Donjons BDO
const dungeons = [
  { name: 'Atoraxxion: Vahmalkea', minGS: 250 },
  { name: 'Atoraxxion: Sycrakea', minGS: 260 },
  { name: 'Atoraxxion: Yolunakea', minGS: 270 },
  { name: "Atoraxxion: Erethea's Limbo", minGS: 280 }
];

// Config du bot
let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json')));
} catch {
  config = {};
}

// Stockage des réactions
const reactionsFile = path.resolve(__dirname, 'reactionsData.json');
let reactionsData = {};
try {
  reactionsData = JSON.parse(fs.readFileSync(reactionsFile));
} catch {
  reactionsData = {};
}
const saveReactions = () => {
  fs.writeFileSync(reactionsFile, JSON.stringify(reactionsData, null, 2));
};

// Création du bot
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

// Commandes texte
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // /setdungeonchannel #channel
  if (message.content.startsWith('/setdungeonchannel')) {
    if (!message.member.permissions.has('Administrator')) {
      message.reply('Tu dois être admin pour faire ça.');
      return;
    }
    const channelMention = message.mentions.channels.first();
    if (!channelMention) {
      message.reply('Mentionne un channel valide, ex: /setdungeonchannel #previs');
      return;
    }
    config.dungeonChannelId = channelMention.id;
    fs.writeFileSync(path.resolve(__dirname, 'config.json'), JSON.stringify(config, null, 2));
    message.reply(`Channel donjon configuré sur : ${channelMention}`);
    return;
  }

  // /postdungeons
  if (message.content === '/postdungeons') {
    if (!config.dungeonChannelId) {
      message.reply('Aucun channel donjon configuré. Utilise /setdungeonchannel');
      return;
    }
    if (message.channel.id !== config.dungeonChannelId) {
      message.reply(`Cette commande doit être utilisée dans le channel configuré : <#${config.dungeonChannelId}>`);
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('📘 Tableau des Donjons - Réagis avec ✅ ou ❌')
      .setDescription(
        '@Atoraxxion\n' +
        dungeons.map((d, i) => `${i + 1}. ${d.name} (Min GS: ${d.minGS})`).join('\n')
      )
      .setColor('#0099ff')
      .setFooter({ text: 'Réagis aux donjons pour indiquer ta disponibilité' });

    const dungeonMessage = await message.channel.send({ embeds: [embed] });
    await dungeonMessage.react('✅');
    await dungeonMessage.react('❌');

    config.dungeonMessageId = dungeonMessage.id;
    fs.writeFileSync(path.resolve(__dirname, 'config.json'), JSON.stringify(config, null, 2));
    return;
  }

  // /dungeonstatus
    if (message.content === '/dungeonstatus') {
    const canUsers = [];
    const cantUsers = [];

    for (const userId in reactionsData) {
      const entry = reactionsData[userId];
      const member = await message.guild.members.fetch(userId).catch(() => null);
      const displayName = member ? member.displayName : `Utilisateur inconnu (${userId})`;

      if (entry.canDoDungeons === true) {
        canUsers.push(`- ${displayName}`);
      } else if (entry.canDoDungeons === false) {
        cantUsers.push(`- ${displayName}`);
      }
    }

    const statusMessage =
      `📋 **Statut des donjons**\n\n` +
      `✅ Peuvent faire (${canUsers.length}) :\n${canUsers.join('\n') || 'Aucun'}\n\n` +
      `❌ Ne peuvent pas faire (${cantUsers.length}) :\n${cantUsers.join('\n') || 'Aucun'}`;

    message.reply(statusMessage);
    return;
  }

  // /joke
  if (message.content === '/joke') {
    const url = "https://blague-api.vercel.app/api?mode=global";
    try {
      const response = await axios.get(url);
      const data = response.data;
      const blague = data.blagues || data.blague || data.setup;
      const reponse = data.reponses || data.reponse || data.punchline;
      message.reply(`${blague}\n${reponse}`);
    } catch (error) {
      message.reply("Impossible de récupérer une blague pour le moment.");
    }
    return;
  }
});

// Gestion des réactions ajoutées
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Erreur fetch réaction:', error);
      return;
    }
  }

  if (!config.dungeonChannelId || !config.dungeonMessageId) return;
  if (reaction.message.channel.id !== config.dungeonChannelId) return;
  if (reaction.message.id !== config.dungeonMessageId) return;

  if (!['✅', '❌'].includes(reaction.emoji.name)) return;

  reactionsData[user.id] = reactionsData[user.id] || {};
  reactionsData[user.id].canDoDungeons = reaction.emoji.name === '✅';
  saveReactions();

  console.log(`🟢 ${user.tag} a répondu ${reaction.emoji.name === '✅' ? 'CAN' : "CAN'T"}`);
});

// Gestion des réactions retirées
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Erreur fetch réaction:', error);
      return;
    }
  }

  if (!config.dungeonChannelId || !config.dungeonMessageId) return;
  if (reaction.message.channel.id !== config.dungeonChannelId) return;
  if (reaction.message.id !== config.dungeonMessageId) return;

  if (!['✅', '❌'].includes(reaction.emoji.name)) return;

  if (reactionsData[user.id]) {
    delete reactionsData[user.id].canDoDungeons;
    saveReactions();
    console.log(`🔴 ${user.tag} a retiré sa réaction.`);
  }
});

// Connexion
client.login(process.env.DISCORD_TOKEN);
