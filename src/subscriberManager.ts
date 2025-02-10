import fs from "fs/promises";

const subscribersFilePath = "subscribers.txt"; // File to store subscriber IDs

// Load subscribers from the file
export async function getSubscribers(): Promise<number[]> {
  const subscribers: number[] = [];

  try {
    const data = await fs.readFile(subscribersFilePath, "utf-8");
    const ids = data.split("\n").map(Number).filter(Boolean); // Convert to numbers and filter out empty lines
    subscribers.push(...ids);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      // If the file does not exist, ignore the error
      console.error("Error reading subscribers file:", error);
    }
  }

  return subscribers;
}

// Save subscribers to the file
async function saveSubscribers(subscribers: number[]): Promise<void> {
  await fs.writeFile(subscribersFilePath, subscribers.join("\n")); // Save each subscriber ID on a new line
}

// Add a subscriber
export async function addSubscriber(chatId: number): Promise<boolean> {
  const subscribers = await getSubscribers();
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    await saveSubscribers(subscribers); // Save subscribers after adding
    return true; // Return true on success
  }
  return false; // Return false if already subscribed
}

// Remove a subscriber
export async function removeSubscriber(chatId: number): Promise<boolean> {
  const subscribers = await getSubscribers();
  const index = subscribers.indexOf(chatId);
  if (index > -1) {
    subscribers.splice(index, 1);
    await saveSubscribers(subscribers); // Save subscribers after removing
    return true; // Return true on success
  }
  return false; // Return false if not found
}
