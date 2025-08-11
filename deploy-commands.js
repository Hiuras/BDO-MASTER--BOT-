// deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ path: './token.env' });

// Définition des commandes
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

  // --- COMMANDES TWITCH ---
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

  // --- BDO UPDATES ---
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
]
.map(cmd => cmd.toJSON());

// Création client REST
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Déploiement des commandes slash sur le serveur de test...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commandes déployées avec succès !');
  } catch (error) {
    console.error('❌ Erreur de déploiement :', error);
  }
})();
