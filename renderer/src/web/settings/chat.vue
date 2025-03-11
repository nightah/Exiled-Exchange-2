<template>
  <div class="w-full p-2">
    <div class="mb-2 bg-gray-700 rounded px-2 py-1 leading-none">
      <i class="fas fa-info-circle"></i> {{ t("settings.placeholder_text") }}
      <br />
      <br />
      {{ t("settings.placeholder_last", placeholders) }}
      <span v-if="lang !== 'ko'">
        <br />
        {{ t("settings.placeholder_area", placeholders) }}
      </span>
      <br />
      {{ t("settings.placeholder_chain", placeholders) }}
      <br />
      <br />
      <span v-if="lang !== 'ko'">{{
        t("settings.placeholder_note", placeholders)
      }}</span>
      <span v-else>{{
        t("settings.placeholder_note_kakao", placeholders)
      }}</span>
    </div>
    <div class="flex flex-col gap-y-4 mb-4">
      <div
        class="flex flex-col gap-y-1"
        v-for="(command, idx) in commands"
        :key="idx"
      >
        <input
          v-model.trim="command.text"
          class="rounded bg-gray-900 px-1 block w-full font-poe"
        />
        <div class="flex gap-x-2">
          <ui-toggle v-model="command.send" class="ml-1">{{
            t("settings.chat_cmd_send")
          }}</ui-toggle>
          <button @click="removeCommand(idx)" class="ml-auto text-gray-500">
            {{ t("Remove") }}
          </button>
          <hotkey-input v-model="command.hotkey" class="w-48" />
        </div>
      </div>
    </div>
    <button
      @click="addComand"
      class="bg-gray-900 rounded flex items-baseline px-2 py-1 leading-none"
    >
      <i class="fas fa-plus mr-1"></i> {{ t("settings.chat_cmd_add") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18n } from "vue-i18n";
import UiToggle from "@/web/ui/UiToggle.vue";
import { configProp } from "./utils";
import HotkeyInput from "./HotkeyInput.vue";
import { AppConfig } from "@/web/Config";

export default defineComponent({
  name: "settings.chat",
  components: { HotkeyInput, UiToggle },
  props: configProp(),
  setup(props) {
    const { t } = useI18n();
    const lang = AppConfig().language;
    const placeholders = { last: "@last", area: "@area", chain: "&&" };

    return {
      t,
      lang,
      placeholders,
      commands: computed(() => props.config.commands),
      addComand() {
        props.config.commands.push({
          text: "",
          hotkey: null,
          send: true,
        });
      },
      removeCommand(idx: number) {
        props.config.commands.splice(idx, 1);
      },
    };
  },
});
</script>
