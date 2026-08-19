import Database from "better-sqlite3";

export type Subscriber = {
  chatId: number;
  lastForecastHash: string;
};

const dbFilePath = "subscribers.db"; // SQLite database file
const db = new Database(dbFilePath); // Initialize the database

// Initialize the database and create the subscribers table if it doesn't exist
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      chatId INTEGER PRIMARY KEY,
      lastForecastHash TEXT
    )
  `);

  migrateImageHashColumn();
}

// Databases created before the bot switched from images to the forecast API
// still have the lastImageHash column
function migrateImageHashColumn() {
  const columns = db
    .prepare("PRAGMA table_info(subscribers)")
    .all() as { name: string }[];
  const hasColumn = (name: string) =>
    columns.some((column) => column.name === name);

  if (!hasColumn("lastImageHash")) {
    return;
  }

  if (hasColumn("lastForecastHash")) {
    db.exec("ALTER TABLE subscribers DROP COLUMN lastImageHash");
    return;
  }

  db.exec(
    "ALTER TABLE subscribers RENAME COLUMN lastImageHash TO lastForecastHash"
  );
  // The stored hashes belong to images, so reset them to send the forecast once
  db.exec("UPDATE subscribers SET lastForecastHash = ''");
  console.log("Migrated subscribers table from lastImageHash to lastForecastHash");
}

// Load subscribers from the database
export function getSubscribers(): Subscriber[] {
  return db.prepare("SELECT * FROM subscribers").all() as Subscriber[];
}

// Add a subscriber
export function addSubscriber(chatId: number): boolean {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO subscribers (chatId, lastForecastHash) VALUES (?, ?)"
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

// Update a subscriber's last forecast hash
export function updateSubscriber(
  chatId: number,
  lastForecastHash: string
): Subscriber | null {
  const stmt = db.prepare(
    "UPDATE subscribers SET lastForecastHash = ? WHERE chatId = ?"
  );
  const result = stmt.run(lastForecastHash, chatId); // Directly update the subscriber's last forecast hash

  if (result.changes > 0) {
    return { chatId, lastForecastHash }; // Return the updated subscriber
  }
  return null; // Return null if the subscriber was not found
}

// update multiple subscribers
export function updateSubscribers(subscribers: Subscriber[]): void {
  const stmt = db.prepare(
    "UPDATE subscribers SET lastForecastHash = ? WHERE chatId = ?"
  );
  const transaction = db.transaction((subs: Subscriber[]) => {
    for (const subscriber of subs) {
      stmt.run(subscriber.lastForecastHash, subscriber.chatId);
    }
  });
  transaction(subscribers); // Execute the transaction
}

// Initialize the database when the module is loaded
initDatabase();
