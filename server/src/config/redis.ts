import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL;
        const redisPassword = process.env.REDIS_PASSWORD;

        if (!redisUrl || !redisPassword) {
            throw new Error('Redis configuration missing in environment variables');
        }

        redisClient = createClient({
            url: `redis://:${redisPassword}@${redisUrl}`,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection limit exceeded');
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });

        redisClient.on('error', (error) => {
            console.error('❌ Redis client error:', error);
        });

        redisClient.on('connect', () => {
            console.log('🔄 Redis connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis connected and ready');
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });

        await redisClient.connect();

        return redisClient;
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        throw error;
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis() first.');
    }
    return redisClient;
};

export const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        console.log('✅ Redis disconnected');
    }
};
