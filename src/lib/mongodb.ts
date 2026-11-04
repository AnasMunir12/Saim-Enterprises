import mongoose from "mongoose";
import { resolveSrv } from "node:dns/promises";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cached = globalWithMongoose.mongooseCache ?? { conn: null, promise: null };
let resolvedUriPromise: Promise<string> | null = null;

globalWithMongoose.mongooseCache = cached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Add it to your .env.local file.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  resolvedUriPromise ??= Promise.resolve(getMongoUri(uri));

  if (!cached.promise) {
    cached.promise = mongoose.connect(await resolvedUriPromise, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

async function getMongoUri(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  try {
    const parsed = new URL(uri);
    const seeds = await resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
    if (seeds.length === 0) {
      return uri;
    }

    const username = encodeURIComponent(decodeURIComponent(parsed.username));
    const password = encodeURIComponent(decodeURIComponent(parsed.password));
    const credentials = username ? `${username}:${password}@` : "";
    const hosts = seeds
      .map(({ name, port }) => `${name}:${port}`)
      .sort()
      .join(",");
    const options = new URLSearchParams(parsed.search);
    if (!options.has("tls") && !options.has("ssl")) {
      options.set("tls", "true");
    }
    return `mongodb://${credentials}${hosts}${parsed.pathname}?${options.toString()}`;
  } catch {
    return uri;
  }
}
