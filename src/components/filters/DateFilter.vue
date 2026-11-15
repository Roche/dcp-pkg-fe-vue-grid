<template>
    <div>
        <v-select class="mb-2" hide-details :items="operators" v-model="operator" item-title="label" item-value="value"></v-select>
        <div v-if="showSingleInput">
            <v-date-input class="mb-2" hide-details density="compact" v-model="singleDate" label="Date" :clearable="true" />
        </div>
        <div v-else-if="showRangeInput">
            <v-date-input class="mb-2" hide-details density="compact" v-model="range" label="Select range" multiple="range" :clearable="true" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useFilterOperatorList } from '@/composables/useFilterOperatorList';
import { FilterImplementation, FilterDefinition } from '@/types/FilterImplementation';
import { OperatorType } from '@open-dcp/grid';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { useTranslationPrefix } from '@/composables/useTranslationPrefix';

const translationPrefix = useTranslationPrefix();

defineEmits(['clear-filter', 'apply-filter']);

const { t } = useI18n();
const operators = computed(() =>
    useFilterOperatorList('date', t, translationPrefix.value)
);

const operator = ref<OperatorType>('=');
const singleDate = ref<string | null>(null);
const range = ref<[string | null, string | null] | null>(null);

const noValueOperators = new Set<OperatorType>([
    'isNull', 'isNotNull', 'empty', 'notEmpty'
]);

const rangeOperators = new Set<OperatorType>([
    'between', 'notBetween'
]);

const showSingleInput = computed(() =>
    !noValueOperators.has(operator.value) && !rangeOperators.has(operator.value)
);

const showRangeInput = computed(() =>
    rangeOperators.has(operator.value)
);

const valid = computed(() => {
    if (noValueOperators.has(operator.value)) return true;
    if (rangeOperators.has(operator.value)) {
        return !!range.value && !!range.value[0] && !!range.value[1];
    }
    return !!singleDate.value;
});

watch(operator, (newOp) => {
    if (noValueOperators.has(newOp)) {
        singleDate.value = null;
        range.value = null;
    } else if (rangeOperators.has(newOp)) {
        singleDate.value = null;
    } else {
        range.value = null;
    }
});

const getFilterDefinition = (): null | FilterDefinition => {
    if (!valid.value) return null;
    if (rangeOperators.has(operator.value)) {
        return {
            operator: operator.value,
            value: range.value
        };
    }
    if (noValueOperators.has(operator.value)) {
        return { operator: operator.value, value: null };
    }
    return {
        operator: operator.value,
        value: singleDate.value
    };
};

const resetFilter = (): void => {
    operator.value = '=';
    singleDate.value = null;
    range.value = null;
};

defineExpose<FilterImplementation>({
    getFilterDefinition,
    resetFilter,
    valid
});
</script>