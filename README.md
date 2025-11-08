# Middagstilbud-App

En norsk web-applikasjon som hjelper deg å finne de beste tilbudene på ingredienser fra forskjellige butikkkjeder.

## 🚀 Funksjoner

## 🏪 Støttede butikker

### Butikker

## 🛠 Teknisk stack

## 📦 Installasjon

## Bruk

## Utvikling

## Hvordan fungerer det?

REST-lag - Express server og HTTP-endepunkter

Core-lag - Business logic

Persistence - Datahenting og lagring

## Prosjektstruktur

middagstilbud/
├── rest/src/                   # HTTP-server og API-endepunkter
│   ├── server.js               # Express-app, middleware, oppstart
│   ├── routes/offers.js        # API-ruter for tilbud
│   ├── config/                 # Konfigurasjon
│   │   ├── index.js            # Paths, ports, API URLs
│   │   └── stores.js           # Butikkliste med dealerId og logoer
│   └── img/                    # Butikklogoer (statisk innhold)
├── core/src/
│   └── offerService.js         # Hovedlogikk: oppdatering, henting
├── persistence/src/
│   ├── tjekApiService.js       # Henter tilbud fra Tjek API
│   ├── fileService.js          # Les/skriv JSON-filer
│   └── resources/offers/       # Lagrede tilbudsfiler (JSON)
└── package.json                # Avhengigheter og npm-scripts
