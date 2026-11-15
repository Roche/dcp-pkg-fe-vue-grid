import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { mockColumns } from "./mockData";

const meta: Meta<typeof Grid> = {
    title: "Empty",
    component: Grid,
};
export default meta;

const Template: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        return { args };
    },
    template: `
      <Grid v-bind="args">
        <template #empty>
          <span style="color: #888;">No data to display!</span>
        </template>
      </Grid>
    `,
});

export const Empty = Template.bind({});
Empty.args = {
    rows: [],
    columns: mockColumns,
};

// Variant without the slot, using the default empty text
const TemplateDefault: StoryFn<typeof Grid> = (args) => ({
    components: { Grid },
    setup() {
        return { args };
    },
    template: `<Grid v-bind="args" />`,
});

export const EmptyDefault = TemplateDefault.bind({});
EmptyDefault.args = {
    rows: [],
    columns: mockColumns,
};