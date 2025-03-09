<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      :class="['widget-default-style', $style['trade-viewer']]"
      v-if="!isElectron || !isMinimized || activeTrades.length"
      style="min-width: 5rem"
    >
      <div
        class="text-gray-100 p-1 pb-0 flex items-center justify-between gap-2"
      >
        <span class="truncate">{{ t("trade_viewer.name") }}</span>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <div v-if="!isLogWatcherEnabled" class="p-3">
          {{ t("trade_viewer.logging_is_disabled") }}
        </div>
        <div
          v-else
          v-for="(trade, tradeIdx) in activeTrades.slice(0, 4)"
          :key="trade.id"
          class="rounded p-2 text-gray-100 border-b-gray-800 border-b-2 last:border-b-0"
        >
          <template v-if="activeTrades.length <= 4 || tradeIdx < 3">
            <div class="relative pr-6">
              <div class="text-base leading-4">{{ trade.item }}</div>
              <div class="pl-3 leading-5">
                {{ t("trade_viewer.price") }} {{ trade.priceAmount }}x
                {{ trade.priceName }}
                ({{ trade.stashName }}, x: {{ trade.stashLeft }}, y:
                {{ trade.stashTop }})
              </div>
              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800 absolute -top-1.5 right-0 leading-4"
                v-if="!isElectron || !isMinimized"
                @click="ignoreTrade(trade)"
              >
                <i class="fas fa-times text-gray-400 w-4 h-4" />
              </button>
              <div
                class="absolute top-0 right-0 leading-4"
                v-else-if="Object.keys(trade.buyers).length > 1"
              >
                ({{ Object.keys(trade.buyers).length }})
              </div>
            </div>

            <div
              v-for="(buyer, buyerIdx) in Object.keys(trade.buyers).filter(
                (_, idx) => idx < 4,
              )"
              v-if="!isMinimized"
              class="flex flex-row gap-1 items-center mt-1 leading-4"
            >
              <div
                class="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap h-6 leading-6"
              >
                {{
                  buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4
                    ? buyer
                    : t("trade_viewer.andXMore", [
                        Object.keys(trade.buyers).length - 3,
                      ])
                }}
              </div>

              <div
                class="overflow-hidden overflow-ellipsis whitespace-nowrap h-6 leading-6"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
              >
                {{ trade.buyers[buyer].ref }}
              </div>

              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                @click="messagePlayer(buyer)"
              >
                <i class="fas fa-paper-plane text-gray-400 w-4 h-4" />
              </button>
              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                @click="invitePlayer(buyer)"
              >
                <i class="fas fa-user-plus text-gray-400 w-4 h-4" />
              </button>
              <button
                  class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                  v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                  @click="kickPlayer(buyer)"
              >
                <i class="fas fa-user-minus text-gray-400 w-4 h-4" />
              </button>
              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                @click="tradePlayer(buyer)"
              >
                <i class="fas fa-cart-shopping text-gray-400 w-4 h-4" />
              </button>
              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                @click="sendThanks(buyer, trade)"
              >
                <i class="fas fa-thumbs-up text-gray-400 w-4 h-4" />
              </button>
              <button
                class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
                v-if="buyerIdx !== 3 || Object.keys(trade.buyers).length <= 4"
                @click="ignorePlayer(buyer, trade)"
              >
                <i class="fas fa-times text-gray-400 w-4 h-4" />
              </button>
            </div>
          </template>
          <template v-else-if="activeTrades.length > 4 && tradeIdx === 3">
            <div>
              {{ t("trade_viewer.andXMore", [activeTrades.length - 3]) }} ({{
                t("trade_viewer.price")
              }}
              {{ countExcessProfit() }})
            </div>
          </template>
        </div>
      </div>
    </div>
  </Widget>
</template>

<style lang="postcss" module>
.trade-viewer {
  @apply p-1;
  @apply flex;
  @apply flex-col;
  @apply overflow-y-auto;
  @apply min-h-0;
  width: 380px;
}
</style>

<script lang="ts">
import type { TradeViewerWidget } from "./widget";

export default {
  widget: {
    type: "trade-viewer",
    instances: "single",
    initInstance: (): TradeViewerWidget => ({
      wmId: 0,
      wmType: "trade-viewer",
      wmTitle: "{icon=fa-sack-dollar}",
      wmWants: "hide",
      wmZorder: 106,
      wmFlags: [],
      anchor: {
        pos: "tl",
        x: 85.05,
        y: 26,
      },
    }),
  },
};
</script>

<script setup lang="ts">
import { computed, inject, ref, type Ref, shallowRef } from "vue";
import Widget from "../overlay/Widget.vue";
import { useI18n } from "vue-i18n";
import { Host, MainProcess } from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";
import { MessageChannel, parseLine } from "./client-log";
import { AppConfig } from "../Config";

const props = defineProps<{
  config: TradeViewerWidget;
}>();

interface TradeRequest {
  id: string;
  item: string;
  priceName: string;
  priceAmount: number;
  stashName?: string;
  stashLeft?: number;
  stashTop?: number;
  buyers: Record<string, { ref: unknown; timestamp: number }>;
}

const wm = inject<WidgetManager>("wm")!;
const { t } = useI18n();
const isMinimized: Ref<boolean> = ref(true);
let countTimePID: ReturnType<typeof setInterval> | undefined;
const activeTrades: Ref<Array<TradeRequest>> = ref([]);
const isLogWatcherEnabled = computed(() => AppConfig().isLogWatcherEnabled);
const isElectron = navigator.userAgent.includes("Electron");

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: 85.05,
    y: 26,
  };
  wm.show(props.config.wmId);
}

Host.onEvent("MAIN->OVERLAY::focus-change", (state) => {
  isMinimized.value = !state.overlay;
});

Host.onEvent("MAIN->CLIENT::game-log", (e) => {
  for (const line of e.lines) {
    const message = parseLine(line);

    switch (message?.channel) {
      case MessageChannel.WHISPER_FROM:
        break;
      case MessageChannel.WHISPER_TO:
        break;
      default:
        continue;
    }

    Host.sendEvent({
      name: "CLIENT->MAIN::last-whispered-player",
      payload: {playerName: message.charName as string},
    });

    if (!message?.charName || !message?.trade) {
      continue;
    }

    const tradeId = [
      message.trade.item.name.toLowerCase().replaceAll(/[\s,]+/g, "-"),
      (message.trade.tab?.name ?? "bulk")
        .toLowerCase()
        .replaceAll(/[\s,]+/g, "-"),
      message.trade.tab?.left,
      message.trade.tab?.top,
    ]
      .filter((e) => e)
      .join("-");

    const existingTrade = activeTrades.value.find(
      (trade) => trade.id === tradeId,
    );

    if (existingTrade) {
      existingTrade.buyers[message.charName] = {
        ref: shallowRef(parseTimeSince(Date.now())),
        timestamp: Date.now(),
      };
    } else {
      activeTrades.value.push({
        id: tradeId,
        item: message.trade.item.name,
        priceName: message.trade.price.name,
        priceAmount: message.trade.price.amount,
        stashName: message.trade.tab?.name,
        stashLeft: message.trade.tab?.left,
        stashTop: message.trade.tab?.top,
        buyers: {
          [message.charName]: {
            ref: shallowRef(parseTimeSince(Date.now())),
            timestamp: Date.now(),
          },
        },
      });
      updateCountTimeInterval();
    }
  }
});

function sendChatEvent(text: string | string[], player: string, send: boolean) {
  MainProcess.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: {
      action: "paste-in-chat",
      text,
      player,
      send,
    },
  });
}

function messagePlayer(player: string) {
  sendChatEvent(`@${player} `, player, false);
}

function invitePlayer(player: string) {
  sendChatEvent(`/invite ${player}`, player, true);
}

function kickPlayer(player: string) {
  sendChatEvent(`/kick ${player}`, player, true)
}

function tradePlayer(player: string) {
  sendChatEvent(`/tradewith ${player}`, player, true);
}

function sendThanks(player: string, trade: TradeRequest) {
  sendChatEvent([`@${player} Thanks ${player}, good luck and have a nice day!`, `/kick ${player}`], player, true);
  ignoreTrade(trade);
}

function ignorePlayer(player: string, trade: TradeRequest) {
  delete trade.buyers[player];
  if (Object.keys(trade.buyers).length === 0) {
    activeTrades.value = activeTrades.value.filter((el) => el.id !== trade.id);
    updateCountTimeInterval();
  }
}

function ignoreTrade(trade: TradeRequest) {
  activeTrades.value = activeTrades.value.filter(
    (el: TradeRequest) => el.id !== trade.id,
  );
  updateCountTimeInterval();
}

function updateCountTimeInterval() {
  if (activeTrades.value.length === 0 && countTimePID !== undefined) {
    clearInterval(countTimePID);
    countTimePID = undefined;
  }

  if (activeTrades.value.length > 0 && countTimePID === undefined) {
    countTime();
    countTimePID = setInterval(countTime, 1000);
  }
}

function countTime() {
  activeTrades.value.forEach((trade) => {
    Object.values(trade.buyers).forEach((buyer) => {
      buyer.ref = parseTimeSince(buyer.timestamp);
    });
  });
}

function parseTimeSince(since: number) {
  const diff = Math.floor((Date.now() - since) / 1000);
  const sec = (diff % 60).toString().padStart(2, "0");
  const min = Math.floor(diff / 60)
    .toString()
    .padStart(2, "0");

  return `${min}:${sec}`;
}

function countExcessProfit() {
  const summary = activeTrades.value.slice(3).reduce(
    (result, next) => {
      result[next.priceName] = (result[next.priceName] ?? 0) + next.priceAmount;
      return result;
    },
    {} as Record<string, number>,
  );

  return Object.keys(summary)
    .map((offer) => `${summary[offer]}x ${offer}`)
    .join(", ");
}
</script>
