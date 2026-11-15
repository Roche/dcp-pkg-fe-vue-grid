import type { Meta, StoryFn } from "@storybook/vue3";
import Grid from "@/components/Grid.vue";
import { GridColumn } from "@/types/GridColumn";
import { useRounding } from "@/composables/useRounding";

const { round } = useRounding();

const initialValues = [123.4567, 45.6789, 9.1, 123.4500, 45.6700];

const rows = initialValues.map((value, idx) => ({
    id: idx + 1,
    amount: value,
    amount_to_round: value,
    amount_to_round_with_trailing: value,
    amount_two_decimals_and_trailing: value,
    amount_rounded_4: value,
    amount_as_string: value,
}));

const meta: Meta<typeof Grid> = {
    title: "Rounding",
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

// 1. Default: No rounding, just raw numbers
export const Default = Template.bind({});
Default.args = {
    rows,
    columns: [
        { key: 'id', label: 'ID', type: 'integer' },
        { key: 'amount', label: 'Amount (raw)', type: 'number' },
    ] as GridColumn[],
};

// 2. Rounded to 0 decimals (no trailing zeros)
export const Rounded = Template.bind({});
Rounded.args = {
    rows,
    columns: [
        { key: 'id', label: 'ID', type: 'integer' },
        { key: 'amount', label: 'Amount (raw)', type: 'number' },
        {
            key: 'amount_to_round',
            label: 'Amount (rounded, 0 decimals)',
            type: 'number',
            transformer: (raw: any) => typeof raw === 'number' ? round(raw) : raw,
        },
    ] as GridColumn[],
};

// 3. Rounded to 4 decimals, with trailing zeros
export const RoundedWithTrailing = Template.bind({});
RoundedWithTrailing.args = {
    rows,
    columns: [
        { key: 'id', label: 'ID', type: 'integer' },
        { key: 'amount', label: 'Amount (raw)', type: 'number' },
        {
            key: 'amount_to_round_with_trailing',
            label: 'Amount (rounded, 4 decimals, trailing zeros)',
            type: 'number',
            transformer: (raw: any) => typeof raw === 'number' ? round(raw, 4, true) : raw,
        },
    ] as GridColumn[],
};

// 4. Rounded to 2 decimals, with trailing zeros
export const Rounded2Trailing = Template.bind({});
Rounded2Trailing.args = {
    rows,
    columns: [
        { key: 'id', label: 'ID', type: 'integer' },
        { key: 'amount', label: 'Amount (raw)', type: 'number' },
        {
            key: 'amount_two_decimals_and_trailing',
            label: 'Amount (rounded, 2 decimals, trailing zeros)',
            type: 'number',
            transformer: (raw: any) => typeof raw === 'number' ? round(raw, 2, true) : raw,
        },
    ] as GridColumn[],
};

// 5. As string, but sortable by raw value
export const AsStringSortable = Template.bind({});
AsStringSortable.args = {
    rows,
    columns: [
        { key: 'id', label: 'ID', type: 'integer' },
        { key: 'amount', label: 'Amount (raw)', type: 'number' },
        {
            key: 'amount_to_round',
            label: 'Amount (as string, sortable by raw)',
            type: 'number',
            transformer: (raw: any) => typeof raw === 'number' ? round(raw) : raw,
        },
        {
            key: 'amount_as_string',
            label: 'Amount (as string, sortable by raw)',
            type: 'number',
            transformer: (raw: any) => typeof raw === 'number' ? String(raw) : raw,
        },
    ] as GridColumn[],
    sortable: true
};