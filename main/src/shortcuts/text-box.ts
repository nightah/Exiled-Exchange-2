import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import process from "process";
import type { HostClipboard } from "./HostClipboard";
import type { OverlayWindow } from "../windowing/OverlayWindow";
import { gameLogKeys } from "./Shortcuts";

const PLACEHOLDERS = { CHAIN: "&&", AREA: "@area", LAST: "@last" };

export async function typeInChat(
  text: string | string[],
  gameLogVariables: Map<string, string | undefined>,
  send: boolean,
  clipboard: HostClipboard,
  overlay: OverlayWindow,
) {
  clipboard.restoreShortly(async (clipboard) => {
    const modifiers = getPlatformModifiers();
    const texts = Array.isArray(text) ? text : splitText(text);

    overlay.assertGameActive();
    await delay(50);

    for (const line of texts) {
      const whisper = line.startsWith(PLACEHOLDERS.LAST);
      if (line.includes(PLACEHOLDERS.LAST)) {
        pasteWithPlaceholderInChat(
          line,
          clipboard,
          modifiers,
          gameLogVariables,
          whisper,
        );
      } else {
        clearAndPasteInChat(line, clipboard, modifiers);
      }
      if (send) await sendInChat();
    }
  });
}

export function stashSearch(
  text: string,
  clipboard: HostClipboard,
  overlay: OverlayWindow,
) {
  clipboard.restoreShortly((clipboard) => {
    overlay.assertGameActive();
    clipboard.writeText(text);
    keyTapWithModifiers(Key.F, [Key.Ctrl]);
    keyTapWithModifiers(Key.V, getPlatformModifiers());
    keyTapWithModifiers(Key.Enter);
  });
}

function keyTapWithModifiers(key: number, modifiers: number[] = []) {
  uIOhook.keyTap(key, modifiers);
}

function getPlatformModifiers(): number[] {
  return process.platform === "darwin" ? [Key.Meta] : [Key.Ctrl];
}

function splitText(text: string): string[] {
  return text.split(PLACEHOLDERS.CHAIN);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function replacePlaceholders(
  text: string,
  gameLogVariables: Map<string, string | undefined>,
  whisper: boolean,
): string {
  if (text.match(new RegExp(PLACEHOLDERS.LAST, "g"))?.length === 1) {
    return text.replace(PLACEHOLDERS.LAST, "").trimStart();
  }

  if (text.includes(PLACEHOLDERS.AREA)) {
    text = text.replaceAll(
      PLACEHOLDERS.AREA,
      <string>gameLogVariables.get(gameLogKeys.areaName) ?? "Unknown Location",
    );
  }

  let firstReplacement: boolean = whisper;
  return text.replaceAll(PLACEHOLDERS.LAST, () => {
    const playerName =
      gameLogVariables.get(gameLogKeys.playerName) ?? "undefined";
    return firstReplacement
      ? ((firstReplacement = false), `@${playerName}`)
      : playerName;
  });
}

export function clearAndPasteInChat(
  text: string,
  clipboard: Electron.Clipboard,
  modifiers: number[],
) {
  clipboard.writeText(text);
  keyTapWithModifiers(Key.Enter);
  keyTapWithModifiers(Key.A, modifiers);
  keyTapWithModifiers(Key.V, modifiers);
}

function pasteWithPlaceholderInChat(
  text: string,
  clipboard: Electron.Clipboard,
  modifiers: number[],
  gameLogVariables: Map<string, string | undefined>,
  whisper: boolean,
) {
  keyTapWithModifiers(Key.Enter, modifiers);
  clipboard.writeText(replacePlaceholders(text, gameLogVariables, whisper));

  if (!whisper) {
    keyTapWithModifiers(Key.Home);
    keyTapWithModifiers(Key.Home); // Press twice to focus input when using a controller
    keyTapWithModifiers(Key.Delete);
  }

  keyTapWithModifiers(Key.V, modifiers);
}

async function sendInChat() {
  keyTapWithModifiers(Key.Enter, []);
  await delay(50);
}
