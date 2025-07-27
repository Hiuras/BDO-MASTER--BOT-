
# 🎮 BDO Dungeon Bot Discord

Un bot Discord dédié à Black Desert Online (BDO) pour gérer facilement la disponibilité des membres lors des donjons Atoraxxion via des réactions.

Link : https://discord.com/oauth2/authorize?client_id=1398760543732502538&scope=bot%20applications.commands&permissions=8

---

## ✨ Fonctionnalités principales

- ⚙️ Configurer le channel donjon avec `/setdungeonchannel #channel` (administrateurs uniquement)  
- 📘 Poster un tableau interactif des donjons via `/postdungeons [datetime]` dans le channel configuré  
  (optionnel : ajouter une date et heure au format `YYYY-MM-DD HH:mm`, ex : `2025-07-28 20:00`)  
- ✅❌ Réactions pour indiquer la disponibilité des membres aux donjons  
- 📋 Afficher le statut global des joueurs avec `/dungeonstatus`  
- 😂 Blagues aléatoires grâce à `/joke` via une API externe  
- 💾 Sauvegarde automatique des réactions dans `reactionsData.json`  
- 🏰 Donjons supportés :

| Donjon                      | Gear Score minimum requis |
|-----------------------------|---------------------------|
| Atoraxxion: Vahmalkea       | 250                       |
| Atoraxxion: Sycrakea        | 260                       |
| Atoraxxion: Yolunakea       | 270                       |
| Atoraxxion: Orzekea         | 280                       |

---

## 🚀 Installation

Clonez le dépôt :

```bash
git clone <URL_DETON_REPO>
cd <NOM_DU_REPO>
```

Installez les dépendances :

```bash
npm install
```

Créez un fichier `.env` (ou `token.env`) à la racine du projet et ajoutez votre token Discord :

```env
DISCORD_TOKEN=ton_token_discord_ici
CLIENT_ID=ton_client_id_discord_ici
```

Lancez le bot :

```bash
node bot.js
```

---

## 📜 Commandes disponibles

| Commande             | Description                                            |
|---------------------|--------------------------------------------------------|
| `/setdungeonchannel` | Configure le channel des donjons (administrateurs uniquement) |
| `/postdungeons`      | Publie le tableau des donjons dans le channel configuré (optionnel: ajoute date/heure) |
| `/dungeonstatus`     | Affiche la liste des membres disponibles / indisponibles |
| `/joke`              | Envoie une blague aléatoire pour détendre l’atmosphère |
| `/clear`             | Supprime un nombre donné de messages (gestion des permissions requises) |

---

## 💡 Utilisation

Configurez le channel dédié aux donjons :

```bash
/setdungeonchannel #nom-du-channel
```

Postez le tableau des donjons dans ce channel (avec ou sans date/heure) :

```bash
/postdungeons
/postdungeons 2025-07-28 20:00
```

Les membres réagissent avec ✅ (disponible) ou ❌ (indisponible).

Consultez la disponibilité globale avec :

```bash
/dungeonstatus
```

Ajoutez un peu d’humour avec :

```bash
/joke
```

---

## 📂 Fichiers importants

- `bot.js` — script principal du bot  
- `config.json` — sauvegarde la configuration (channel, message, date/heure)  
- `reactionsData.json` — stockage des réactions utilisateur  

---

## 🤝 Contributions

Les contributions sont les bienvenues !  
N’hésitez pas à proposer des améliorations via pull requests.

---

## 📄 Licence

© 2025 Hiuras — Tous droits réservés.
