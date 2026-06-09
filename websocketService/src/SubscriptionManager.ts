import { RedisClientType, createClient } from "redis";
import { UserManager } from "./UserManager";
import { WebSocket } from "ws";

export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private subscriptions: Map<string, string[]> = new Map();
    private reverseSubscriptions: Map<string, string[]> = new Map();
    private redisClient: RedisClientType;
    private backpackWs: WebSocket | null = null;

    private constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
        this.initBackpackWs();
    }

    public static getInstance() {
        if (!this.instance)  {
            this.instance = new SubscriptionManager();
        }
        return this.instance;
    }

    private initBackpackWs() {
        console.log("Initializing connection to Backpack WS...");
        const ws = new WebSocket("wss://ws.backpack.exchange");
        this.backpackWs = ws;

        ws.on("open", () => {
            console.log("Connected to Backpack WS");
            
            // Gather all active external subscriptions and subscribe to them
            const externalSubs: string[] = [];
            for (const sub of this.reverseSubscriptions.keys()) {
                if (!sub.includes("TATA_INR")) {
                    externalSubs.push(this.mapLocalToBackpack(sub));
                }
            }
            if (externalSubs.length > 0) {
                console.log("Subscribing to active external streams:", externalSubs);
                ws.send(JSON.stringify({
                    method: "SUBSCRIBE",
                    params: externalSubs
                }));
            }
        });

        ws.on("message", (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                if (parsed.stream && parsed.data) {
                    const localChannel = this.mapBackpackToLocal(parsed.stream);
                    const subscribers = this.reverseSubscriptions.get(localChannel);
                    if (subscribers) {
                        subscribers.forEach(userId => {
                            UserManager.getInstance().getUser(userId)?.emit(parsed);
                        });
                    }
                }
            } catch (err) {
                console.error("Error processing Backpack WS message:", err);
            }
        });

        ws.on("close", () => {
            console.log("Backpack WS disconnected. Reconnecting in 5s...");
            this.backpackWs = null;
            setTimeout(() => this.initBackpackWs(), 5000);
        });

        ws.on("error", (err) => {
            console.error("Backpack WS error:", err);
            ws.close();
        });
    }

    private mapLocalToBackpack(subscription: string): string {
        // e.g. depth@SOL_USDC -> depth.SOL_USDC
        // e.g. trade@SOL_USDC -> trade.SOL_USDC
        // e.g. ticker.SOL_USDC -> ticker.SOL_USDC
        if (subscription.startsWith("depth@")) {
            return subscription.replace("depth@", "depth.");
        }
        if (subscription.startsWith("trade@")) {
            return subscription.replace("trade@", "trade.");
        }
        return subscription;
    }

    private mapBackpackToLocal(stream: string): string {
        // e.g. depth.SOL_USDC -> depth@SOL_USDC
        // e.g. trade.SOL_USDC -> trade@SOL_USDC
        // e.g. ticker.SOL_USDC -> ticker.SOL_USDC
        if (stream.startsWith("depth.")) {
            return stream.replace("depth.", "depth@");
        }
        if (stream.startsWith("trade.")) {
            return stream.replace("trade.", "trade@");
        }
        return stream;
    }

    public subscribe(userId: string, subscription: string) {
        if (this.subscriptions.get(userId)?.includes(subscription)) {
            return;
        }

        this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
        this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));
        
        if (this.reverseSubscriptions.get(subscription)?.length === 1) {
            if (subscription.includes("TATA_INR")) {
                this.redisClient.subscribe(subscription, this.redisCallbackHandler);
            } else {
                const backpackStream = this.mapLocalToBackpack(subscription);
                if (this.backpackWs && this.backpackWs.readyState === WebSocket.OPEN) {
                    console.log(`Subscribing to Backpack stream: ${backpackStream}`);
                    this.backpackWs.send(JSON.stringify({
                        method: "SUBSCRIBE",
                        params: [backpackStream]
                    }));
                }
            }
        }
    }

    private redisCallbackHandler = (message: string, channel: string) => {
        const parsedMessage = JSON.parse(message);
        this.reverseSubscriptions.get(channel)?.forEach(s => UserManager.getInstance().getUser(s)?.emit(parsedMessage));
    }

    public unsubscribe(userId: string, subscription: string) {
        const subscriptions = this.subscriptions.get(userId);
        if (subscriptions) {
            this.subscriptions.set(userId, subscriptions.filter(s => s !== subscription));
        }
        const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
        if (reverseSubscriptions) {
            this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== userId));
            if (this.reverseSubscriptions.get(subscription)?.length === 0) {
                this.reverseSubscriptions.delete(subscription);
                if (subscription.includes("TATA_INR")) {
                    this.redisClient.unsubscribe(subscription);
                } else {
                    const backpackStream = this.mapLocalToBackpack(subscription);
                    if (this.backpackWs && this.backpackWs.readyState === WebSocket.OPEN) {
                        console.log(`Unsubscribing from Backpack stream: ${backpackStream}`);
                        this.backpackWs.send(JSON.stringify({
                            method: "UNSUBSCRIBE",
                            params: [backpackStream]
                        }));
                    }
                }
            }
        }
    }

    public userLeft(userId: string) {
        console.log("user left " + userId);
        this.subscriptions.get(userId)?.forEach(s => this.unsubscribe(userId, s));
    }
    
    getSubscriptions(userId: string) {
        return this.subscriptions.get(userId) || [];
    }
}