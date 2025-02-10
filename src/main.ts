import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";
import { createHash } from "crypto";
import {
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  updateSubscriber,
  updateSubscribers,
} from "./subscriberManager.js"; // Import the subscriber manager
import { loadConfig } from "./config.js";

type Image = {
  url: string;
  hash: string;
};

const config = loadConfig();

// Replace with your bot token
const bot = new TelegramBot(config.token, { polling: true });
let lastImageHash = "";

// URL of the image to monitor
const baseUrl =
  "https://meteomonitoring.am/public/admin/ckfinder/userfiles/files/weather-";

const getCurrentImageUrl = (): string => {
  const today = new Date();
  const year = today.getFullYear(); // Get the current year
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  return `${baseUrl}${year}/${month}-${day}-yerevan.jpg`; // Updated URL structure
};

let lastImage: Image | null = null;

async function fetchImage(): Promise<Image | null> {
  const imageUrl = getCurrentImageUrl(); // Use the dynamically generated URL
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("Error fetching image:", response.statusText);
      return null;
    }
    const buffer = await response.buffer();
    lastImageHash = createHash("md5").update(buffer).digest("hex");

    return { url: imageUrl, hash: lastImageHash };
  } catch (error) {
    console.error("Error fetching image:", error);
  }

  return null;
}

async function getLastImageOrFetch(): Promise<Image | null> {
  if (lastImage) {
    return lastImage;
  }

  return fetchImage();
}

// Function to fetch the image and check for changes
async function checkImage(): Promise<void> {
  const image = await fetchImage();
  if (image) {
    lastImage = image;
    sendImageToSubscribers(image);
  }
}

// Function to send the image to all subscribers
// Returns the updated subscribers
async function sendImageToSubscribers(image: Image): Promise<void> {
  const subscribers = getSubscribers();
  if (
    subscribers.some((subscriber) => subscriber.lastImageHash === image.hash)
  ) {
    return;
  }

  const updatedSubscribers = await Promise.all(
    subscribers.map((subscriber) => {
      if (subscriber.lastImageHash !== image.hash) {
        return bot
          .sendPhoto(subscriber.chatId, image.url)
          .then(() => ({ ...subscriber, lastImageHash: image.hash }))
          .catch((error) => {
            console.error("Error sending image:", error);
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
      "You can subscribe to image updates with /subscribe command.\nYou can unsubscribe from image updates with /unsubscribe command."
    )
    .catch((error) => console.error("Error sending start message:", error));
});

bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  if (addSubscriber(chatId)) {
    await bot
      .sendMessage(chatId, "You have subscribed to image updates.")
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

    const image = await getLastImageOrFetch();
    if (image) {
      const wasImageSent = await bot
        .sendPhoto(chatId, image.url)
        .then(() => true)
        .catch((error) => {
          console.error("Error sending image on subscribe message:", error);
          return false;
        });

      if (wasImageSent) {
        await updateSubscriber(chatId, image.hash);
      }
    } else {
      await bot
        .sendMessage(chatId, "There is no forecast image for now.")
        .catch((error) =>
          console.error("Error sending subscribe message:", error)
        );
    }

    console.log("User subscribed:", msg.chat.id);
  } else {
    await bot
      .sendMessage(
        chatId,
        "You are already subscribed to image updates. You can unsubscribe with /unsubscribe command."
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
      .sendMessage(chatId, "You have unsubscribed from image updates.")
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User unsubscribed:", msg.chat.id);
  } else {
    await bot
      .sendMessage(
        chatId,
        "You are not subscribed to image updates. You can subscribe with /subscribe command."
      )
      .catch((error) =>
        console.error("Error sending unsubscribe message:", error)
      );

    console.log("User not subscribed:", msg.chat.id);
  }
});

// Start polling for image changes every 30 minutes
checkImage();
setInterval(checkImage, config.checkTimeout * 60 * 1000);
