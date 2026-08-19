import {
  Bot,
  type Context,
  type SendMessageParams,
} from "node-telegram-bot-api";
import { run } from "node-telegram-bot-api/node";
import {
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  updateSubscriber,
  updateSubscribers,
  type Subscriber,
} from "./subscriberManager.js"; // Import the subscriber manager
import { loadConfig } from "./config.js";
import { createProxyAgent, createProxyFetch } from "./proxy.js";
import { fetchForecast, Forecast } from "./forecast.js";

const config = loadConfig();

// Routes both the telegram api and the forecast requests
// through the socks5 proxy, when one is configured
const proxyAgent = createProxyAgent(config.proxy);

const bot = new Bot(config.token, { fetch: createProxyFetch(proxyAgent) });

const messageOptions: Omit<SendMessageParams, "chat_id" | "text"> = {
  parse_mode: "HTML",
};

// The admin commands are keyed on the telegram user id, not on the chat,
// so an admin is recognized in every chat the bot sees
const admins = new Set(config.admins);

function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  return userId !== undefined && admins.has(userId);
}

let lastForecast: Forecast | null = null;

async function getLastForecastOrFetch(): Promise<Forecast | null> {
  if (lastForecast) {
    return lastForecast;
  }

  lastForecast = await fetchForecast(proxyAgent);
  return lastForecast;
}

// Function to fetch the forecast and check for changes
async function checkForecast(): Promise<void> {
  const forecast = await fetchForecast(proxyAgent);
  if (forecast) {
    lastForecast = forecast;
    sendForecastToSubscribers(forecast);
  }
}

// Function to send the forecast to all subscribers
async function sendForecastToSubscribers(forecast: Forecast): Promise<void> {
  const subscribers = getSubscribers();
  if (
    subscribers.every(
      (subscriber) => subscriber.lastForecastHash === forecast.hash
    )
  ) {
    console.log(
      "Every subscriber has the same forecast, skipping sending to subscribers"
    );
    return;
  }

  const updatedSubscribers = await Promise.all(
    subscribers.map((subscriber) => {
      if (subscriber.lastForecastHash !== forecast.hash) {
        return bot.api
          .sendMessage({
            chat_id: subscriber.chatId,
            text: forecast.text,
            ...messageOptions,
          })
          .then(() => ({ ...subscriber, lastForecastHash: forecast.hash }))
          .catch((error) => {
            console.error(
              `Error sending forecast to subscriber ${subscriber.chatId} :`,
              error
            );
            return null;
          });
      }
      return null;
    })
  );
  updateSubscribers(
    updatedSubscribers.filter((subscriber) => subscriber !== null)
  );
}

// On client start send instructions
bot.command("start", async (ctx) => {
  const lines = [
    "You can subscribe to forecast updates with /subscribe command.",
    "You can unsubscribe from forecast updates with /unsubscribe command.",
  ];

  if (isAdmin(ctx)) {
    lines.push("You can list the subscribers with /users command.");
  }

  await ctx
    .reply(lines.join("\n"))
    .catch((error) => console.error("Error sending start message:", error));
});

bot.command("subscribe", async (ctx) => {
  // Commands always come from a message, so the chat is only missing
  // for the update types this handler never sees
  const chatId = ctx.chatId;
  if (chatId === undefined) {
    return;
  }

  if (addSubscriber(chatId)) {
    await ctx
      .reply("You have subscribed to forecast updates.")
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

    const forecast = await getLastForecastOrFetch();
    if (forecast) {
      const wasForecastSent = await ctx
        .reply(forecast.text, messageOptions)
        .then(() => true)
        .catch((error) => {
          console.error("Error sending forecast on subscribe message:", error);
          return false;
        });

      if (wasForecastSent) {
        await updateSubscriber(chatId, forecast.hash);
      }
    } else {
      await ctx
        .reply("There is no forecast for now.")
        .catch((error) =>
          console.error("Error sending subscribe message:", error)
        );
    }

    console.log("User subscribed:", chatId);
  } else {
    await ctx
      .reply(
        "You are already subscribed to forecast updates. You can unsubscribe with /unsubscribe command."
      )
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

    console.log("User already subscribed:", chatId);
  }
});

// Command to unsubscribe users
bot.command("unsubscribe", async (ctx) => {
  const chatId = ctx.chatId;
  if (chatId === undefined) {
    return;
  }

  if (removeSubscriber(chatId)) {
    await ctx
      .reply("You have unsubscribed from forecast updates.")
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User unsubscribed:", chatId);
  } else {
    await ctx
      .reply(
        "You are not subscribed to forecast updates. You can subscribe with /subscribe command."
      )
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User not subscribed:", chatId);
  }
});

// Telegram rejects a message longer than 4096 characters, so a long
// subscriber list goes out as several messages
const messageLengthLimit = 4096;

function splitIntoMessages(lines: string[]): string[] {
  const messages: string[] = [];

  for (const line of lines) {
    const last = messages[messages.length - 1];

    if (last !== undefined && last.length + 1 + line.length <= messageLengthLimit) {
      messages[messages.length - 1] = `${last}\n${line}`;
    } else {
      messages.push(line);
    }
  }

  return messages;
}

// The database stores nothing but the chat id, so the names are asked
// from telegram. A chat that blocked the bot or was deleted still answers,
// but a failure here must not hide the subscriber from the list
async function describeSubscriber(subscriber: Subscriber): Promise<string> {
  const chat = await bot.api
    .getChat({ chat_id: subscriber.chatId })
    .catch((error) => {
      console.error(`Error fetching chat ${subscriber.chatId}:`, error);
      return null;
    });

  const name = chat
    ? [chat.title, chat.first_name, chat.last_name].filter(Boolean).join(" ")
    : "";
  const username = chat?.username ? ` @${chat.username}` : "";
  const parts = [`${subscriber.chatId}`];

  if (name || username) {
    parts.push(`${name}${username}`.trim());
  } else if (!chat) {
    parts.push("unavailable");
  }

  if (!subscriber.lastForecastHash) {
    parts.push("no forecast sent yet");
  }

  return parts.join(" — ");
}

// Admin command listing everyone subscribed to the forecast
bot.command("users", async (ctx) => {
  if (!isAdmin(ctx)) {
    console.log("Rejected /users from non admin:", ctx.from?.id);
    return;
  }

  const subscribers = getSubscribers();
  if (subscribers.length === 0) {
    await ctx
      .reply("There are no subscribers.")
      .catch((error) => console.error("Error sending users message:", error));
    return;
  }

  const lines = await Promise.all(subscribers.map(describeSubscriber));
  const messages = splitIntoMessages([
    `Subscribers (${subscribers.length}):`,
    ...lines,
  ]);

  for (const message of messages) {
    // Names come from telegram and may hold anything, so they are sent
    // as plain text instead of the HTML the forecast uses
    await ctx
      .reply(message)
      .catch((error) => console.error("Error sending users message:", error));
  }

  console.log("Admin listed subscribers:", ctx.from?.id);
});

// Start polling for forecast changes every 30 minutes
checkForecast();
const forecastInterval = setInterval(
  checkForecast,
  config.checkTimeout * 60 * 1000
);

// Pumps the updates until SIGINT or SIGTERM stops the bot
await run(bot);
clearInterval(forecastInterval);
