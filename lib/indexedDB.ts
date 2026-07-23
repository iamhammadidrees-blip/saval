import {
  openDB as openIndexedDB,
  type DBSchema,
  type IDBPDatabase,
} from "idb";

import type {
  BackupSnapshot,
  PendingPart,
  UploadedFile,
} from "@/lib/types";

const DATABASE_NAME = "pending-parts-db";
const DATABASE_VERSION = 1;

interface PendingPartsDB extends DBSchema {
  uploadedFiles: {
    key: string;
    value: UploadedFile;
  };
  pendingParts: {
    key: string;
    value: PendingPart;
    indexes: { byFileName: string };
  };
}

let databasePromise: Promise<IDBPDatabase<PendingPartsDB>> | undefined;

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }
}

export function openDB(): Promise<IDBPDatabase<PendingPartsDB>> {
  assertBrowser();

  databasePromise ??= openIndexedDB<PendingPartsDB>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains("uploadedFiles")) {
          database.createObjectStore("uploadedFiles", {
            keyPath: "fileName",
          });
        }

        if (!database.objectStoreNames.contains("pendingParts")) {
          const pendingParts = database.createObjectStore("pendingParts", {
            keyPath: "id",
          });
          pendingParts.createIndex("byFileName", "fileName");
        }
      },
    },
  );

  return databasePromise;
}

export async function getAllFiles(): Promise<UploadedFile[]> {
  const database = await openDB();
  return database.getAll("uploadedFiles");
}

export async function getAllPendingParts(): Promise<PendingPart[]> {
  const database = await openDB();
  return database.getAll("pendingParts");
}

export async function putFile(file: UploadedFile): Promise<void> {
  const database = await openDB();
  await database.put("uploadedFiles", file);
}

export async function putPendingParts(parts: PendingPart[]): Promise<void> {
  if (parts.length === 0) return;

  const database = await openDB();
  const transaction = database.transaction("pendingParts", "readwrite");

  await Promise.all([
    ...parts.map((part) => transaction.store.put(part)),
    transaction.done,
  ]);
}

export async function deleteByFileName(fileName: string): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(
    ["uploadedFiles", "pendingParts"],
    "readwrite",
  );

  await transaction.objectStore("uploadedFiles").delete(fileName);

  const fileNameIndex = transaction
    .objectStore("pendingParts")
    .index("byFileName");
  let cursor = await fileNameIndex.openCursor(fileName);

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await transaction.done;
}

export async function clearAll(): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(
    ["uploadedFiles", "pendingParts"],
    "readwrite",
  );

  await Promise.all([
    transaction.objectStore("uploadedFiles").clear(),
    transaction.objectStore("pendingParts").clear(),
    transaction.done,
  ]);
}

export async function exportSnapshot(): Promise<BackupSnapshot> {
  const database = await openDB();
  const transaction = database.transaction(
    ["uploadedFiles", "pendingParts"],
    "readonly",
  );

  const [files, pendingParts] = await Promise.all([
    transaction.objectStore("uploadedFiles").getAll(),
    transaction.objectStore("pendingParts").getAll(),
  ]);
  await transaction.done;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    files,
    pendingParts,
  };
}

export async function importSnapshot(
  snapshot: BackupSnapshot,
): Promise<void> {
  if (
    snapshot.version !== 1 ||
    !Array.isArray(snapshot.files) ||
    !Array.isArray(snapshot.pendingParts)
  ) {
    throw new Error("Invalid backup snapshot. Expected version 1.");
  }

  const database = await openDB();
  const transaction = database.transaction(
    ["uploadedFiles", "pendingParts"],
    "readwrite",
  );
  const uploadedFiles = transaction.objectStore("uploadedFiles");
  const pendingParts = transaction.objectStore("pendingParts");

  await uploadedFiles.clear();
  await pendingParts.clear();

  for (const file of snapshot.files) {
    await uploadedFiles.put(file);
  }

  for (const part of snapshot.pendingParts) {
    await pendingParts.put(part);
  }

  await transaction.done;
}
