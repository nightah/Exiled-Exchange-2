import { uIOhook, UiohookKey as Key } from "uiohook-napi";
import process from "process";
import type { HostClipboard } from "./HostClipboard";
import type { OverlayWindow } from "../windowing/OverlayWindow";

const PLACEHOLDER_LAST = "@last";
const PLACEHOLDER_WHISPER_REGEX = /[@\s]/g

export function clearAndPasteInChat(text: string, clipboard: Electron.Clipboard, modifiers: number[]) {
  clipboard.writeText(text);
  uIOhook.keyTap(Key.Enter);
  uIOhook.keyTap(Key.A, modifiers);
  uIOhook.keyTap(Key.V, modifiers);
}

export async function pasteWithPlaceholderInChat(text: string, clipboard: Electron.Clipboard, modifiers: number[], whisper: boolean) {
  uIOhook.keyTap(Key.Enter, modifiers)
  if (whisper) {
    const replacements = text.split(PLACEHOLDER_LAST).length -1;
    let first = replacements >= 1;
    uIOhook.keyTap(Key.A, modifiers);
    uIOhook.keyTap(Key.C, modifiers);
    await new Promise(resolve => setTimeout(resolve, 50));
    const player = clipboard.readText().replace(PLACEHOLDER_WHISPER_REGEX, "");
    clipboard.writeText(text.replaceAll(PLACEHOLDER_LAST, () => {
          if (first) {
            first = false;
            return "@" + player;
          }
          return player;
        })
    );
  } else {
    clipboard.writeText(text.replace(PLACEHOLDER_LAST, ""));
    uIOhook.keyTap(Key.Home);
    // press twice to focus input when using controller
    uIOhook.keyTap(Key.Home);
    uIOhook.keyTap(Key.Delete);
  }
  uIOhook.keyTap(Key.V, modifiers);
}

export async function sendInChat() {
  uIOhook.keyTap(Key.Enter);
  await new Promise(resolve => setTimeout(resolve, 50));
}

export async function typeInChat(
    text: string | string[],
    send: boolean,
    clipboard: HostClipboard,
    overlay: OverlayWindow,
) {
  clipboard.restoreShortly(async (clipboard) => {
    overlay.assertGameActive();
    await new Promise(resolve => setTimeout(resolve, 50));
    const modifiers = process.platform === "darwin" ? [Key.Meta] : [Key.Ctrl];
    if (typeof text === "string") {
      if (text.endsWith(PLACEHOLDER_LAST)) {
        await pasteWithPlaceholderInChat(text, clipboard, modifiers, false)
      } else if (text.startsWith(PLACEHOLDER_LAST)) {
        await pasteWithPlaceholderInChat(text, clipboard, modifiers, true)
      } else {
        clearAndPasteInChat(text, clipboard, modifiers)
      }
      if (send) {
        await sendInChat()
      }
    } else if (text.length > 1) {
      for (let i = 0; i < text.length; i++) {
        clearAndPasteInChat(text[i], clipboard, modifiers)
        if (send) {
          await sendInChat()
        }
      }
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
    uIOhook.keyTap(Key.F, [Key.Ctrl]);
    uIOhook.keyTap(Key.V, [
      process.platform === "darwin" ? Key.Meta : Key.Ctrl,
    ]);
    uIOhook.keyTap(Key.Enter);
  });
}