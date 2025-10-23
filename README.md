 # <p align="center">Supervision web</p>
       
Cette application web est un dashboard de gestion de température permettant de surveiller les relevés en temps réel, programmer la ventilation sur plusieurs jours et recevoir des notifications automatiques.

## Mode d'emplois

### 🛠️ Commande d'installation
Cloner le projet
```bash
git clone https://github.com/Saiko-Code/Euroelec-Web.git
```
Installer toutes les dépendances
```bash
npm install
```
Installer PM2

Voir la doc pour ajouter le lancement des programmes au démarrage du PC/Serveur
https://pm2.keymetrics.io
```
npm install pm2 -g
```
Créé un fichier .env
```bash
nano .env
```
Contenu du fichier .env
```bash
=========================
 Contenu du fichier .env
=========================
-------------------------
# Server SMTP
-------------------------
MAIL_HOST= smtp.gmail.com
MAIL_PORT=465
MAIL_USER= ton.adresse@gmail.com
MAIL_PASS= motdepasse_application
MAIL_TO= adresse@gmail.com
-------------------------
# Connexion DB
-------------------------
DB_HOST= adresse ip ou nom de domaine
DB_USER= utilisateur
DB_PASSWORD= mot de passe 
DB_NAME= nom de la base
-------------------------
# Serveur IP
-------------------------
REACT_APP_SERVER_IP= adresse ip de la machine
REACT_APP_SERVER_PORT= 3001 ou 80 
```
Lancer le site web et serveur
```bash
pm2 start ecosystem.config.js
```
## 🛠️ Tech Stack
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/fr)
- [MariaDB](https://mariadb.org)


# <p align="center">Liason Modbus</p>
  Premet de communiquer avec un automate programmable via modbus TCP

## 🛠️ Install Dependencies    
```bash

```
        
## 🛠️ Tech Stack
- [Node.js](https://nodejs.org/fr)
    
   
## 🙇 Author
#### Alexis Bonnier
- Github: https://github.com/Saiko-Code
         
    
