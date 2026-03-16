import { ProxyAgent } from 'undici';
import dotenv from 'dotenv';

dotenv.config();

const proxyUrl = process.env.PROXY_URL;

/**
 * Global dispatcher instance for proxied requests.
 * If PROXY_URL is not set, this will be undefined, and fetch will use the default dispatcher.
 */
export const proxyDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

if (proxyUrl) {
    console.log(`[Proxy] Using residential proxy: ${proxyUrl.split('@').pop()}`);
} else {
    console.log('[Proxy] No proxy configured. Using direct connection.');
}
