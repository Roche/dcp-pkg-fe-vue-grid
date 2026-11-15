<template>
    <th>
        <div class="header-content">
            <span ref="labelElement" class="header-label" :title="isTruncated ? column.label : undefined" @click="toggleSortByColumn"
                :role="sortable ? 'button' : undefined">{{ column.label }}</span>
            <span v-if="sortDirection || filterable" class="header-actions">
                <i v-if="sortDirection" class="mdi"
                    :class="sortDirection == 'asc' ? 'mdi-arrow-up-thin' : 'mdi-arrow-down-thin'"></i>

                <HeaderCellFilter :is-filtered="isFiltered" :advanced-filter="advancedFilter" :column-type="effectiveFilterType"
                    :column-key="column.key" :filter-options="column.filterOptions" v-if="filterable" @update-filter="updateFilter"
                    @reset-filter="resetFilter" />
            </span>
            <span v-if="resizable" class="col-resizer" @mousedown="startResize($event, column.key)"></span>
        </div>
    </th>
</template>

<script lang="ts" setup>
import { PropType, computed, ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import HeaderCellFilter from '@/components/table/HeaderCellFilter.vue';
import { GridColumn } from '@/types/GridColumn';
import { FilterNode, GridService } from '@open-dcp/grid';

const props = defineProps({
    gridService: {
        type: Object as PropType<GridService>,
        required: true
    },
    column: {
        type: Object as PropType<GridColumn>,
        required: true
    },
    filterable: {
        type: Boolean,
        default: false
    },
    sortable: {
        type: Boolean,
        default: false
    },
    sortDirection: {
        type: String,
        required: false
    },
    isFiltered: {
        type: Boolean,
        required: true
    },
    advancedFilter: {
        type: Boolean,
        default: false
    },
    startResize: {
        type: Function as PropType<(event: MouseEvent, columnKey: string | number) => void>,
        required: true
    },
    resizable: {
        type: Boolean,
        default: false
    }
});

const labelElement = ref<HTMLElement | null>(null);
const isTruncated = ref(false);
let labelResizeObserver: ResizeObserver | undefined;

const updateTruncation = () => {
    const element = labelElement.value;
    isTruncated.value = !!element && element.clientWidth > 0 && element.scrollWidth > element.clientWidth;
};

onMounted(() => {
    if (typeof ResizeObserver !== 'undefined') {
        labelResizeObserver = new ResizeObserver(updateTruncation);
        if (labelElement.value) labelResizeObserver.observe(labelElement.value);
    }
    updateTruncation();
});
onUpdated(updateTruncation);
onBeforeUnmount(() => labelResizeObserver?.disconnect());

const effectiveFilterType = computed(() => {
    return props.column.filterType || props.column.type;
});

const toggleSortByColumn = (): void => {
    if (!props.sortable) {
        return;
    }

    props.gridService.toggleSort(props.column.key)
}

const updateFilter = (filterNode: FilterNode): void => {
    props.gridService.addFilter(filterNode)
}

const resetFilter = (): void => {
    props.gridService.resetFilter(props.column.key)
}
</script>

<style scoped>
.header-content {
    display: flex;
    align-items: center;
}

.header-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.header-actions {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    padding-left: 4px;
    white-space: nowrap;
}

.col-resizer {
    position: absolute;
    right: 0;
    top: 0;
    width: 3px;
    margin-left: 2px;
    margin-right: 2px;
    height: 100%;
    cursor: col-resize;
    z-index: 2;
    background: transparent;
    transition: background 0.2s;
}

th {
    position: relative;
}

th:hover .col-resizer {
    background: #e0e0e0;
}
</style>