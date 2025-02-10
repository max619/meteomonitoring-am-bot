import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";
import { createHash } from "crypto";
import fs from "fs/promises"; // Use the promises API for async operations
import {
  addSubscriber,
  removeSubscriber,
  getSubscribers,
} from "./subscriberManager.js"; // Import the subscriber manager
import { loadConfig } from "./config.js";

const config = loadConfig();

// Replace with your bot token
const bot = new TelegramBot(config.token, { polling: true });

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

const hashFilePath = "lastImageHash.txt"; // File to store the last image hash

// Load the last image hash from the file if it exists
async function loadLastImageHash(): Promise<string | null> {
  try {
    const data = await fs.readFile(hashFilePath, "utf-8");
    return data;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      // If the file does not exist, ignore the error
      console.error("Error reading hash file:", error);
    }
    return null;
  }
}

// Function to fetch the image and check for changes
async function checkImage(): Promise<void> {
  const imageUrl = getCurrentImageUrl(); // Use the dynamically generated URL
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const currentImageHash = createHash("md5").update(buffer).digest("hex");
    const lastImageHash = await loadLastImageHash();

    if (lastImageHash !== currentImageHash) {
      await fs.writeFile(hashFilePath, currentImageHash); // Save the new hash to the file
      sendImageToSubscribers(buffer);
    }
  } catch (error) {
    console.error("Error fetching image:", error);
  }
}

// Function to send the image to all subscribers
async function sendImageToSubscribers(imageBuffer: Buffer): Promise<void> {
  const subscribers = await getSubscribers();
  await Promise.all(
    subscribers.map((chatId) => {
      bot
        .sendPhoto(chatId, imageBuffer)
        .catch((error) => console.error("Error sending image:", error));
    })
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
  if (await addSubscriber(chatId)) {
    await bot
      .sendMessage(chatId, "You have subscribed to image updates.")
      .catch((error) =>
        console.error("Error sending subscribe message:", error)
      );

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
  if (await removeSubscriber(chatId)) {
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
setInterval(checkImage, 30 * 60 * 1000);
