<template>
    <tbody ref="tbody">
        <tr class="firstRow" :style="{ height: `${firstRowHeight}px` }">
            <td :colspan="columns.length + (selectable ? 1 : 0)"></td>
        </tr>
        <tr v-if="renderRows.length === 0" class="dcp-grid-empty-row">
            <td :colspan="columns.length + (selectable ? 1 : 0)" style="text-align: center;">
                <slot name="empty">
                    {{ emptyText ?? t(emptyTranslation) }}
                </slot>
            </td>
        </tr>
        <tr v-for="(row, index) in renderRows" :key="getRowKey(row)" :data-global-id="row.globaIndex"
            :class="{ 'last-data-row': index === renderRows.length - 1 && lastRowHeight <= 1 }">
            <td v-if="selectable">
                <v-checkbox :model-value="selectedIndexes.has(row.globaIndex)"
                    @click="toggleSelection(row.globaIndex)" />
            </td>
            <BodyCell :row="row.data" v-for="column in columns" :key="column.key" :column="column"
                :specialDisplayValues="specialDisplayValues" />
        </tr>
        <tr class="lastRow" :style="{ height: `${lastRowHeight}px` }">
            <td :colspan="columns.length + (selectable ? 1 : 0)"></td>
        </tr>
    </tbody>
</template>

<script lang="ts" setup>
import BodyCell from '@/components/table/BodyCell.vue';
import { inject, computed } from 'vue';
import type { PropType } from 'vue';
import type { GridColumn, BodyCellSpecialValues } from '@/types/GridColumn';
import type { RenderRow } from '@open-dcp/grid';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const translationPrefix = inject('translationPrefix', '@open-dcp/i18n');
const emptyTranslation = computed(() => (translationPrefix ? translationPrefix + '.' : '') + 'grid.noResultsOverlay');

const props = defineProps({
    columns: { type: Array as PropType<GridColumn[]>, required: true },
    selectable: { type: Boolean, default: false },
    renderRows: { type: Array as PropType<RenderRow[]>, required: true },
    getRowKey: { type: Function as PropType<(row: RenderRow) => string | number>, required: true },
    selectedIndexes: { type: Object as PropType<Set<number | string>>, required: true },
    toggleSelection: { type: Function as PropType<(index: number) => void>, required: true },
    specialDisplayValues: { type: Object as PropType<BodyCellSpecialValues>, default: () => ({}) },
    firstRowHeight: { type: Number, default: 0 },
    lastRowHeight: { type: Number, default: 0 },
    emptyText: { type: String, required: false }
});
</script>

<style scoped>
tr.last-data-row > td {
    border-bottom: none;
}
</style>