"use strict";

import { app } from "electron";
import { uIOhook } from "uiohook-napi";
import os from "node:os";
import { startServer, eventPipe, server } from "./server";
import { Logger } from "./RemoteLogger";
import { GameWindow } from "./windowing/GameWindow";
import { OverlayWindow } from "./windowing/OverlayWindow";
import { GameConfig } from "./host-files/GameConfig";
import { Shortcuts } from "./shortcuts/Shortcuts";
import { AppUpdater } from "./AppUpdater";
import { AppTray } from "./AppTray";
import { OverlayVisibility } from "./windowing/OverlayVisibility";
import { GameLogWatcher } from "./host-files/GameLogWatcher";
import { HttpProxy } from "./proxy";
import { installExtension, VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { FilterGenerator } from "./filter-generator/FilterGenerator";
import { EventEmitter } from "events";

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

if (process.platform !== "darwin") {
  app.disableHardwareAcceleration();
}
app.enableSandbox();

let tray: AppTray;

app.on("ready", async () => {
  tray = new AppTray(eventPipe);
  const internalEvents = new EventEmitter();
  const logger = new Logger(eventPipe);
  const gameLogWatcher = new GameLogWatcher(eventPipe, logger, internalEvents);
  const gameConfig = new GameConfig(eventPipe, logger);
  const poeWindow = new GameWindow();
  const appUpdater = new AppUpdater(eventPipe);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _httpProxy = new HttpProxy(server, logger);

  if (process.env.VITE_DEV_SERVER_URL) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
      logger.write("info Vue Devtools installed");
    } catch (error) {
      logger.write(`error installing Vue Devtools: ${error}`);
      console.log(`error installing Vue Devtools: ${error}`);
    }
  }

  setTimeout(
    async () => {
      const overlay = new OverlayWindow(eventPipe, logger, poeWindow);
      // eslint-disable-next-line no-new
      new OverlayVisibility(eventPipe, overlay, gameConfig);
      const shortcuts = await Shortcuts.create(
        logger,
        overlay,
        poeWindow,
        gameConfig,
        eventPipe,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const filterGenerator = new FilterGenerator(
        logger,
        gameConfig,
        eventPipe,
      );
      eventPipe.onEventAnyClient(
        "CLIENT->MAIN::update-host-config",
        async (cfg) => {
          overlay.updateOpts(cfg.overlayKey, cfg.windowTitle);
          shortcuts.updateActions(
            cfg.shortcuts,
            cfg.stashScroll,
            cfg.logKeys,
            cfg.restoreClipboard,
            cfg.language,
          );
          await gameLogWatcher.setup(cfg.clientLog ?? "");
          gameLogWatcher.tryStart();
          gameConfig.readConfig(cfg.gameConfig ?? "");
          appUpdater.checkAtStartup();
          tray.overlayKey = cfg.overlayKey;
        },
      );
      uIOhook.start();
      const port = await startServer(appUpdater, logger, internalEvents);
      // TODO: move up (currently crashes)
      logger.write(`info ${os.type()} ${os.release} / v${app.getVersion()}`);
      overlay.loadAppPage(port);
      tray.serverPort = port;
    },
    // fixes(linux): window is black instead of transparent
    process.platform === "linux" ? 1000 : 0,
  );
});
