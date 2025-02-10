import fs from "fs";

export interface Config {
  token: string;
  checkTimeout: number;
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
  };
}
