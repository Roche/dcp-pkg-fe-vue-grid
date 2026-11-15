import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { mockColumns, generateMockRows } from "./mockData";

const meta: Meta<typeof Grid> = {
    title: "Default",
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
    rows: generateMockRows(100),
    columns: mockColumns,
};