<template>
  <div class="dcp-table-container" ref="tableContainer" :style="computedStyle">
    <table>
      <colgroup>
        <col v-if="selectable" style="width: 5%">
        </col>
        <col v-for="column in columns" :key="column.key"
          :style="{ width: columnWidths[column.key] || (column.width ? column.width : 'auto') }">
        </col>
      </colgroup>
      <thead :style="stickyHeaderStyle">
        <tr>
          <th v-if="selectable">
            <v-checkbox :indeterminate="someSelected" :model-value="allSelected" @click="toggleSelectAll" />
          </th>
          <slot name="header" :grid-service="gridService" :columns="columns" :sortable="sortable"
            :filterable="filterable">
            <template v-for="column in columns" :key="column.key">
              <slot name="header-cell" :grid-service="gridService" :column="column"
                :is-filtered="gridService.hasFilter(column.key)" :sortable="sortable && !column.notSortable"
                :sort-direction="gridService.getSortCondition(column.key)?.direction"
                :filterable="filterable && !column.notFilterable" :startResize="startResize">
                <HeaderCell :grid-service="gridService" :column="column" :isFiltered="gridService.hasFilter(column.key)"
                  :sortable="sortable && !column.notSortable"
                  :sort-direction="gridService.getSortCondition(column.key)?.direction"
                  :filterable="filterable && !column.notFilterable" :advanced-filter="advancedFilter"
                  :resizable="props.resizable" :startResize="startResize" />
              </slot>
            </template>
          </slot>
        </tr>
      </thead>
      <GridBody :columns="columns" :selectable="selectable" :renderRows="renderRows" :getRowKey="getRowKey"
        :selectedIndexes="selectedIndexes" :toggle-selection="toggleSelection"
        :specialDisplayValues="specialDisplayValues" :firstRowHeight="firstRowHeight" :lastRowHeight="lastRowHeight">
        <template #empty>
          <slot name="empty"></slot>
        </template>
      </GridBody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, PropType, computed, provide, nextTick } from 'vue';
import { SortingCondition, FilterNode, DisplayFormat, GlobalSearchState, FilterSortUpdatePayload } from '@open-dcp/grid';
import { GridColumn, BodyCellSpecialValues } from '@/types/GridColumn';
import HeaderCell from '@/components/table/HeaderCell.vue';
import GridBody from '@/components/table/GridBody.vue';
import { useColumnResizing } from '@/composables/useColumnResizing';
import { useGridService } from '@/composables/useGridService';
import { logger } from '@open-dcp/utilities';

const props = defineProps({
  // Required Props by GridService
  rows: {
    type: Array as PropType<Record<string, any>[]>,
    required: true
  },
  columns: {
    type: Array as PropType<GridColumn[]>,
    required: true
  },
  apiMode: {
    type: Boolean,
    default: false
  },

  // Optional Props by GridService
  displayFormat: {
    type: Object as PropType<Partial<DisplayFormat>>,
    default: () => ({})
  },
  elementHeight: {
    type: Number,
    default: 41
  },
  filterTree: {
    type: Object as PropType<FilterNode | null>,
    default: null
  },
  sort: {
    type: Array as PropType<SortingCondition[]>,
    default: () => []
  },
  select: {
    type: Set<number>,
    default: () => new Set<number>()
  },
  caseInsensitiveFiltering: {
    type: Boolean,
    default: false
  },
  globalSearch: {
    type: Object as PropType<GlobalSearchState | null>,
    default: null
  },

  // Vue-Grid Styling and Options
  rowKey: {
    type: String,
    required: false
  },
  selectable: {
    type: Boolean,
    default: false
  },
  sortable: {
    type: Boolean,
    default: false
  },
  filterable: {
    type: Boolean,
    default: false
  },
  resizable: {
    type: Boolean,
    default: false
  },
  stickyHeader: {
    type: Boolean,
    default: false
  },
  advancedFilter: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    required: false
  },
  minColumnWidth: {
    type: Number,
    default: 100
  },
  specialDisplayValues: {
    type: Object as PropType<BodyCellSpecialValues>,
    default: () => ({
      'null': 'N/A',
      'undefined': 'N/A'
    })
  },

  translationPrefix: {
    type: String,
    required: false,
    default: '@open-dcp/i18n'
  },
});

const { columnWidths, manuallyResizedColumns, startResize } = useColumnResizing();
const {
  gridService,
  renderRows,
  firstRowHeight,
  lastRowHeight,
  selectedIndexes,
  getRowKey,
  toggleSelection,
  toggleSelectAll
} = useGridService({
  rows: () => props.rows,
  columns: () => props.columns,
  apiMode: props.apiMode,
  displayFormat: () => props.displayFormat,
  elementHeight: () => props.elementHeight,
  filterTree: () => props.filterTree,
  sort: () => props.sort,
  select: () => props.select,
  rowKey: props.rowKey,
  caseInsensitiveFiltering: () => props.caseInsensitiveFiltering
});

provide('translationPrefix', props.translationPrefix);

const emit = defineEmits<{
  (e: 'row-count-change', rowCount: number): void;
  (e: 'grid-ready', gridService: any): void;
  (e: 'global-search-change', globalSearch: GlobalSearchState | null): void;
  (e: 'filter-sort-change', payload: FilterSortUpdatePayload): void;
}>();

const computedStyle = computed(() => ({
  height: props.height ? `${props.height}px` : undefined
}));

const tableContainer = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | undefined;
let sizingFrame: number | undefined;
let lastContainerWidth = 0;
let unmounted = false;

const stickyHeaderStyle = computed(() => {
  if (!props.stickyHeader) {
    return '';
  }

  return 'position: sticky; background-color: #fff;top: 0; z-index: 1;';
})

const calculateColumnWidths = () => {
  if (unmounted) return;

  if (sizingFrame !== undefined) {
    cancelAnimationFrame(sizingFrame);
    sizingFrame = undefined;
  }

  if (!tableContainer.value) {
    logger.warn('calculateColumnWidths: tableContainer not available');
    return;
  }

  const containerWidth = tableContainer.value.clientWidth;
  if (containerWidth <= 0) return;

  const ths = tableContainer.value.querySelectorAll('thead th');

  if (ths.length === 0) {
    logger.warn('calculateColumnWidths: no header cells found');
    return;
  }

  const columnsToMeasure: { column: GridColumn; spans: HTMLSpanElement[]; actions: HTMLElement | null }[] = [];
  const measurements = document.createDocumentFragment();
  const nextWidths = { ...columnWidths.value };
  let fixedWidthTotal = 0;

  // Prepare every measurement off-DOM before reading any text widths.
  props.columns.forEach((column, idx) => {
    const thIndex = props.selectable ? idx + 1 : idx;
    const th = ths[thIndex] as HTMLElement;

    if (!th) return;

    if (manuallyResizedColumns.has(String(column.key))) {
      fixedWidthTotal += Number.parseFloat(columnWidths.value[column.key]);
    } else if (column.width) {
      // Handle fixed width (px)
      if (typeof column.width === 'string' && column.width.endsWith('px')) {
        const width = Number.parseFloat(column.width);
        fixedWidthTotal += width;
        nextWidths[column.key] = column.width;
      }
      // Handle percentage width - convert to pixels
      else if (typeof column.width === 'string' && column.width.endsWith('%')) {
        const percentage = Number.parseFloat(column.width);
        const pixelWidth = (containerWidth * percentage) / 100;
        fixedWidthTotal += pixelWidth;
        nextWidths[column.key] = `${Math.floor(pixelWidth)}px`;
      }
      // Handle number width
      else if (typeof column.width === 'number') {
        fixedWidthTotal += column.width;
        nextWidths[column.key] = `${column.width}px`;
      }
    } else {
      const tempHeader = document.createElement('span');
      tempHeader.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;padding:0 16px;font-weight:600;';
      tempHeader.textContent = String(column.label || column.key);
      measurements.appendChild(tempHeader);

      // Measure cell widths (sample first 10 rows for performance)
      const spans = [tempHeader];
      const tds = tableContainer.value?.querySelectorAll(`tbody td:nth-child(${thIndex + 1})`);

      if (tds && tds.length > 0) {
        const sampleSize = Math.min(10, tds.length);
        for (let i = 0; i < sampleSize; i++) {
          const td = tds[i] as HTMLElement;
          if (td.textContent) {
            const temp = document.createElement('span');
            temp.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;padding:0 16px;';
            temp.textContent = td.textContent.trim();
            measurements.appendChild(temp);
            spans.push(temp);
          }
        }
      }

      columnsToMeasure.push({ column, spans, actions: th.querySelector<HTMLElement>('.header-actions') });
    }
  });

  const columnsToCalculate: { column: GridColumn; requiredWidth: number }[] = [];
  if (columnsToMeasure.length > 0) {
    document.body.appendChild(measurements);
    try {
      for (const { column, spans, actions } of columnsToMeasure) {
        const actionWidth = actions?.offsetWidth ?? 0;
        const maxContentWidth = Math.max(...spans.map((span, index) =>
          span.offsetWidth + (index === 0 ? actionWidth : 0)
        ));
        columnsToCalculate.push({
          column,
          requiredWidth: Math.max(maxContentWidth, props.minColumnWidth)
        });
      }
    } finally {
      for (const { spans } of columnsToMeasure) {
        spans.forEach(span => span.remove());
      }
    }
  }

  // Add checkbox column width if selectable
  if (props.selectable) {
    fixedWidthTotal += 50;
  }

  // Calculate available space for auto columns
  const availableWidth = containerWidth - fixedWidthTotal;
  const totalRequiredWidth = columnsToCalculate.reduce((sum, col) => sum + col.requiredWidth, 0);

  // Distribute widths based on available space
  if (totalRequiredWidth <= availableWidth) {
    // Enough space - distribute proportionally to fill container
    const scale = availableWidth / totalRequiredWidth;
    columnsToCalculate.forEach(({ column, requiredWidth }) => {
      const scaledWidth = Math.floor(requiredWidth * scale);
      nextWidths[column.key] = `${scaledWidth}px`;
    });
  } else {
    // Not enough space - use required widths (triggers horizontal scroll)
    columnsToCalculate.forEach(({ column, requiredWidth }) => {
      nextWidths[column.key] = `${requiredWidth}px`;
    });
  }

  columnWidths.value = nextWidths;
};

const scheduleColumnWidths = () => {
  if (unmounted || sizingFrame !== undefined) return;
  sizingFrame = requestAnimationFrame(() => {
    sizingFrame = undefined;
    calculateColumnWidths();
  });
};
watch(() => props.rows, (newRows) => {
  if (newRows.length > 0) {
    scheduleColumnWidths();
  }
}, { deep: true, flush: 'post' });

watch(() => props.columns, () => {
  if (props.rows.length > 0) {
    scheduleColumnWidths();
  }
}, { deep: true, flush: 'post' });

watch(() => [props.filterable, props.sortable], scheduleColumnWidths, { flush: 'post' });

watch(() => props.globalSearch, (newGlobalSearch) => {
  const query = newGlobalSearch?.query?.trim() ?? '';

  if (!query) {
    gridService.clearGlobalSearch();
    return;
  }

  gridService.setGlobalSearch(query, newGlobalSearch?.options);
}, { deep: true, immediate: true });

let rowCountSubscription: any;
let filterSortSubscription: any;

const handleScroll = (event: Event) => gridService.handleScroll(event);

const someSelected = computed(() =>
  props.rows.length > selectedIndexes.value.size && selectedIndexes.value.size > 0
);

const allSelected = computed(() =>
  selectedIndexes.value.size === props.rows.length && props.rows.length > 0
);

onMounted(() => {
  if (tableContainer.value) {
    lastContainerWidth = tableContainer.value.clientWidth;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (unmounted || !tableContainer.value) return;

        const width = tableContainer.value.clientWidth;
        if (width === lastContainerWidth) return;
        lastContainerWidth = width;

        if (width <= 0) return;
        scheduleColumnWidths();
      });
      resizeObserver.observe(tableContainer.value);
    }

    gridService.attachContainer(tableContainer.value);
    tableContainer.value.addEventListener('scroll', handleScroll);

    rowCountSubscription = gridService.rowCount$.subscribe((count) => {
      emit('row-count-change', count);
    });

    filterSortSubscription = gridService.filterSort$.subscribe((payload) => {
      emit('filter-sort-change', payload);
      emit('global-search-change', payload.globalSearch ?? null);
      if (props.sortable) scheduleColumnWidths();
    });

    if (props.rows.length > 0 && props.columns.length > 0) {
      nextTick(scheduleColumnWidths);
    }

    emit('grid-ready', gridService);
  }
});

onBeforeUnmount(() => {
  unmounted = true;
  resizeObserver?.disconnect();
  if (sizingFrame !== undefined) {
    cancelAnimationFrame(sizingFrame);
  }

  if (rowCountSubscription) {
    rowCountSubscription.unsubscribe();
  }

  if (filterSortSubscription) {
    filterSortSubscription.unsubscribe();
  }

  if (tableContainer.value) {
    tableContainer.value.removeEventListener('scroll', handleScroll);
  }
});

defineExpose({
  calculateColumnWidths,
  gridService
});
</script>