import { Agent } from "http";
import nodeFetch from "node-fetch";
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

type NodeFetchParams = Parameters<typeof nodeFetch>;

// The telegram client is fetch based and takes no agent, so the proxy is applied
// by handing it a fetch that goes through node-fetch, which does take one.
// The client only sends an urlencoded body with a signal and reads back the
// status and the text, all of which node-fetch implements, so the two fetch
// types are bridged with a cast.
export function createProxyFetch(
  agent: Agent | undefined
): typeof fetch | undefined {
  if (!agent) {
    return undefined;
  }

  const proxiedFetch = (input: NodeFetchParams[0], init?: NodeFetchParams[1]) =>
    nodeFetch(input, { ...init, agent });

  return proxiedFetch as unknown as typeof fetch;
}
