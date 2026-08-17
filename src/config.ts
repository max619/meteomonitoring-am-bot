import fs from "fs";

export interface Config {
  token: string;
  checkTimeout: number;
  // SOCKS5 proxy url, e.g. socks5://user:password@127.0.0.1:1080.
  // When not set, requests are made directly.
  proxy: string | null;
}

// Only SOCKS5 is supported, socks5h keeps the dns resolution on the proxy side
const proxyProtocols = ["socks5:", "socks5h:"];

function parseProxy(proxy: string): string {
  let url: URL;
  try {
    url = new URL(proxy);
  } catch {
    throw Error(`proxy in config.json is not a valid url: ${proxy}`);
  }

  if (!proxyProtocols.includes(url.protocol)) {
    throw Error(
      `proxy in config.json must use one of ${proxyProtocols.join(
        ", "
      )} protocols, got ${url.protocol}`
    );
  }

  return url.toString();
}

export function loadConfig(): Config {
  const config: Partial<Config> = JSON.parse(
    fs.readFileSync("config.json", "utf8")
  );

  if (!config.token) {
    throw Error("token is requred in config.json");
  }

  return {
    token: config.token,
    checkTimeout: config.checkTimeout || 30,
    proxy: config.proxy ? parseProxy(config.proxy) : null,
  };
}
