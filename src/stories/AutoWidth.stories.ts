import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { GridColumn } from "@/types/GridColumn";

const meta: Meta<typeof Grid> = {
    title: "Auto Width",
    component: Grid,
};
export default meta;

// Generate many columns with varying header lengths
const generateManyColumns = (count: number = 20): GridColumn[] => {
    const columnTypes = ["string", "integer", "number", "date"] as const;
    const labelPrefixes = [
        "Short",
        "Medium Length",
        "Very Long Column Header Name",
        "Extremely Long Column Header That Should Take Up More Space",
        "ID",
        "Code",
        "Description of Data",
        "Critical Business Metric Value",
    ];

    const columns: GridColumn[] = [];

    for (let i = 0; i < count; i++) {
        const labelPrefix = labelPrefixes[i % labelPrefixes.length];
        columns.push({
            key: `column${i}`,
            label: `${labelPrefix} ${i + 1}`,
            type: columnTypes[i % columnTypes.length] as any,
        });
    }

    return columns;
};

// Generate test data with varying content lengths for many columns
const generateWideTestRows = (rowCount: number = 100, columnCount: number = 20): any[] => {
    const rows: any[] = [];
    const contentVariations = [
        "Short",
        "Medium length content",
        "This is a very long text content that should determine column width and test wrapping behavior",
        "ABC",
        "12345",
        "test@example.com",
        "https://very-long-url-example.com/with/multiple/path/segments",
        "N/A",
    ];

    for (let i = 1; i <= rowCount; i++) {
        const row: any = {};
        
        for (let j = 0; j < columnCount; j++) {
            const variation = contentVariations[j % contentVariations.length];
            
            if (j % 4 === 0) {
                row[`column${j}`] = i * (j + 1); // Numbers
            } else if (j % 4 === 1) {
                row[`column${j}`] = `${variation} ${i}`; // Text with row number
            } else if (j % 4 === 2) {
                row[`column${j}`] = variation; // Direct variation
            } else {
                row[`column${j}`] = i % 3 === 0 ? variation : "Short"; // Conditional length
            }
        }
        
        rows.push(row);
    }

    return rows;
};

const Template: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        return { args };
    },
    template: '<Grid v-bind="args" />',
});

export const TwentyColumns = Template.bind({});
TwentyColumns.args = {
    rows: generateWideTestRows(100, 20),
    columns: generateManyColumns(20),
    minColumnWidth: 100,
};

export const ThirtyColumns = Template.bind({});
ThirtyColumns.args = {
    rows: generateWideTestRows(100, 30),
    columns: generateManyColumns(30),
    minColumnWidth: 100,
};

export const FiftyColumns = Template.bind({});
FiftyColumns.args = {
    rows: generateWideTestRows(100, 50),
    columns: generateManyColumns(50),
    minColumnWidth: 80,
};

export const TwentyColumnsSmallMinimum = Template.bind({});
TwentyColumnsSmallMinimum.args = {
    rows: generateWideTestRows(100, 20),
    columns: generateManyColumns(20),
    minColumnWidth: 60,
};

export const TwentyColumnsLargeMinimum = Template.bind({});
TwentyColumnsLargeMinimum.args = {
    rows: generateWideTestRows(100, 20),
    columns: generateManyColumns(20),
    minColumnWidth: 150,
};

export const MixedWidthManyColumns = Template.bind({});
MixedWidthManyColumns.args = {
    rows: generateWideTestRows(100, 25),
    columns: generateManyColumns(25).map((col, idx) => {
        // Every 5th column gets a fixed width
        if (idx % 5 === 0) {
            return { ...col, width: "120px" };
        }
        // Every 7th column gets a percentage width
        if (idx % 7 === 0) {
            return { ...col, width: "15%" };
        }
        // Rest auto-calculate
        return col;
    }),
    minColumnWidth: 100,
};

export const LongTitlesWithControls = Template.bind({});
LongTitlesWithControls.args = {
    rows: [{ t1: 20, t2: 25, t3: 30 }],
    columns: [
        { key: 't1', label: 'Starttemperature T1/T2', type: 'number', width: '120px' },
        { key: 't2', label: 'Starttemperature T2 with a very long title', type: 'number', width: '160px' },
        { key: 't3', label: 'Automatically sized temperature', type: 'number' },
    ],
    filterable: true,
    sortable: true,
    resizable: true,
};