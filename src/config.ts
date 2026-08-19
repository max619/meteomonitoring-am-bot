import fs from "fs";

export interface Config {
  token: string;
  checkTimeout: number;
  // SOCKS5 proxy url, e.g. socks5://user:password@127.0.0.1:1080.
  // When not set, requests are made directly.
  proxy: string | null;
  // Telegram user ids allowed to run the admin commands.
  // When empty, no one can run them.
  admins: number[];
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

function parseAdmins(admins: unknown): number[] {
  if (!Array.isArray(admins)) {
    throw Error("admins in config.json must be an array of telegram user ids");
  }

  return admins.map((admin) => {
    // Ids are big enough that they are easy to quote by accident
    const id = typeof admin === "string" ? Number(admin) : admin;

    if (typeof id !== "number" || !Number.isInteger(id)) {
      throw Error(
        `admins in config.json must contain telegram user ids, got ${JSON.stringify(
          admin
        )}`
      );
    }

    return id;
  });
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
    admins: config.admins ? parseAdmins(config.admins) : [],
  };
}
