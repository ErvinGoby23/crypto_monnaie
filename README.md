# Crypto Market Monitoring System — Real-Time Pipeline

Système de streaming de données crypto en temps réel, ingérant des flux live depuis Binance et Coinbase, traitant les données via Kafka, stockant en MongoDB et affichant un dashboard React en direct.

---

## Architecture

```
WebSocket (Binance / Coinbase)
        ↓
    producer.js          ← Redis fallback si Kafka KO
        ↓
   Apache Kafka          ← Buffer central / découplage
  (3 topics par symbole)
        ↓
  ┌─────┬─────┬──────┐
  │ C1  │ C2  │  C3  │
  └──┬──┴──┬──┴──┬───┘
     ↓     ↓     ↓
  trades stats alerts    ← Collections MongoDB
        ↓
    server.js            ← Polling MongoDB + Socket.IO
        ↓
  Dashboard React        ← Affichage temps réel
```

### Kafka Topics

| Topic | Description |
|---|---|
| `crypto.trades.binance.btcusdt` | Trades BTC/USDT Binance |
| `crypto.trades.binance.ethusdt` | Trades ETH/USDT Binance |
| `crypto.trades.coinbase.btcusd` | Trades BTC-USD Coinbase |
| `crypto.alerts` | Alertes produites par Consumer 3 |

### Consumers

| Fichier | Topics consommés | Rôle | Collection MongoDB |
|---|---|---|---|
| `consumer1.js` | `btcusdt` · `ethusdt` · `btcusd` | Parse et stocke tous les trades | `trades` |
| `consumer2.js` | `btcusdt` · `ethusdt` · `btcusd` | Agrège par fenêtres glissantes (1min / 5min / 15min / 1h) | `stats` |
| `consumer3.js` | `btcusdt` · `ethusdt` · `btcusd` | Détecte anomalies (gros volumes, price spikes) → produit sur `crypto.alerts` | `alerts` |

---

## Stack technique

- **Node.js** — producer, consumers, API server
- **Apache Kafka** (KRaft, Docker) — buffer central
- **Redis** — fallback si Kafka indisponible
- **MongoDB** (local) — stockage trades, stats, alertes
- **Express + Socket.IO** — API server (REST + WebSocket push)
- **React + Vite + Recharts** — dashboard live
- **Docker / Docker Compose** — Kafka + kafka-ui

---

## Prérequis

- Node.js ≥ 18
- Docker Desktop
- MongoDB compass installé localement (port 27017)

---

## Installation

```bash
# 1. Cloner le projet
git clone <repo>
cd crypto-monitor

# 2. Installer les dépendances backend
npm install

# 3. Installer les dépendances frontend
cd dashboard
npm install
cd ..
```

---

## Démarrage

### 1. Lancer Kafka (Docker)

```bash
docker-compose up -d
```

Kafka disponible sur `localhost:9092` — kafka-ui sur `http://localhost:8080` — Redis sur `localhost:6379`

### 2. Lancer le producer

```bash
node producer.js
```

Se connecte à Binance (BTCUSDT, ETHUSDT) et Coinbase (BTC-USD) via WebSocket et publie sur Kafka.

### 3. Lancer les consumers

```bash
node consumer1.js   # Parser + stockage MongoDB
node consumer2.js   # Agrégateur fenêtres glissantes
node consumer3.js   # Détection d'anomalies
```

### 4. Lancer l'API server

```bash
node server.js
```

Démarre sur `http://localhost:3000` — poll MongoDB toutes les 500ms et pousse via Socket.IO.

### 5. Lancer le dashboard

```bash
cd dashboard
npm run dev
```

Dashboard disponible sur `http://localhost:5173`

---

## Fonctionnalités

### Ingestion
- Connexion WebSocket live à Binance et Coinbase
- Reconnexion automatique en cas de déconnexion
- Fallback Redis si Kafka est temporairement indisponible
- Rejeu automatique des trades Redis → Kafka toutes les 5 secondes

### Traitement
- **Consumer 1** : parse les trades JSON, filtre les champs utiles (prix, volume, timestamp, source), stocke dans MongoDB
- **Consumer 2** : fenêtres glissantes 1min / 5min / 15min / 1h — calcule prix moyen, volume total, min/max, nombre de trades
- **Consumer 3** : détecte les gros volumes (≥ 0.1 BTC) et les variations de prix rapides (≥ 0.1%), publie dans `crypto.alerts`

### Dashboard
- **Ticker** : prix en direct BTC/USDT, ETH/USDT, BTC-USD
- **KPI Grid** : prix actuel, variation depuis connexion, nombre de trades, anomalies
- **Price Chart** : graphique live par symbole (Recharts)
- **Trades Feed** : flux live des derniers trades
- **Alertes** : anomalies temps réel avec type et horodatage
- **Volume Stats** : barres de volume par fenêtre glissante (BTC)
- **System Health** : statut MongoDB, Kafka, consumers, trades/sec, lag

### API REST

| Endpoint | Description |
|---|---|
| `GET /trades` | 50 derniers trades par symbole |
| `GET /stats` | Statistiques agrégées |
| `GET /alerts` | 20 dernières alertes |
| `GET /price` | Dernier prix |
| `GET /health` | Statut du système |


## Points d'architecture clés

- **Le dashboard ne lit jamais Kafka directement** — il passe obligatoirement par l'API server (couche intermédiaire)
- **MongoDB comme intermédiaire** — `server.js` poll MongoDB, jamais Kafka
- **Un consumer peut s'abonner à plusieurs topics** simultanément via `topics: []`
- **Consumer 3 suffit pour les alertes** — il écrit en MongoDB ET publie sur `crypto.alerts`
- **Pas de batch processing** — tout est traité message par message en temps réel

Fait par GOBY Ervin, TOUMERT Rayan et SHUM Ben
