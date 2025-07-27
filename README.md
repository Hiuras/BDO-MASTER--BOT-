# 🎮 BDO Dungeon Bot Discord

Un **bot Discord** dédié à **Black Desert Online (BDO)** pour gérer facilement la disponibilité des membres lors des donjons Atoraxxion via des réactions.

---

## ✨ Fonctionnalités principales

- ⚙️ **Configurer le channel donjon** avec `/setdungeonchannel #channel` (administrateurs uniquement)  
- 📘 **Poster un tableau interactif des donjons** via `/postdungeons` dans le channel configuré  
- ✅❌ **Réactions pour indiquer la disponibilité** des membres aux donjons  
- 📋 **Afficher le statut global** des joueurs avec `/dungeonstatus`  
- 😂 **Blagues aléatoires** grâce à `/joke` via une API externe  
- 💾 Sauvegarde automatique des réactions dans `reactionsData.json`

---

## 🏰 Donjons supportés

| Donjon                     | Gear Score minimum requis |
|----------------------------|---------------------------|
| Atoraxxion: Vahmalkea      | 250                       |
| Atoraxxion: Sycrakea       | 260                       |
| Atoraxxion: Yolunakea      | 270                       |
| Atoraxxion: Erethea's Limbo| 280                       |

---

## 🚀 Installation

1. Clonez le dépôt :

```bash
git clone <URL_DETON_REPO>
cd <NOM_DU_REPO>
```

2. Installez les dépendances :

```bash
npm install
```

3. Créez un fichier `.env` (ou `token.env`) à la racine du projet et ajoutez votre token Discord :

```env
DISCORD_TOKEN=ton_token_discord_ici
```

4. Lancez le bot :

```bash
node bot.js
```

---

## 📜 Commandes disponibles

| Commande                | Description                                                    |
|------------------------|----------------------------------------------------------------|
| `/setdungeonchannel`   | Configure le channel des donjons (administrateurs uniquement)  |
| `/postdungeons`        | Publie le tableau des donjons dans le channel configuré        |
| `/dungeonstatus`       | Affiche la liste des membres disponibles / indisponibles       |
| `/joke`                | Envoie une blague aléatoire pour détendre l’atmosphère         |

---

## 💡 Utilisation

1. **Configurez** le channel dédié aux donjons :  
   `/setdungeonchannel #nom-du-channel`

2. **Postez** le tableau des donjons dans ce channel :  
   `/postdungeons`

3. **Les membres** réagissent avec ✅ (disponible) ou ❌ (indisponible).

4. **Consultez** la disponibilité globale avec :  
   `/dungeonstatus`

5. **Ajoutez un peu d’humour** avec :  
   `/joke`

---

## 📂 Fichiers importants

- `bot.js` — script principal du bot  
- `config.json` — sauvegarde la configuration (channel, message)  
- `reactionsData.json` — stockage des réactions utilisateur

---

## 🤝 Contributions

Les contributions sont les bienvenues !  
N’hésitez pas à proposer des améliorations via **pull requests**.

---

## 📄 Licence

Ce projet est sous licence **MIT** — libre à vous d’utiliser et modifier.
