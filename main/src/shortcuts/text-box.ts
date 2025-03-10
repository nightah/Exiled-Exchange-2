import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import process from "process";
import type { HostClipboard } from "./HostClipboard";
import type { OverlayWindow } from "../windowing/OverlayWindow";

const PLACEHOLDER_LAST = "@last";
const PLACEHOLDER_CHAIN = "&&";

function keyTapWithModifiers(key: number, modifiers: number[]) {
  uIOhook.keyTap(key, modifiers);
}

function replacePlaceholders(
  text: string,
  player: string,
  whisper: boolean,
): string {
  if (text.match(new RegExp(PLACEHOLDER_LAST, "g") || [])?.length === 1)
    return text.replace(`${PLACEHOLDER_LAST} `, "");

  let firstReplacement: boolean = whisper;
  return text.replaceAll(PLACEHOLDER_LAST, () => {
    if (firstReplacement) {
      firstReplacement = false;
      return `@${player}`;
    }
    return player;
  });
}

function splitText(text: string | string[]): string[] {
  return typeof text === "string" && text.includes(PLACEHOLDER_CHAIN)
    ? text.split(PLACEHOLDER_CHAIN)
    : Array.isArray(text)
      ? text
      : [text];
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function clearAndPasteInChat(
  text: string,
  clipboard: Electron.Clipboard,
  modifiers: number[],
) {
  clipboard.writeText(text);
  keyTapWithModifiers(Key.Enter, []);
  keyTapWithModifiers(Key.A, modifiers);
  keyTapWithModifiers(Key.V, modifiers);
}

export function pasteWithPlaceholderInChat(
  text: string,
  player: string,
  clipboard: Electron.Clipboard,
  modifiers: number[],
  whisper: boolean,
) {
  keyTapWithModifiers(Key.Enter, modifiers);
  clipboard.writeText(replacePlaceholders(text, player, whisper));

  if (!whisper) {
    keyTapWithModifiers(Key.Home, []);
    keyTapWithModifiers(Key.Home, []); // Press twice to focus input when using a controller
    keyTapWithModifiers(Key.Delete, []);
  }

  keyTapWithModifiers(Key.V, modifiers);
}

export async function sendInChat() {
  keyTapWithModifiers(Key.Enter, []);
  await delay(50);
}

export async function typeInChat(
  text: string | string[],
  gameLogVariables: Map<any, any>,
  send: boolean,
  clipboard: HostClipboard,
  overlay: OverlayWindow,
) {
  clipboard.restoreShortly(async (clipboard) => {
    overlay.assertGameActive();
    await delay(50);

    const modifiers = process.platform === "darwin" ? [Key.Meta] : [Key.Ctrl];
    const texts = splitText(text);

    for (const line of texts) {
      const whisper = line.startsWith(PLACEHOLDER_LAST);
      if (line.includes(PLACEHOLDER_LAST)) {
        pasteWithPlaceholderInChat(
          line,
          gameLogVariables.get("lastWhisperedPlayer"),
          clipboard,
          modifiers,
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
    keyTapWithModifiers(Key.V, [
      process.platform === "darwin" ? Key.Meta : Key.Ctrl,
    ]);
    keyTapWithModifiers(Key.Enter, []);
  });
}
