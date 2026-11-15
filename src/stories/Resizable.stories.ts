import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { diverseColumns, generateDiverseMockRows } from "./mockData";

const meta: Meta<typeof Grid> = {
    title: "Resizable",
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

export const Resizable = Template.bind({});
Resizable.args = {
    rows: generateDiverseMockRows(100),
    columns: diverseColumns,
    filterable: true,
    advancedFilter: true,
    resizable: true,
    stickyHeader: true
};