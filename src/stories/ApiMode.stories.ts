import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { mockColumns, generateConsistentMockRows } from "./mockData";
import { ref } from "vue";
import type { FilterNode, SortingCondition, GlobalSearchState } from "@open-dcp/grid";
import { evaluateFilterTree } from "@open-dcp/filter"; // Use the filter package
import { v4 as uuidv4 } from 'uuid';

const meta: Meta<typeof Grid> = {
    title: "ApiMode",
    component: Grid,
};
export default meta;

const applyBackendGlobalSearch = (
    data: any[],
    globalSearch: GlobalSearchState | null,
    columns: Array<{ key: string | number }>
) => {
    if (!globalSearch?.query) {
        return data;
    }

    const caseInsensitive = globalSearch.options?.caseInsensitive ?? false;
    const normalizedQuery = caseInsensitive ? globalSearch.query.toLowerCase() : globalSearch.query;
    const searchKeys = (globalSearch.options?.columns && globalSearch.options.columns.length > 0)
        ? globalSearch.options.columns
        : columns.map((column) => column.key);

    return data.filter((row) => {
        const searchableText = searchKeys
            .map((key) => (row[key] == null ? "" : String(row[key])))
            .join(" ");

        const candidate = caseInsensitive ? searchableText.toLowerCase() : searchableText;
        return candidate.includes(normalizedQuery);
    });
};

// Full API mode (both filter and sort via API)
const TemplateFullApi: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        const rows = ref<any[]>([]);
        const isLoading = ref(false);
        const mockData = generateConsistentMockRows(100);

        const fetchData = async (
            filterTree: FilterNode | null,
            sorts: SortingCondition[],
            globalSearch: GlobalSearchState | null,
            columns: Array<{ key: string | number }>
        ) => {
            isLoading.value = true;
            await new Promise(resolve => setTimeout(resolve, 1000));

            let data = [...mockData];

            // Use @open-dcp/filter to apply filtering - CORRECT parameter order
            if (filterTree) {
                data = data.filter(row => evaluateFilterTree(filterTree, row));
            }

            data = applyBackendGlobalSearch(data, globalSearch, columns);

            // Simulate server-side sorting
            if (sorts.length > 0) {
                data.sort((a, b) => {
                    for (const sort of sorts) {
                        const aVal = a[sort.columnKey];
                        const bVal = b[sort.columnKey];

                        let comparison = 0;
                        if (aVal > bVal) comparison = 1;
                        else if (aVal < bVal) comparison = -1;

                        if (comparison !== 0) {
                            return sort.direction === 'asc' ? comparison : -comparison;
                        }
                    }
                    return 0;
                });
            }

            data = data.map(row => ({ ...row, __uuid: uuidv4() }));
            isLoading.value = false;
            return data;
        };

        const onGridReady = async (service: any) => {
            service.enableApiMode({ clientSideSort: false, clientSideFilter: false });

            service.filterSort$.subscribe(async ({ filterTree, sorts, globalSearch }: any) => {
                const data = await fetchData(filterTree, sorts, globalSearch ?? null, columns as Array<{ key: string | number }>);
                service.setRowsFromApi(data);
            });
        };

        const columns = (args as any).columns || mockColumns;
        return { rows, columns, onGridReady, isLoading };
    },
    template: `
        <div>
            <h3>Full API Mode</h3>
            <p>Both filtering and sorting via backend (using consistent mock data)</p>
            <p>Click column headers to sort - data will be fetched and sorted by the "API"</p>
            <div v-if="isLoading" style="padding: 20px; text-align: center;">Loading...</div>
            <Grid :rows="rows" sortable filterable :columns="columns" @grid-ready="onGridReady" />
        </div>
    `,
});

// Hybrid mode - API filtering, client-side sorting
const TemplateHybridSort: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        const rows = ref<any[]>([]);
        const isLoading = ref(false);
        const mockData = generateConsistentMockRows(100);

        const fetchData = async (
            filterTree: FilterNode | null,
            globalSearch: GlobalSearchState | null,
            columns: Array<{ key: string | number }>
        ) => {
            isLoading.value = true;
            await new Promise(resolve => setTimeout(resolve, 500));

            let data = [...mockData];

            // Use @open-dcp/filter to apply filtering
            if (filterTree) {
                data = data.filter(row => evaluateFilterTree(filterTree, row));
            }

            data = applyBackendGlobalSearch(data, globalSearch, columns);

            data = data.map(row => ({ ...row, __uuid: uuidv4() }));
            isLoading.value = false;
            return data;
        };

        const onGridReady = async (service: any) => {
            service.enableApiMode({ clientSideSort: true, clientSideFilter: false });

            let lastFilterState: string | null = null;

            service.filterSort$.subscribe(async ({ filterTree, globalSearch }: any) => {
                const currentFilterState = JSON.stringify({ filterTree, globalSearch });

                if (currentFilterState !== lastFilterState) {
                    lastFilterState = currentFilterState;
                    const data = await fetchData(filterTree, globalSearch ?? null, columns as Array<{ key: string | number }>);
                    service.setRowsFromApi(data);
                }
            });
        };

        const columns = (args as any).columns || mockColumns;
        return { rows, columns, onGridReady, isLoading };
    },
    template: `
        <div>
            <h3>Hybrid Mode - Client-Side Sorting</h3>
            <p>Filtering via API, sorting done client-side</p>
            <p>Click column headers to sort - NO loading indicator (instant client-side sort)</p>
            <div v-if="isLoading" style="padding: 20px; text-align: center;">Loading...</div>
            <Grid :rows="rows" sortable filterable :columns="columns" @grid-ready="onGridReady" />
        </div>
    `,
});

// Full client-side mode (using API for initial load only)
const TemplateFullClient: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        const rows = ref<any[]>([]);
        const isLoading = ref(false);
        const mockData = generateConsistentMockRows(100);

        const fetchData = async () => {
            isLoading.value = true;
            await new Promise(resolve => setTimeout(resolve, 500));

            const data = mockData.map(row => ({ ...row, __uuid: uuidv4() }));
            isLoading.value = false;
            return data;
        };

        const onGridReady = async (service: any) => {
            service.enableApiMode({ clientSideSort: true, clientSideFilter: true });

            const data = await fetchData();
            service.setRowsFromApi(data);
        };

        const columns = (args as any).columns || mockColumns;
        return { rows, columns, onGridReady, isLoading };
    },
    template: `
        <div>
            <h3>Full Client-Side Mode</h3>
            <p>Initial data from API, all operations done client-side</p>
            <p>Sort and filter - NO loading indicators (all instant)</p>
            <div v-if="isLoading" style="padding: 20px; text-align: center;">Loading...</div>
            <Grid :rows="rows" sortable filterable :columns="columns" @grid-ready="onGridReady" />
        </div>
    `,
});

export const FullApiMode = TemplateFullApi.bind({});
FullApiMode.args = {
    rows: [],
    columns: mockColumns,
};

export const HybridSortClientSide = TemplateHybridSort.bind({});
HybridSortClientSide.args = {
    rows: [],
    columns: mockColumns,
};

export const FullClientSide = TemplateFullClient.bind({});
FullClientSide.args = {
    rows: [],
    columns: mockColumns,
};