import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { GridService, RenderRow, SortingCondition, FilterNode, DisplayFormat, GridOptions } from '@open-dcp/grid';
import { v4 as uuidv4 } from 'uuid';
import type { GridColumn } from '@/types/GridColumn';

// Assign UUIDs to rows if needed
function assignUuidsToRows(rows: any[]): any[] {
    return rows.map(row => ({
        ...row,
        __uuid: row.__uuid || uuidv4()
    }));
}

export function useGridService(props: {
    rows: () => Record<string, any>[],
    columns: () => GridColumn[],
    apiMode?: boolean,
    displayFormat?: () => Partial<DisplayFormat> | undefined,
    elementHeight?: () => number | undefined,
    filterTree?: () => FilterNode | null | undefined,
    sort?: () => SortingCondition[] | undefined,
    select?: () => Set<number> | undefined,
    rowKey?: string,
    caseInsensitiveFiltering?: () => boolean | undefined
}) {
    const initialRows = assignUuidsToRows(props.rows());
    const initialSorts = (props.sort?.() ?? []).map((condition) => ({ ...condition }));
    const initialSelections = new Set<number>(props.select?.() ?? new Set<number>());
    const gridOptions = computed((): GridOptions => ({
        elementHeight: props.elementHeight?.() ?? 41,
        displayFormat: props.displayFormat?.() ?? {},
        caseInsensitiveFiltering: props.caseInsensitiveFiltering?.() ?? false,
        allSelector: true,
        multiSelect: true
    }));

    const gridService = new GridService(
        initialRows,
        props.columns(),
        gridOptions.value,
        initialSorts,
        props.filterTree?.() ?? null,
        initialSelections
    );

    if (props.apiMode) {
        gridService.enableApiMode();
    }

    // Reactive state
    const renderRows = ref<RenderRow[]>([]);
    const firstRowHeight = ref<number>(0);
    const lastRowHeight = ref<number>(0);
    const startIndex = ref<number>(0);
    const selectedIndexes = ref<Set<number>>(new Set());

    // Subscriptions
    let gridStateSubscription: any;
    let selectionSubscription: any;

    // Watchers for props
    watch(() => props.displayFormat?.(), (newDisplayFormat) => {
        gridService.updateDisplayFormat(newDisplayFormat ?? {});
    }, { deep: true });

    watch(() => props.rows(), (newRows) => {
        const rowsWithUuids = assignUuidsToRows(newRows);
        gridService.setRows(rowsWithUuids);
    }, { deep: true, immediate: true });

    watch(() => props.columns(), (newColumns) => {
        gridService.setColumns(newColumns);
    }, { deep: true });

    // Subscriptions to gridService
    gridStateSubscription = gridService.getState().subscribe((state) => {
        renderRows.value = state.renderRows;
        firstRowHeight.value = state.firstRowHeight;
        lastRowHeight.value = state.lastRowHeight;
        startIndex.value = state.startIndex;
    });

    selectionSubscription = gridService.getSelected().subscribe((selectedRows) => {
        selectedIndexes.value = new Set(selectedRows);
    });

    // Cleanup
    onBeforeUnmount(() => {
        if (gridStateSubscription) gridStateSubscription.unsubscribe();
        if (selectionSubscription) selectionSubscription.unsubscribe();
    });

    // Utility for row key
    function getRowKey(row: RenderRow): string {
        if (props.rowKey && row.data[props.rowKey] !== undefined && row.data[props.rowKey] !== null) {
            return String(row.data[props.rowKey]);
        }
        return String(row.data.__uuid);
    }

    // Selection helpers
    function toggleSelection(index: number) {
        gridService.toggleRowSelection(index);
    }

    function toggleSelectAll() {
        const rowCount = props.rows().length;

        if (selectedIndexes.value.size === rowCount && rowCount > 0) {
            gridService.clearSelection();
        } else {
            gridService.selectAll();
        }
    }

    return {
        gridService,
        renderRows,
        firstRowHeight,
        lastRowHeight,
        startIndex,
        selectedIndexes,
        getRowKey,
        toggleSelection,
        toggleSelectAll
    };
}