🎮 BDO Dungeon Bot Discord
Un bot Discord dédié à Black Desert Online (BDO) pour gérer facilement la disponibilité des membres lors des donjons Atoraxxion via des réactions, avec gestion avancée des annonces Twitch et des mises à jour BDO.

Link : https://discord.com/oauth2/authorize?client_id=1398760543732502538&scope=bot%20applications.commands&permissions=8

✨ Fonctionnalités principales
⚙️ Configurer le channel donjon avec /setdungeonchannel #channel (administrateurs uniquement)

📘 Poster un tableau interactif des donjons via /postdungeons [datetime] dans le channel configuré
(optionnel : ajouter une date et heure au format YYYY-MM-DD HH:mm, ex : 2025-07-28 20:00)

✅❌ Réactions pour indiquer la disponibilité des membres aux donjons

📋 Afficher le statut global des joueurs avec /dungeonstatus

😂 Blagues aléatoires grâce à /joke via une API externe

🧹 Nettoyage rapide de messages avec /clear <nombre>

🎮 Gestion des streamers Twitch :

Ajouter un streamer à surveiller avec /settwitch <twitchname>

Retirer un streamer suivi avec /removetwitch <twitchname>

Lister tous les streamers suivis avec /showtwitch

Définir le rôle à mentionner lors des annonces Twitch avec /settwitchrole @role

📢 Gestion des mises à jour BDO :

Configurer le salon pour les patch notes avec /setbdoupdatechannel #channel

Afficher la configuration actuelle des mises à jour avec /showbdoupdatesconfig

💾 Sauvegarde automatique des configurations et réactions dans des fichiers JSON

🏰 Donjons supportés :

Donjon	Gear Score minimum requis
Atoraxxion: Vahmalkea	250
Atoraxxion: Sycrakea	260
Atoraxxion: Yolunakea	270
Atoraxxion: Orzekea	280

🚀 Installation
Clonez le dépôt :

bash
Copier
Modifier
git clone <URL_DETON_REPO>
cd <NOM_DU_REPO>
Installez les dépendances :

bash
Copier
Modifier
npm install
Créez un fichier .env (ou token.env) à la racine du projet et ajoutez vos tokens et IDs Discord :

env
Copier
Modifier
DISCORD_TOKEN=ton_token_discord_ici
CLIENT_ID=ton_client_id_discord_ici
Lancez le bot :

bash
Copier
Modifier
node bot.js
📜 Commandes disponibles
Commande	Description
/setdungeonchannel	Configure le channel des donjons (admin uniquement)
/postdungeons	Publie le tableau des donjons dans le channel configuré (optionnel: ajoute date/heure)
/dungeonstatus	Affiche la liste des membres disponibles / indisponibles
/joke	Envoie une blague aléatoire
/clear	Supprime un nombre donné de messages
/settwitch	Ajoute un streamer Twitch à surveiller
/removetwitch	Supprime un streamer Twitch suivi
/showtwitch	Liste tous les streamers suivis
/settwitchrole	Définit le rôle à mentionner lors des annonces Twitch
/setbdoupdatechannel	Définit le salon pour les patch notes BDO (FR)
/showbdoupdatesconfig	Affiche la configuration des mises à jour BDO
/setrole	Définit le rôle Atoraxxion à pinger dans l’embed donjons

💡 Utilisation
Configurez le channel dédié aux donjons :

bash
Copier
Modifier
/setdungeonchannel #nom-du-channel
Postez le tableau des donjons dans ce channel (avec ou sans date/heure) :

bash
Copier
Modifier
/postdungeons
/postdungeons 2025-07-28 20:00
Les membres réagissent avec ✅ (disponible) ou ❌ (indisponible).

Consultez la disponibilité globale avec :

bash
Copier
Modifier
/dungeonstatus
Ajoutez un peu d’humour avec :

bash
Copier
Modifier
/joke
Gérez les streamers Twitch à surveiller :

bash
Copier
Modifier
/settwitch nom_du_streamer
/removetwitch nom_du_streamer
/showtwitch
/settwitchrole @role
Configurez les annonces des patch notes BDO :

bash
Copier
Modifier
/setbdoupdatechannel #channel
/showbdoupdatesconfig
Nettoyez les messages si besoin :

bash
Copier
Modifier
/clear 10
📂 Fichiers importants
bot.js — script principal du bot

config.json — sauvegarde la configuration (channels, rôles, messages, etc.)

reactionsData.json — stockage des réactions utilisateur

🤝 Contributions
Les contributions sont les bienvenues !
N’hésitez pas à proposer des améliorations via pull requests.

📄 Licence
© 2025 Hiuras — Tous droits réservés.
