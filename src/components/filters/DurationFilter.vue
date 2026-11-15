<template>
    <div>
        <v-select class="mb-2" hide-details density="compact" :items="operators" v-model="operator" item-title="label"
            item-value="value" />
        <div v-if="showValueInput" class="flex gap-2 items-end">
            <v-text-field class="mb-2" hide-details density="compact" v-model="duration"
                :label="`${t(translationPrefix + 'filter.duration')} (hh:mm:ss)`" placeholder="00:00:00"
                :rules="[validateDuration]" clearable />
            <span v-if="isValidDuration" class="ml-2 text-xs text-gray-500">
                ({{ durationInSeconds }} s)
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useGridFilter } from '@/composables/useGridFilter';
import { OperatorType } from '@open-dcp/grid';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FilterImplementation, FilterDefinition } from '@/types/FilterImplementation';
import { useTranslationPrefix } from '@/composables/useTranslationPrefix';

const translationPrefix = useTranslationPrefix();
const { t } = useI18n();

const noValueOperators: OperatorType[] = ['isNull', 'isNotNull', 'empty', 'notEmpty'];

// Use useGridFilter for operator logic
const {
    operator,
    operators,
    showValueInput,
    resetFilter: baseResetFilter,
} = useGridFilter('numeric', t, translationPrefix.value, noValueOperators);

// Duration-specific value and validation
const duration = ref<string | null>('');

const normalizedDuration = computed(() => (duration.value ?? '').trim());

// Validate duration in hh:mm:ss format
function validateDuration(val: string | null) {
    const value = (val ?? '').trim();
    if (!value) return true;
    return /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/.test(value) || 'Invalid format (hh:mm:ss)';
}

// Parse duration string to seconds
function parseDuration(val: string | null): number | null {
    const value = (val ?? '').trim();
    if (!value) return null;

    const match = /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/.exec(value);
    if (!match) return null;
    const [, h, m, s] = match;
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const isValidDuration = computed(() =>
    normalizedDuration.value.length > 0 && validateDuration(normalizedDuration.value) === true
);

const durationInSeconds = computed(() => {
    const seconds = parseDuration(duration.value);
    return seconds !== null ? seconds : '';
});

// Valid if operator is no-value or duration is valid and not empty
const valid = computed(() =>
    noValueOperators.includes(operator.value) ||
    isValidDuration.value
);

// Reset duration when operator changes to a no-value operator
watch(operator, (newOp) => {
    if (noValueOperators.includes(newOp)) {
        duration.value = '';
    }
});

// Return filter definition for parent
const getFilterDefinition = (): null | FilterDefinition => {
    if (!valid.value) return null;
    if (noValueOperators.includes(operator.value)) {
        return { operator: operator.value, value: null };
    }
    return {
        operator: operator.value,
        value: parseDuration(normalizedDuration.value)
    };
};

// Reset both operator and duration
function resetFilter() {
    baseResetFilter();
    duration.value = '';
}

defineExpose<FilterImplementation>({
    getFilterDefinition,
    resetFilter,
    valid
});
</script>