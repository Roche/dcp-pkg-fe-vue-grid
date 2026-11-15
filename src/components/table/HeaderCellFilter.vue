<template>
    <v-menu v-model="menuOpen" offset-y eager :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn :variant="isFiltered ? 'flat' : 'plain'" :color="isFiltered ? 'red' : 'transparent'" :ripple="false"
                v-bind="props" size="x-small" icon="mdi-filter" />
        </template>

        <v-list bg-color="white" min-width="250px" class="p-2" @keydown.enter="isFilterValid && applyFilter()">
            <component ref="firstFilterComponentRef" :is="selectedFilter" v-if="selectedFilter" :options="props.columnType === 'enum' ? props.filterOptions : undefined" />

            <v-select hide-details density="compact" v-if="advancedFilter" v-model="groupOperator"
                :items="groupOperatorOptions" item-title="label" item-value="value"
                :label="t(`${translationPath}combine-with`)" class="mb-2" />

            <component v-if="advancedFilter && selectedFilter" ref="secondFilterComponentRef" :is="selectedFilter" :options="props.columnType === 'enum' ? props.filterOptions : undefined" />

            <div class="flex justify-end">
                <DcpTextButton @click="resetFilter()" class="mr-2">
                    {{ t(`${translationPath}clear`) }}
                </DcpTextButton>
                <DcpDefaultButton :disabled="!isFilterValid" color="primary" @click="applyFilter()">
                    {{ t(`${translationPath}filter`) }}
                </DcpDefaultButton>
            </div>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { computed, PropType, ref, inject } from 'vue';
import { ColumnType, FilterNode, FilterOption } from '@open-dcp/grid';
import { FilterImplementation } from '@/types/FilterImplementation';
import { DcpTextButton, DcpDefaultButton } from '@open-dcp/vue-basic-components';
import StringFilter from '@/components/filters/StringFilter.vue';
import NumericFilter from '@/components/filters/NumericFilter.vue';
import DateFilter from '@/components/filters/DateFilter.vue';
import DateTimeFilter from '@/components/filters/DateTimeFilter.vue';
import DurationFilter from '@/components/filters/DurationFilter.vue';
import EnumFilter from '@/components/filters/EnumFilter.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    columnType: {
        type: String as PropType<ColumnType>,
        required: true
    },
    columnKey: {
        type: [String, Number] as PropType<string | number>,
        required: true
    },
    isFiltered: {
        type: Boolean,
        required: true
    },
    advancedFilter: {
        type: Boolean,
        default: false
    },
    filterOptions: {
        type: Array as PropType<FilterOption[]>,
        default: () => []
    }
});

const emit = defineEmits<{
    (event: 'update-filter', filter: FilterNode): void;
    (event: 'reset-filter'): void;
}>();

const { t } = useI18n();
const translationPrefix = inject('translationPrefix', '@open-dcp/i18n') as string;
const translationPath = computed(() => (translationPrefix ? translationPrefix + '.' : '') + 'filter.');
const menuOpen = ref<boolean>(false);
const firstFilterComponentRef = ref<FilterImplementation>();
const secondFilterComponentRef = ref<FilterImplementation>();
const groupOperator = ref<'and' | 'or'>('and');
const groupOperatorOptions = computed(() => [
    { label: t(translationPath.value + 'groupOperator.and'), value: 'and' },
    { label: t(translationPath.value + 'groupOperator.or'), value: 'or' }
]);

// Mapping columnType to the appropriate filter component
const selectedFilter = computed(() => {
    const filters: Record<string, any> = {
        string: StringFilter,
        integer: NumericFilter,
        number: NumericFilter,
        date: DateFilter,
        datetime: DateTimeFilter,
        duration: DurationFilter,
        enum: EnumFilter,
        custom: null,
        component: null
    };

    return filters[props.columnType] || null;
});

const isFilterValid = computed(() =>
    (firstFilterComponentRef.value?.valid ?? false) ||
    (secondFilterComponentRef.value?.valid ?? false)
);

const applyFilter = () => {
    const filterCondition = firstFilterComponentRef.value?.getFilterDefinition();
    const secondaryFilterCondition = secondFilterComponentRef.value?.getFilterDefinition();

    if (!filterCondition && !secondaryFilterCondition) {
        return;
    }

    if (filterCondition && secondaryFilterCondition) {
        emit('update-filter', {
            type: 'group',
            operator: groupOperator.value,
            filters: [
                { type: 'condition', ...filterCondition, columnKey: props.columnKey },
                { type: 'condition', ...secondaryFilterCondition, columnKey: props.columnKey }
            ]
        });
    } else {
        const filter = filterCondition || secondaryFilterCondition;
        if (!filter?.operator) {
            return;
        }

        emit('update-filter', {
            type: 'condition',
            operator: filter.operator,
            value: filter.value,
            columnKey: props.columnKey
        });
    }

    menuOpen.value = false;
};

const resetFilter = () => {
    firstFilterComponentRef.value?.resetFilter();
    secondFilterComponentRef.value?.resetFilter();
    emit('reset-filter')
    menuOpen.value = false;
};
</script>