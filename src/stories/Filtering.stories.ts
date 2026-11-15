import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { diverseColumns, filterableColumns, generateDiverseMockRows } from "./mockData";
import { GridColumn } from "@/types/GridColumn";
import { GridService, Row } from "@open-dcp/grid";
import { defineComponent, ref } from "vue";

const meta: Meta<typeof Grid> = {
    title: "Filtering",
    component: Grid,
};
export default meta;

const Template: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        return { args };
    },
    template: '<Grid v-bind="args" />',
});

export const Filtering = Template.bind({});
Filtering.args = {
    rows: generateDiverseMockRows(100),
    columns: filterableColumns,
    filterable: true,
    advancedFilter: true,
};

export const CaseInsensitiveFiltering = Template.bind({});
CaseInsensitiveFiltering.args = {
    rows: generateDiverseMockRows(100),
    columns: filterableColumns,
    filterable: true,
    advancedFilter: true,
    caseInsensitiveFiltering: true,
};

export const EnumFiltering = Template.bind({});

// Generate mock data with enum values
const generateEnumMockRows = (count: number = 100): Row[] => {
    const statuses = ["In Progress", "Completed"];
    const belongings = ["Public", "Private"];
    const rows: any[] = [];

    for (let i = 1; i <= count; i++) {
        rows.push({
            id: i,
            name: `User ${i}`,
            status: statuses[i % statuses.length],
            belonging: belongings[i % belongings.length],
        });
    }

    return rows;
};

// Enum columns with filter options
const enumColumns: GridColumn[] = [
    { key: "id", label: "ID", type: "integer", width: "10%" },
    { key: "name", label: "Name", type: "string", width: "30%" },
    {
        key: "status",
        label: "Status",
        type: "enum",
        width: "25%",
        filterOptions: [
            { label: "In Progress", value: "In Progress" },
            { label: "Completed", value: "Completed" },
        ],
    },
    {
        key: "belonging",
        label: "Belonging",
        type: "enum",
        width: "25%",
        filterOptions: [
            { label: "Public", value: "Public" },
            { label: "Private", value: "Private" },
        ],
    },
];

EnumFiltering.args = {
    rows: generateEnumMockRows(100),
    columns: enumColumns,
    filterable: true,
    advancedFilter: false,
};

export const GlobalTableSearch: StoryFn<typeof Grid> = () => ({
    components: { Grid },
    setup() {
        const search = ref("");
        const resultCount = ref(0);
        const rows = generateDiverseMockRows(100);
        const gridServiceRef = ref<GridService | null>(null);

        const columns = filterableColumns;

        const applyGlobalSearch = (value?: string | null) => {
            if (!gridServiceRef.value) {
                return;
            }

            const query = String(value ?? search.value ?? "").trim();

            if (!query) {
                gridServiceRef.value.clearGlobalSearch();
                return;
            }

            gridServiceRef.value.setGlobalSearch(query, {
                caseInsensitive: true,
                searchMode: "display",
            });
        };

        const onSearchInput = (event: Event) => {
            const target = event.target as HTMLInputElement | null;
            const value = target?.value ?? "";
            search.value = value;
            applyGlobalSearch(value);
        };

        const onGridReady = (service: GridService) => {
            gridServiceRef.value = service;
            applyGlobalSearch();
        };

        const onRowCountChange = (count: number) => {
            resultCount.value = count;
        };

        return {
            rows,
            columns,
            search,
            resultCount,
            applyGlobalSearch,
            onSearchInput,
            onGridReady,
            onRowCountChange,
        };
    },
    template: `
        <div>
            <h3>Global Table Search</h3>
            <p>Type once to search across all visible cell values.</p>
            <div style="max-width: 420px; margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; margin-bottom: 6px;">Search in all columns</label>
                <input
                    :value="search"
                    type="text"
                    placeholder="Type to search"
                    @input="onSearchInput"
                    style="width: 100%; padding: 8px 10px; border: 1px solid #c8c8c8; border-radius: 6px;"
                />
            </div>
            <p>Matching rows: {{ resultCount }}</p>
            <Grid
                :rows="rows"
                :columns="columns"
                sortable
                :filterable="false"
                @grid-ready="onGridReady"
                @row-count-change="onRowCountChange"
            />
        </div>
    `,
});

export const GlobalSearchWithComponentColumn: StoryFn<typeof Grid> = () => ({
    components: { Grid },
    setup() {
        const search = ref("");
        const resultCount = ref(0);
        const gridServiceRef = ref<GridService | null>(null);

        const StatusBadge = defineComponent({
            name: "StatusBadge",
            props: {
                value: {
                    type: Object,
                    required: true,
                },
            },
            template: `<span style="background: red; color: white; padding: 2px 4px; border-radius: 4px;">{{ value?.raw === 'A' ? 'Active' : value?.raw === 'I' ? 'Inactive' : 'Pending' }}</span>`,
        });

        const rows = [
            { id: 1, name: "Alice", status: "A", country: "Germany" },
            { id: 2, name: "Bob", status: "I", country: "Canada" },
            { id: 3, name: "Carla", status: "P", country: "France" },
            { id: 4, name: "Daniel", status: "A", country: "USA" },
        ];

        const columns: GridColumn[] = [
            { key: "id", label: "ID", type: "integer", width: "12%" },
            { key: "name", label: "Name", type: "string", width: "28%" },
            {
                key: "status",
                label: "Status",
                type: "component",
                width: "28%",
                component: StatusBadge,
                globalSearchText: (cell) => {
                    const code = String(cell?.raw ?? "");
                    if (code === "A") return "Active";
                    if (code === "I") return "Inactive";
                    return "Pending";
                },
            },
            { key: "country", label: "Country", type: "string", width: "32%" },
        ];

        const applyGlobalSearch = (value?: string | null) => {
            if (!gridServiceRef.value) {
                return;
            }

            const query = String(value ?? search.value ?? "").trim();

            if (!query) {
                gridServiceRef.value.clearGlobalSearch();
                return;
            }

            gridServiceRef.value.setGlobalSearch(query, {
                caseInsensitive: true,
                searchMode: "display",
            });
        };

        const onSearchInput = (event: Event) => {
            const target = event.target as HTMLInputElement | null;
            const value = target?.value ?? "";
            search.value = value;
            applyGlobalSearch(value);
        };

        const onGridReady = (service: GridService) => {
            gridServiceRef.value = service;
            applyGlobalSearch();
        };

        const onRowCountChange = (count: number) => {
            resultCount.value = count;
        };

        return {
            rows,
            columns,
            search,
            resultCount,
            onSearchInput,
            onGridReady,
            onRowCountChange,
        };
    },
    template: `
        <div>
            <h3>Global Search With Component Column</h3>
            <p>Search for values like Active, Inactive, Pending, Canada, or Alice.</p>
            <div style="max-width: 420px; margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; margin-bottom: 6px;">Search in all columns</label>
                <input
                    :value="search"
                    type="text"
                    placeholder="Try: active"
                    @input="onSearchInput"
                    style="width: 100%; padding: 8px 10px; border: 1px solid #c8c8c8; border-radius: 6px;"
                />
            </div>
            <p>Matching rows: {{ resultCount }}</p>
            <Grid
                :rows="rows"
                :columns="columns"
                sortable
                :filterable="false"
                @grid-ready="onGridReady"
                @row-count-change="onRowCountChange"
            />
        </div>
    `,
});