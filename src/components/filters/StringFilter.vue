<template>
    <div>
        <v-select class="mb-2" hide-details density="compact" :items="operators" v-model="operator" item-title="label" item-value="value"></v-select>
        <v-text-field class="mb-2" hide-details density="compact" v-if="showValueInput" v-model="value" :label="t(translationPrefix + 'filter.value')"></v-text-field>
    </div>
</template>

<script setup lang="ts">
import { useGridFilter } from '@/composables/useGridFilter';
import { useI18n } from 'vue-i18n';
import { useTranslationPrefix } from '@/composables/useTranslationPrefix';
import type { OperatorType } from '@open-dcp/grid';

const translationPrefix = useTranslationPrefix();
const { t } = useI18n();

const noValueOperators: OperatorType[] = ['isNull', 'isNotNull', 'empty', 'notEmpty'];

const {
    operator,
    value,
    operators,
    showValueInput,
    valid,
    resetFilter,
    getFilterDefinition,
} = useGridFilter('string', t, translationPrefix.value, noValueOperators);

defineExpose({ getFilterDefinition, resetFilter, valid });
</script>