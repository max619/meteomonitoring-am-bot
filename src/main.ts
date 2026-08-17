import TelegramBot from "node-telegram-bot-api";
import {
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  updateSubscriber,
  updateSubscribers,
} from "./subscriberManager.js"; // Import the subscriber manager
import { loadConfig } from "./config.js";
import { createProxyAgent } from "./proxy.js";
import { fetchForecast, Forecast } from "./forecast.js";

const config = loadConfig();

// Routes both the telegram api and the forecast requests
// through the socks5 proxy, when one is configured
const proxyAgent = createProxyAgent(config.proxy);

// The request options are typed as the full request Options, which require an
// url, while the bot only merges them into the options of its own requests
const requestOptions = {
  agent: proxyAgent,
} as TelegramBot.ConstructorOptions["request"];

// Replace with your bot token
const bot = new TelegramBot(config.token, {
  polling: true,
  request: requestOptions,
});

const messageOptions: TelegramBot.SendMessageOptions = { parse_mode: "HTML" };

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
        return bot
          .sendMessage(subscriber.chatId, forecast.text, messageOptions)
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
bot.onText(/\/start/, async (msg) => {
  await bot
    .sendMessage(
      msg.chat.id,
      "You can subscribe to forecast updates with /subscribe command.\nYou can unsubscribe from forecast updates with /unsubscribe command."
    )
    .catch((error) => console.error("Error sending start message:", error));
});

bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  if (addSubscriber(chatId)) {
    await bot
      .sendMessage(chatId, "You have subscribed to forecast updates.")
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

    const forecast = await getLastForecastOrFetch();
    if (forecast) {
      const wasForecastSent = await bot
        .sendMessage(chatId, forecast.text, messageOptions)
        .then(() => true)
        .catch((error) => {
          console.error("Error sending forecast on subscribe message:", error);
          return false;
        });

      if (wasForecastSent) {
        await updateSubscriber(chatId, forecast.hash);
      }
    } else {
      await bot
        .sendMessage(chatId, "There is no forecast for now.")
        .catch((error) =>
          console.error("Error sending subscribe message:", error)
        );
    }

    console.log("User subscribed:", msg.chat.id);
  } else {
    await bot
      .sendMessage(
        chatId,
        "You are already subscribed to forecast updates. You can unsubscribe with /unsubscribe command."
      )
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

    console.log("User already subscribed:", msg.chat.id);
  }
});

// Command to unsubscribe users
bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id;
  if (removeSubscriber(chatId)) {
    await bot
      .sendMessage(chatId, "You have unsubscribed from forecast updates.")
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User unsubscribed:", msg.chat.id);
  } else {
    await bot
      .sendMessage(
        chatId,
        "You are not subscribed to forecast updates. You can subscribe with /subscribe command."
      )
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User not subscribed:", msg.chat.id);
  }
});

// Start polling for forecast changes every 30 minutes
checkForecast();
setInterval(checkForecast, config.checkTimeout * 60 * 1000);
