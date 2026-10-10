// Idempotent: promotes (or creates) the single super admin account.
// Usage: node scripts/ensure-admin.mjs            (ADMIN_EMAIL defaults to saimenterprises@gmail.com)
//        ADMIN_EMAIL=x@y.com ADMIN_PASSWORD=... node scripts/ensure-admin.mjs
// An existing password is never overwritten. A new account needs ADMIN_PASSWORD (or gets a Google-only login).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || line.trim().startsWith("#")) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
  } catch {
    // no env file; rely on the real environment
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set (.env.local).");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL || "saimenterprises@gmail.com").trim().toLowerCase();

await mongoose.connect(uri);
try {
  const users = mongoose.connection.collection("users");
  const existing = await users.findOne({ email });

  if (existing) {
    const update = {};
    if (existing.role !== "admin") update.role = "admin";
    if (!existing.passwordHash && process.env.ADMIN_PASSWORD) {
      update.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    }
    if (Object.keys(update).length) {
      await users.updateOne({ _id: existing._id }, { $set: { ...update, updatedAt: new Date() } });
      console.log(`Updated ${email}: ${Object.keys(update).map((k) => (k === "passwordHash" ? "password set (was empty)" : `${k}=${update[k]}`)).join(", ")}`);
    } else {
      console.log(`${email} is already an admin. Nothing to do.`);
    }
  } else {
    const doc = {
      name: process.env.ADMIN_NAME || "Super Admin",
      email,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (process.env.ADMIN_PASSWORD) {
      doc.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    } else {
      console.warn("ADMIN_PASSWORD not set: created without a password (Google sign-in only).");
    }
    await users.insertOne(doc);
    console.log(`Created admin ${email}.`);
  }
} finally {
  await mongoose.disconnect();
}
