const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ path: './token.env' });

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
    .setName('setroleauto')
    .setDescription('Ajoute un rôle automatiquement via une réaction')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Le rôle à attribuer automatiquement')
        .setRequired(true)
    ),

  // Commandes Twitch
  new SlashCommandBuilder()
    .setName('settwitchchannel')
    .setDescription('Définit le salon pour les notifications Twitch')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Salon pour notifications Twitch')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('checktwitchlive')
    .setDescription('Vérifie si le stream Twitch est en live'),

  // Commande manuelle de mise à jour BDO
  new SlashCommandBuilder()
    .setName('updatebdo')
    .setDescription('Publie une mise à jour BDO dans le salon dédié')
    .addStringOption(option =>
      option.setName('texte')
        .setDescription('Texte de la mise à jour')
        .setRequired(true)
    ),
].map(command => command.toJSON());

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
