/**
 * Seed script: Insert the PDF Scanner tool entry into MongoDB.
 * Run once via: node scripts/seed-pdf-scanner.mjs
 */
import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://nasir2242001_db_user:fUOi57GONFPh9ye9@toolshubcluster.do5hafc.mongodb.net/tools-hub?appName=toolsHubCluster";

const tool = {
  name: "PDF Scanner",
  description:
    "Convert photos to polished PDFs with CamScanner-like features: auto-enhance, filters, rotation, and drag-to-reorder pages.",
  iconName: "FileScan",
  href: "/tools/pdf-scanner",
  color: "bg-gradient-to-br from-blue-500 to-violet-600",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const client = new MongoClient(MONGODB_URI);

try {
  await client.connect();
  const db = client.db("tools-hub");
  const col = db.collection("tools");

  // Upsert — safe to run multiple times
  const result = await col.updateOne(
    { href: tool.href },
    { $set: tool },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log("✅ PDF Scanner tool inserted into DB.");
  } else {
    console.log("ℹ️  PDF Scanner entry already existed — updated in place.");
  }
} catch (err) {
  console.error("❌ Seed failed:", err);
  process.exit(1);
} finally {
  await client.close();
}
