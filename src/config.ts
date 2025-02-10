import fs from "fs";

export interface Config {
  token: string;
}

export function loadConfig(): Config {
  const config = fs.readFileSync("config.json", "utf8");
  return JSON.parse(config);
}
