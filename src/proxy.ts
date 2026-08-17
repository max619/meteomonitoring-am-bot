import { Agent } from "http";
import { SocksProxyAgent } from "socks-proxy-agent";

// Hides the credentials, so the proxy url can be safely logged
function maskProxy(proxy: string): string {
  const url = new URL(proxy);
  if (url.username || url.password) {
    url.username = "***";
    url.password = "***";
  }

  return url.toString();
}

// Returns an agent routing the requests through the socks5 proxy,
// or undefined when no proxy is configured
export function createProxyAgent(proxy: string | null): Agent | undefined {
  if (!proxy) {
    return undefined;
  }

  console.log(`Using socks5 proxy ${maskProxy(proxy)}`);
  return new SocksProxyAgent(proxy);
}
