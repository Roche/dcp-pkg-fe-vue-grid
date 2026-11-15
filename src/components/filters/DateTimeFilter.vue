<template>
    <div>
        <v-select class="mb-2" hide-details :items="operators" v-model="operator" item-title="label"
            item-value="value" />
        <div v-if="showSingleInput" class="flex gap-2">
            <!-- Date Picker -->
            <v-date-input class="mb-2" hide-details density="compact" v-model="date"
                :label="t(translationPrefix + 'filter.date')" clearable />
            <v-text-field class="mb-2" hide-details density="compact" :model-value="time"
                @update:model-value="updateTime" :label="`${t(translationPrefix + 'filter.time')} (hh:mm[:ss])`"
                placeholder="00:00:00" inputmode="numeric" maxlength="8" persistent-placeholder clearable
                :rules="[validateTime]" />
        </div>
        <div v-else-if="showRangeInput">
            <div class="flex gap-2">
                <v-date-input class="mb-2" hide-details density="compact" v-model="rangeStartDate"
                    :label="`${t(translationPrefix + 'filter.start')} ${t(translationPrefix + 'filter.date')}`"
                    clearable />
                <v-text-field class="mb-2" hide-details density="compact" :model-value="rangeStartTime"
                    @update:model-value="updateRangeStartTime"
                    :label="`${t(translationPrefix + 'filter.start')} ${t(translationPrefix + 'filter.time')}`"
                    placeholder="00:00:00" inputmode="numeric" maxlength="8" persistent-placeholder clearable
                    :rules="[validateTime]" />
            </div>
            <div class="flex gap-2">
                <v-date-input class="mb-2" hide-details v-model="rangeEndDate"
                    :label="`${t(translationPrefix + 'filter.end')} ${t(translationPrefix + 'filter.date')}`"
                    clearable />
                <v-text-field class="mb-2" hide-details density="compact" :model-value="rangeEndTime"
                    @update:model-value="updateRangeEndTime"
                    :label="`${t(translationPrefix + 'filter.end')} ${t(translationPrefix + 'filter.time')}`"
                    placeholder="00:00:00" inputmode="numeric" maxlength="8" persistent-placeholder clearable
                    :rules="[validateTime]" />
            </div>
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

// Single value
const date = ref<string | null>(null);
const time = ref<string | null>(null);

// Range values
const rangeStartDate = ref<string | null>(null);
const rangeStartTime = ref<string | null>(null);

const rangeEndDate = ref<string | null>(null);
const rangeEndTime = ref<string | null>(null);

const noValueOperators: OperatorType[] = [
    'isNull', 'isNotNull', 'empty', 'notEmpty'
];
const rangeOperators: OperatorType[] = [
    'between', 'notBetween'
];

const showSingleInput = computed(() =>
    !noValueOperators.includes(operator.value) && !rangeOperators.includes(operator.value)
);
const showRangeInput = computed(() =>
    rangeOperators.includes(operator.value)
);

function normalizeTimeInput(val: string | null): string {
    const digits = (val ?? '').replace(/\D/g, '').slice(0, 6);

    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

function validateTime(val: string | null) {
    const value = (val ?? '').trim();
    if (!value) return true;

    return /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(value) || 'Invalid format (hh:mm[:ss])';
}

function combineDateTime(date: string | null, time: string | null): string | null {
    if (!date) return null;
    if (!time) return `${date}T00:00:00`;
    return `${date}T${time.length === 5 ? time + ':00' : time}`;
}

function updateTime(val: string | null): void {
    time.value = normalizeTimeInput(val);
}

function updateRangeStartTime(val: string | null): void {
    rangeStartTime.value = normalizeTimeInput(val);
}

function updateRangeEndTime(val: string | null): void {
    rangeEndTime.value = normalizeTimeInput(val);
}

const valid = computed(() => {
    if (noValueOperators.includes(operator.value)) return true;
    if (rangeOperators.includes(operator.value)) {
        return !!rangeStartDate.value && !!rangeEndDate.value;
    }
    return !!date.value;
});

watch(operator, (newOp) => {
    if (noValueOperators.includes(newOp)) {
        date.value = null;
        time.value = null;
        rangeStartDate.value = null;
        rangeStartTime.value = null;
        rangeEndDate.value = null;
        rangeEndTime.value = null;
    } else if (rangeOperators.includes(newOp)) {
        date.value = null;
        time.value = null;
    } else {
        rangeStartDate.value = null;
        rangeStartTime.value = null;
        rangeEndDate.value = null;
        rangeEndTime.value = null;
    }
});

const getFilterDefinition = (): null | FilterDefinition => {
    if (!valid.value) return null;
    if (rangeOperators.includes(operator.value)) {
        return {
            operator: operator.value,
            value: [
                combineDateTime(rangeStartDate.value, rangeStartTime.value),
                combineDateTime(rangeEndDate.value, rangeEndTime.value)
            ]
        };
    }
    if (noValueOperators.includes(operator.value)) {
        return { operator: operator.value, value: null };
    }
    return {
        operator: operator.value,
        value: combineDateTime(date.value, time.value)
    };
};

const resetFilter = (): void => {
    operator.value = '=';
    date.value = null;
    time.value = null;
    rangeStartDate.value = null;
    rangeStartTime.value = null;
    rangeEndDate.value = null;
    rangeEndTime.value = null;
};

defineExpose<FilterImplementation>({
    getFilterDefinition,
    resetFilter,
    valid
});
</script>