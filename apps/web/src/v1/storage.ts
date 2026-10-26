import { openDB } from "idb";
import {
  exportGame,
  importGame,
  type Game,
} from "../../../../packages/game-core/src/v1";
let database: ReturnType<typeof openDB> | null = null;
const open = () =>
  (database ??= openDB("wardogs-v1", 1, {
    upgrade(db) {
      db.createObjectStore("saves");
    },
  }).catch((error) => {
    database = null;
    throw error;
  }));
export async function saveLocal(game: Game) {
  const db = await open();
  await db.put("saves", exportGame(game), "current");
}
export async function loadLocal() {
  const db = await open();
  const raw = await db.get("saves", "current");
  if (typeof raw !== "string")
    throw new Error("Der er endnu ikke et gemt v1-bord i denne browser.");
  return importGame(raw);
}
export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function randomSeed() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
