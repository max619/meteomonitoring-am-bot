import fs from "fs/promises";

type Subscriber = {
  chatId: number;
  lastImageHash: string;
};

const subscribersFilePath = "subscribers.json"; // File to store subscriber IDs

// Load subscribers from the file
export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await fs.readFile(subscribersFilePath, "utf-8");
    const subscribers = JSON.parse(data) as Subscriber[];
    return subscribers;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      // If the file does not exist, ignore the error
      console.error("Error reading subscribers file:", error);
    }
  }

  return [];
}

// Save subscribers to the file
export async function saveSubscribers(
  subscribers: Subscriber[]
): Promise<void> {
  await fs.writeFile(subscribersFilePath, JSON.stringify(subscribers, null, 2));
}

// Add a subscriber
export async function addSubscriber(chatId: number): Promise<boolean> {
  const subscribers = await getSubscribers();
  if (!subscribers.some((subscriber) => subscriber.chatId === chatId)) {
    subscribers.push({ chatId, lastImageHash: "" });
    await saveSubscribers(subscribers); // Save subscribers after adding
    return true; // Return true on success
  }
  return false; // Return false if already subscribed
}

// Remove a subscriber
export async function removeSubscriber(chatId: number): Promise<boolean> {
  const subscribers = await getSubscribers();
  const index = subscribers.findIndex(
    (subscriber) => subscriber.chatId === chatId
  );
  if (index > -1) {
    subscribers.splice(index, 1);
    await saveSubscribers(subscribers); // Save subscribers after removing
    return true; // Return true on success
  }
  return false; // Return false if not found
}

// Update a subscriber's last image hash
export async function updateSubscriber(
  chatId: number,
  lastImageHash: string
): Promise<Subscriber | null> {
  const subscribers = await getSubscribers();
  const index = subscribers.findIndex(
    (subscriber) => subscriber.chatId === chatId
  );
  if (index > -1) {
    subscribers[index].lastImageHash = lastImageHash;
    await saveSubscribers(subscribers); // Save subscribers after removing
    return subscribers[index];
  }
  return null;
}
