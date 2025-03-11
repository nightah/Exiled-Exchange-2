import { promises as fs, watchFile, unwatchFile } from "fs";
import path from "path";
import { app } from "electron";
import { guessFileLocation } from "./utils";
import { ServerEvents } from "../server";
import { Logger } from "../RemoteLogger";
import type { EventEmitter } from "events";

const POSSIBLE_PATH =
  process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile 2\\logs\\Client.txt",
        "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\Client.txt",
      ]
    : process.platform === "linux"
      ? [
          path.join(
            app.getPath("home"),
            ".wine/drive_c/Program Files (x86)/Grinding Gear Games/Path of Exile 2/logs/Client.txt",
          ),
          path.join(
            app.getPath("home"),
            ".local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt",
          ),
        ]
      : process.platform === "darwin"
        ? [
            path.join(
              app.getPath("home"),
              "Library/Caches/com.GGG.PathOfExile/Logs/Client.txt",
            ),
          ]
        : [];

export class GameLogWatcher {
  private _wantedPath: string | null = null;
  private _resolvedPath: string | null = null;
  private _isEnabled: boolean = false;

  private _state: {
    offset: number;
    path: string;
    file: fs.FileHandle;
    isReading: boolean;
    readBuff: Buffer;
  } | null = null;

  constructor(
    private server: ServerEvents,
    private logger: Logger,
    private internalEvents: EventEmitter,
  ) {
    this.internalEvents.on("config", async (rawConfig) => {
      const config: { isLogWatcherEnabled: boolean } = JSON.parse(rawConfig);
      this._isEnabled = config.isLogWatcherEnabled;

      if (this._state && !this._isEnabled) {
        unwatchFile(this._state.path);
        await this._state.file.close();
        this._state = null;
      } else if (!this._state && this._isEnabled) {
        this.tryStart();
      }
    });
  }

  async setup(logFile: string) {
    if (this._wantedPath === logFile) return;

    this._wantedPath = logFile;
    if (this._state) {
      unwatchFile(this._state.path);
      await this._state.file.close();
      this._state = null;
    }

    this._resolvedPath = logFile;

    if (!logFile.length) {
      const guessedPath = await guessFileLocation(POSSIBLE_PATH);
      if (guessedPath === null) {
        this._resolvedPath = null;
        this.logger.write(
          "error [GameLogWatcher] Failed to locate PoE log file.",
        );
        return;
      }
      this._resolvedPath = guessedPath;
    }
  }

  async tryStart() {
    if (!this._resolvedPath || !this._isEnabled) return;

    await this.initializeGameLogVariables();

    try {
      const file = await fs.open(this._resolvedPath, "r");
      const stats = await file.stat();
      watchFile(
        this._resolvedPath,
        { interval: 450 },
        this.handleFileChange.bind(this),
      );
      this._state = {
        path: this._resolvedPath,
        file,
        offset: stats.size,
        isReading: false,
        readBuff: Buffer.allocUnsafe(64 * 1024),
      };
      this.logger.write(
        `info [GameLogWatcher] Watching PoE log file:\n${this._resolvedPath}`,
      );
    } catch {
      this.logger.write("error [GameLogWatcher] Failed to watch PoE log file.");
    }
  }

  private handleFileChange() {
    if (this._state && !this._state.isReading) {
      this._state.isReading = true;
      this.readToEOF();
    }
  }

  private async readToEOF() {
    if (!this._state) return;

    const { file, readBuff, offset } = this._state;
    const { bytesRead } = await file.read(readBuff, 0, readBuff.length, offset);

    if (bytesRead) {
      const str = readBuff.toString("utf8", 0, bytesRead);
      const lines = str
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length);
      this.server.sendEventTo("broadcast", {
        name: "MAIN->CLIENT::game-log",
        payload: { lines },
      });
    }

    if (bytesRead) {
      this._state.offset += bytesRead;
      this.readToEOF();
    } else {
      this._state.isReading = false;
    }
  }

  private async initializeGameLogVariables() {
    if (!this._resolvedPath) return;

    try {
      const file = await fs.open(this._resolvedPath, "r");
      const stats = await file.stat();
      const readBuff = Buffer.allocUnsafe(64 * 1024);
      const { bytesRead } = await file.read(
        readBuff,
        0,
        readBuff.length,
        stats.size - readBuff.length,
      );

      if (bytesRead) {
        const str = readBuff.toString("utf8", 0, bytesRead);
        const lines = str
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length);

        let lastToFromMessage = "";
        let lastGeneratingLevelMessage = "";

        const toFromPattern = /(@To\s|@From\s)[\w\s]+:.*$/;
        const generatingLevelPattern = /Generating level.*$/;

        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];

          if (!lastToFromMessage && toFromPattern.test(line)) {
            lastToFromMessage = line;
          }

          if (
            !lastGeneratingLevelMessage &&
            generatingLevelPattern.test(line)
          ) {
            lastGeneratingLevelMessage = line;
          }

          if (lastToFromMessage && lastGeneratingLevelMessage) {
            await file.close();
            break;
          }
        }

        const payload = [lastToFromMessage, lastGeneratingLevelMessage];
        this.server.sendEventTo("broadcast", {
          name: "MAIN->CLIENT::game-log",
          payload: { lines: payload },
        });
      }
    } catch (error) {
      this.logger.write(
        "error [GameLogWatcher] Failed to initialize game log variables from PoE log file.",
      );
    }
  }
}
