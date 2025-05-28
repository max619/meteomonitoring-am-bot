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
  data: Buffer;
  hash: string;
};

const config = loadConfig();

// Replace with your bot token
const bot = new TelegramBot(config.token, { polling: true });

// URL of the image to monitor
const baseUrl =
  "https://meteomonitoring.am/public/admin/ckfinder/userfiles/files";

const getCurrentImageUrls = (): string[] => {
  const today = new Date();
  const year = today.getFullYear(); // Get the current year
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  return [
    `${baseUrl}/weather-${year}/${month}-${day}-${year - 2000}-yerevan.jpg`,
    `${baseUrl}/weather-${year}/${month}-${day}-yerevan.jpg`,
    `${baseUrl}/%D5%A5%D6%80%D6%87%D5%A1%D5%B6%20${day}.jpg`,
  ];
};

let lastImage: Image | null = null;

async function fetchImage(): Promise<Image | null> {
  const imageUrls = getCurrentImageUrls(); // Use the dynamically generated URL
  for (const url of imageUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          `Error fetching image: ${response.statusText}. From ${url}`
        );

        continue;
      }
      const buffer = await response.buffer();
      const hash = createHash("md5").update(buffer).digest("hex");

      console.log(`Fetched image ${url} hash: ${hash}`);

      return { url: url, data: buffer, hash };
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  }

  return null;
}

async function getLastImageOrFetch(): Promise<Image | null> {
  if (lastImage) {
    return lastImage;
  }

  lastImage = await fetchImage();
  return lastImage;
}

// Function to fetch the image and check for changes
async function checkImage(): Promise<void> {
  const image = await fetchImage();
  if (image) {
    sendImageToSubscribers(image);
  }
}

// Function to send the image to all subscribers
// Returns the updated subscribers
async function sendImageToSubscribers(image: Image): Promise<void> {
  const subscribers = getSubscribers();
  if (
    subscribers.every((subscriber) => subscriber.lastImageHash === image.hash)
  ) {
    console.log(
      "Every subscriber has the same image, skipping sending to subscribers"
    );
    return;
  }

  const updatedSubscribers = await Promise.all(
    subscribers.map((subscriber) => {
      if (subscriber.lastImageHash !== image.hash) {
        return bot
          .sendPhoto(subscriber.chatId, image.data)
          .then(() => ({ ...subscriber, lastImageHash: image.hash }))
          .catch((error) => {
            console.error(
              `Error sending image '${image.url}' to subscriber ${subscriber.chatId} :`,
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
        .sendPhoto(chatId, image.data)
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
