import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const configData = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(configData);
const db = getFirestore(app, configData.firestoreDatabaseId);

async function test() {
  try {
    const d = await getDoc(doc(db, "test", "test"));
    console.log("Success:", d.exists());
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
test();
