  <h3 align="center">Market-Exchange Project</h3>
  <p align="center">
This is an Implementation of how an Exchange Architecture works.
  </p>


## About the Project

Currently, this supports mock local markets (like TATA_INR) as well as live external trading pairs (like SOL_USDC) proxied from the Backpack Exchange. To reduce latency, all local transactions happen in memory/single node process without directly updating the database. However, snapshots are taken at regular intervals (3s) to prevent data loss, and events can be replayed using a queue if the engine goes down. For every transaction or order, the WebSocket server streams real-time updates (ticker, klines, depth) to the frontend. This architecture handles complex asynchronous streaming and order matching using a scalable, class-based Singleton approach.
![Architecture](https://github.com/Chirag076/market-exchange-project/blob/main/frontend/public/images/Architecture.png)

[Video](https://drive.google.com/file/d/1J85XPY4Rg0yfMa2dtCm4BLFw9kH5Vy0S/view?usp=sharing)

### Features
- Minimal Latency
- Real-time updates on orderbook, price and ticker
- Scalable Pub-Sub Service
- Redis queue for replaying after the last snapshot for recovery
- Executed quantity as the response to the user immediately after placing the order
- mMaker(Market Maker) service to emulate traffic
- Built as per standard Binance API Documentation

### Built With
- Next.js
- Typescript
- Redis
- Timescaledb
- WebSocket

## Getting Started

### Prerequisites
- Node JS & npm/nvm
- Typescript
- Docker (Other services can be installed directly or with Docker)

#### There are multiple processes/services in the repository: 

  - **`docker-compose`:** Running Redis and timescaledb images.
  - **`api`:** The main API and routing service:
  - **`engine`:** Central process, pulling and Executing orders from the queue, updating back to the user, and publishing to WebSocket server.
  - **`webSocketService`:** Scalable Pub-Sub service, ensuring proper subscription and removal logic for sockets.
  - **`frontend`:** Next.js frontend for the Exchange.
  - **`mMaker`:** Emulating traffic by randomly placing and canceling orders on the order-book.

### Installation & usage

- Clone the repo

- Start the dependencies, you can use the docker-compose to setup:

  ```bash
  docker-compose up -d
  ```
- You can check if all the services (ElasticSearch, Zookeeper, Kafka) are up and running by

  ```bash
  docker ps
  ```

-  To get any service running(say frontend), open a terminal: 
    ```bash
    cd frontend
    npm i 
    npm run dev
  
    # The running port will be displayed in the terminal.
    ```
- This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.
