import {
  RULESET_HASH,
  type Command,
  type Configuration,
  type View,
} from "../../../../packages/game-core/src/v1";
import type { Choice } from "./types";

export interface OnlineState {
  view: View;
  player: string;
  revision: number;
  persistence: "memory" | "postgres";
  occupied: string[];
  connected: string[];
  clock: {
    round: number;
    remainingMs: number;
    runningSince: number | null;
  } | null;
  serverNow: number;
}
export type OnlineOptions = Omit<Configuration, "seed">;
interface Request {
  message: { type: "command"; revision: number; command: Command };
  resolve: (ok: boolean) => void;
  timeout: ReturnType<typeof setTimeout>;
}
export class Connection {
  private socket: WebSocket | null = null;
  private stopped = false;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private requests = new Map<string, Request>();
  private revision = 0;
  private actor = "";
  private credential: string;
  private confirmed = false;
  private readonly endpoint: string;
  private readonly key: string;
  constructor(
    private room: string,
    private options: OnlineOptions | null,
    private receive: (state: OnlineState) => void,
    private error: (text: string) => void,
    private status: (text: string) => void,
  ) {
    this.endpoint =
      import.meta.env.VITE_GAME_SERVER ??
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8787/v1`;
    this.key = "wardogs:v1:credential:" + this.endpoint + ":" + room;
    const stored = sessionStorage.getItem(this.key);
    this.confirmed =
      !!stored && sessionStorage.getItem(this.key + ":confirmed") === "yes";
    this.credential =
      stored ??
      btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    sessionStorage.setItem(this.key, this.credential);
  }
  connect() {
    this.stopped = false;
    this.status(
      this.confirmed ? "Genopretter din plads…" : "Forbinder til bordet…",
    );
    const socket = new WebSocket(this.endpoint);
    this.socket = socket;
    socket.onopen = () =>
      socket.send(
        JSON.stringify(
          this.options && !this.confirmed
            ? {
                type: "create",
                room: this.room,
                options: this.options,
                token: this.credential,
              }
            : {
                type: "join",
                room: this.room,
                ...(this.confirmed
                  ? { token: this.credential }
                  : { claimToken: this.credential }),
              },
        ),
      );
    socket.onmessage = (event) => {
      let message: any;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        this.error("Bordet sendte en ulæselig besked.");
        this.close();
        return;
      }
      if (message.type === "state") {
        if (
          message.edition !== "wardogs-1.0" ||
          message.view?.version !== 2 ||
          message.view?.rulesHash !== RULESET_HASH ||
          !Array.isArray(message.view.players) ||
          message.view.players.length < 2 ||
          message.view.players.length > 5
        ) {
          this.error(
            "Bordet og siden bruger forskellige spiludgaver. Opdatér siden, før du fortsætter.",
          );
          this.close();
          return;
        }
        const joining = !!message.token;
        if (joining) {
          this.credential = message.token;
          sessionStorage.setItem(this.key, this.credential);
          sessionStorage.setItem(this.key + ":confirmed", "yes");
          this.confirmed = true;
          this.attempts = 0;
        }
        this.actor = message.player;
        this.revision = message.revision;
        this.receive({
          view: message.view,
          player: message.player,
          revision: message.revision,
          persistence: message.persistence,
          occupied: message.occupied,
          connected: message.connected,
          clock: message.clock,
          serverNow: message.serverNow,
        });
        this.status("Forbundet");
        if (joining)
          for (const request of this.requests.values())
            socket.send(JSON.stringify(request.message));
      } else if (message.type === "ack") {
        this.complete(message.id, true);
      } else if (message.type === "error") {
        this.error(
          typeof message.error === "string"
            ? message.error
            : "Valget blev afvist.",
        );
        if (message.id) this.complete(message.id, false);
        else if (message.fatal) {
          this.status("Forbindelsen kræver opmærksomhed");
          this.close();
        }
      }
    };
    socket.onerror = () =>
      this.status("Forbindelsen blev afbrudt. Forsøger igen…");
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.stopped) return;
      this.status("Forbindelsen er tabt. Din plads er reserveret.");
      if (this.attempts >= 6) {
        this.error(
          "Bordet kunne ikke nås. Bevar denne fane, og prøv at genforbinde.",
        );
        return;
      }
      this.reconnectTimer = setTimeout(
        () => this.connect(),
        Math.min(15000, 1000 * 2 ** this.attempts++),
      );
    };
  }
  send(command: Choice) {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.actor) {
      this.error("Vent på, at din plads er genforbundet.");
      return Promise.resolve(false);
    }
    const id = crypto.randomUUID();
    const message = {
      type: "command" as const,
      revision: this.revision,
      command: { ...command, id, player: this.actor } as Command,
    };
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.error(
          "Handlingen er endnu ikke bekræftet. Genforbindelsen kontrollerer samme valg igen.",
        );
        this.reconnect();
      }, 60000);
      this.requests.set(id, { message, resolve, timeout });
      this.socket!.send(JSON.stringify(message));
    });
  }
  private complete(id: string, ok: boolean) {
    const request = this.requests.get(id);
    if (request) {
      clearTimeout(request.timeout);
      this.requests.delete(id);
      request.resolve(ok);
    }
  }
  controlTimer(action: "pause" | "resume" | "reset") {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(
        JSON.stringify({ type: "timer", revision: this.revision, action }),
      );
  }
  reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.attempts = 0;
    this.socket?.close();
    this.connect();
  }
  close() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    for (const id of this.requests.keys()) this.complete(id, false);
  }
}
