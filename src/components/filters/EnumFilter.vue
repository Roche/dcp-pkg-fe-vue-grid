<template>
    <div>
        <v-select class="mb-2" hide-details density="compact" :items="options" v-model="selectedValue"
            item-title="label" item-value="value" :label="t(translationPrefix + 'filter.value')" clearable />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslationPrefix } from '@/composables/useTranslationPrefix';
import type { FilterOption } from '@open-dcp/grid';

const translationPrefix = useTranslationPrefix();
const { t } = useI18n();

interface Props {
    options?: FilterOption[];
}

const props = withDefaults(defineProps<Props>(), {
    options: () => []
});

const selectedValue = ref<string | number | boolean | null>(null);

const valid = computed(() => selectedValue.value !== null && selectedValue.value !== undefined && selectedValue.value !== '');

function resetFilter() {
    selectedValue.value = null;
}

function getFilterDefinition() {
    if (!valid.value) return null;
    return { operator: '=', value: selectedValue.value };
}

defineExpose({ getFilterDefinition, resetFilter, valid });
</script>
