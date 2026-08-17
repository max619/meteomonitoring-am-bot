import { Bot, type SendMessageParams } from "node-telegram-bot-api";
import { run } from "node-telegram-bot-api/node";
import {
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  updateSubscriber,
  updateSubscribers,
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
  await ctx
    .reply(
      "You can subscribe to forecast updates with /subscribe command.\nYou can unsubscribe from forecast updates with /unsubscribe command."
    )
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

// Start polling for forecast changes every 30 minutes
checkForecast();
const forecastInterval = setInterval(
  checkForecast,
  config.checkTimeout * 60 * 1000
);

// Pumps the updates until SIGINT or SIGTERM stops the bot
await run(bot);
clearInterval(forecastInterval);
