import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { GridColumn } from "@/types/GridColumn";
import { Row } from "@open-dcp/grid";

// Mock column definitions with diverse types
const dateTimeColumns: GridColumn[] = [
    { key: "id", label: "ID", type: "integer" },
    { key: "datetime", label: "Date", type: "datetime" },
    { key: "datestring", label: "Date String", type: "string" },
    { key: "timeshift", label: "Timezone Offset", type: "integer" },
];

// Mock row data generator for diverse columns
const generateDateTimeColumn = (count: number = 100): Row[] => {
    const rows: any[] = [];

    for (let i = 1; i <= count; i++) {
        const randomDate = new Date(
            1980 + Math.floor(Math.random() * 40),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28),
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60)
        );
        rows.push({
            id: i,
            datetime: randomDate.toISOString(),
            datestring: randomDate.toISOString(),
            timeshift: randomDate.getTimezoneOffset()
        });
    }

    return rows;
};

const meta: Meta<typeof Grid> = {
    title: "Timezone",
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

export const Default = Template.bind({});
Default.args = {
    rows: generateDateTimeColumn(100),
    columns: dateTimeColumns,
    displayFormat: {
        timeZone: "Europe/Berlin"
    }
};