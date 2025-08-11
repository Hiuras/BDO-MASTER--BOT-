🎮 BDO Dungeon Bot Discord
Un bot Discord dédié à Black Desert Online (BDO) pour gérer facilement la disponibilité des membres lors des donjons Atoraxxion via des réactions, avec gestion avancée des annonces Twitch et des mises à jour BDO.

🔗 Lien d'invitation :
https://discord.com/oauth2/authorize?client_id=1398760543732502538&scope=bot%20applications.commands&permissions=8

✨ Fonctionnalités principales
⚙️ Configurer le channel donjon avec /setdungeonchannel #channel (admin uniquement)

📘 Poster un tableau interactif des donjons via /postdungeons [datetime] dans le channel configuré
(optionnel : date et heure au format YYYY-MM-DD HH:mm, ex : 2025-07-28 20:00)

✅❌ Réactions pour indiquer la disponibilité des membres aux donjons

📋 Afficher le statut global des joueurs avec /dungeonstatus

😂 Blagues aléatoires avec /joke (via une API externe)

🧹 Nettoyage rapide de messages avec /clear <nombre>

🎮 Gestion des streamers Twitch :

/settwitch <twitchname> — Ajouter un streamer à surveiller

/removetwitch <twitchname> — Supprimer un streamer suivi

/showtwitch — Lister tous les streamers suivis

/settwitchrole @role — Définir le rôle à mentionner lors des annonces Twitch

📢 Gestion des mises à jour BDO :

/setbdoupdatechannel #channel — Configurer le salon des patch notes BDO

/showbdoupdatesconfig — Afficher la configuration des mises à jour

💾 Sauvegarde automatique des configurations et réactions dans des fichiers JSON

🏰 Donjons supportés & Gear Score requis
Donjon	Gear Score minimum requis
Atoraxxion: Vahmalkea	250
Atoraxxion: Sycrakea	260
Atoraxxion: Yolunakea	270
Atoraxxion: Orzekea	280

🚀 Installation rapide
bash
Copier
Modifier
git clone <URL_DETON_REPO>
cd <NOM_DU_REPO>
npm install
Crée un fichier .env (ou token.env) à la racine avec :

env
Copier
Modifier
DISCORD_TOKEN=ton_token_discord_ici
CLIENT_ID=ton_client_id_discord_ici
Lance le bot :

bash
Copier
Modifier
node bot.js
📜 Commandes disponibles
Commande	Description
/setdungeonchannel	Configure le channel des donjons (admin uniquement)
/postdungeons	Publie le tableau des donjons (optionnel : ajoute date/heure)
/dungeonstatus	Affiche la liste des membres disponibles/indisponibles
/joke	Envoie une blague aléatoire
/clear	Supprime un nombre donné de messages
/settwitch	Ajoute un streamer Twitch à surveiller
/removetwitch	Supprime un streamer Twitch suivi
/showtwitch	Liste tous les streamers suivis
/settwitchrole	Définit le rôle à mentionner lors des annonces Twitch
/setbdoupdatechannel	Définit le salon pour les patch notes BDO
/showbdoupdatesconfig	Affiche la configuration des mises à jour BDO
/setrole	Définit le rôle Atoraxxion à pinger dans l’embed donjons

💡 Guide d’utilisation
Configurer le channel dédié aux donjons :
/setdungeonchannel #nom-du-channel

Poster le tableau des donjons (avec ou sans date/heure) :
/postdungeons
/postdungeons 2025-07-28 20:00

Les membres réagissent avec ✅ (disponible) ou ❌ (indisponible).

Consulter la disponibilité globale :
/dungeonstatus

Ajouter un peu d’humour :
/joke

Gérer les streamers Twitch :
/settwitch nom_du_streamer
/removetwitch nom_du_streamer
/showtwitch
/settwitchrole @role

Configurer les annonces patch notes BDO :
/setbdoupdatechannel #channel
/showbdoupdatesconfig

Nettoyer les messages (modération) :
/clear <nombre>

📂 Fichiers importants
bot.js — Script principal

config.json — Configuration (channels, rôles, messages…)

reactionsData.json — Stockage des réactions utilisateur

🤝 Contributions
Les contributions sont les bienvenues !
N’hésitez pas à proposer des améliorations via pull requests.

📄 Licence
© 2025 Hiuras — Tous droits réservés.
