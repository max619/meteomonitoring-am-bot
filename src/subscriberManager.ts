import Database from "better-sqlite3";

type Subscriber = {
  chatId: number;
  lastImageHash: string;
};

const dbFilePath = "subscribers.db"; // SQLite database file
const db = new Database(dbFilePath); // Initialize the database

// Initialize the database and create the subscribers table if it doesn't exist
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      chatId INTEGER PRIMARY KEY,
      lastImageHash TEXT
    )
  `);
}

// Load subscribers from the database
export function getSubscribers(): Subscriber[] {
  return db.prepare("SELECT * FROM subscribers").all() as Subscriber[];
}

// Add a subscriber
export function addSubscriber(chatId: number): boolean {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO subscribers (chatId, lastImageHash) VALUES (?, ?)"
  );
  const result = stmt.run(chatId, ""); // Attempt to insert the new subscriber

  return result.changes > 0; // Return true if a new subscriber was added, false if already exists
}

// Remove a subscriber
export function removeSubscriber(chatId: number): boolean {
  const result = db
    .prepare("DELETE FROM subscribers WHERE chatId = ?")
    .run(chatId);
  return result.changes > 0; // Return true if a subscriber was deleted
}

// Update a subscriber's last image hash
export function updateSubscriber(
  chatId: number,
  lastImageHash: string
): Subscriber | null {
  const stmt = db.prepare(
    "UPDATE subscribers SET lastImageHash = ? WHERE chatId = ?"
  );
  const result = stmt.run(lastImageHash, chatId); // Directly update the subscriber's last image hash

  if (result.changes > 0) {
    return { chatId, lastImageHash }; // Return the updated subscriber
  }
  return null; // Return null if the subscriber was not found
}

// update multiple subscribers
export function updateSubscribers(subscribers: Subscriber[]): void {
  const stmt = db.prepare(
    "UPDATE subscribers SET lastImageHash = ? WHERE chatId = ?"
  );
  const transaction = db.transaction((subs: Subscriber[]) => {
    for (const subscriber of subs) {
      stmt.run(subscriber.lastImageHash, subscriber.chatId);
    }
  });
  transaction(subscribers); // Execute the transaction
}

// Initialize the database when the module is loaded
initDatabase();
