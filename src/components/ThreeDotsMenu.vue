<script setup lang="ts">

defineProps({
  styles: Object,
})

</script>
<template>
  <v-menu :style="styles">
    <template v-slot:activator="{ props }">
      <v-btn
          class="three-dots_button"
          variant="flat"
          :ripple="false"
          v-bind="props"
          icon="mdi-dots-vertical">
      </v-btn>
    </template>
    <v-list bg-color="white" class="three-dots_list">
      <slot></slot>
    </v-list>
  </v-menu>
</template>
