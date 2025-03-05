<template>
  <div class="p-2">
    <h2 class="mb-2">{{ t("trade_viewer.logging_header") }}</h2>
    <ui-radio v-model="isLogWatcherEnabled" :value="false" class="ml-2 mb-1">
      {{ t("trade_viewer.logging_disable") }}<br />
      {{ t("trade_viewer.logging_disable_text") }}</ui-radio
    >
    <ui-radio v-model="isLogWatcherEnabled" :value="true" class="ml-2">
      {{ t("trade_viewer.logging_enable") }}<br />
      {{ t("trade_viewer.logging_enable_text") }}
    </ui-radio>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import HotkeyInput from "../settings/HotkeyInput.vue";
import { configProp, configModelValue } from "../settings/utils.js";
import type { TradeViewerWidget } from "./widget";
import UiRadio from "@/web/ui/UiRadio.vue";

export default defineComponent({
  name: "trade_viewer.name",
  components: { UiRadio, DndContainer, HotkeyInput },
  props: configProp<TradeViewerWidget>(),
  setup(props) {
    const { t } = useI18n();

    return {
      t,
      isLogWatcherEnabled: configModelValue(
        () => props.config,
        "isLogWatcherEnabled",
      ),
    };
  },
});
</script>

<style lang="postcss" module></style>
