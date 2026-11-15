import { ref, computed, watch } from 'vue';
import { useFilterOperatorList } from '@/composables/useFilterOperatorList';
import type { OperatorType } from '@open-dcp/grid';

export function useGridFilter(
    operatorSet: 'string' | 'numeric' | 'date' | OperatorType[],
    t: (key: string, params?: any) => string,
    translationPrefix: string,
    noValueOperators: OperatorType[],
    initialOperator: OperatorType = '='
) {
    const operator = ref<OperatorType>(initialOperator);
    const value = ref<any>('');
    const operators = computed(() =>
        useFilterOperatorList(operatorSet, t, translationPrefix)
    );
    const showValueInput = computed(() => !noValueOperators.includes(operator.value));
    const valid = computed(() =>
        noValueOperators.includes(operator.value) || (value.value !== undefined && value.value !== null && value.value !== '')
    );

    watch(operator, (newOp) => {
        if (noValueOperators.includes(newOp)) {
            value.value = '';
        }
    });

    function resetFilter() {
        operator.value = initialOperator;
        value.value = '';
    }

    function getFilterDefinition() {
        if (!valid.value) return null;
        return { operator: operator.value, value: value.value };
    }

    return {
        operator,
        value,
        operators,
        showValueInput,
        valid,
        resetFilter,
        getFilterDefinition,
    };
}