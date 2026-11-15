import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { mockColumns, generateMockRows, diverseColumns, generateDiverseMockRows } from "./mockData";

const meta: Meta<typeof Grid> = {
    title: "Sorting",
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

export const Sorting = Template.bind({});
Sorting.args = {
    rows: generateMockRows(100),
    columns: mockColumns,
    sortable: true,
};

export const SortingAndFiltering = Template.bind({});
SortingAndFiltering.args = {
    rows: generateDiverseMockRows(100),
    columns: diverseColumns,
    sortable: true,
    filterable: true,
};