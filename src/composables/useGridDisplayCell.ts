import { computed, ComputedRef, Ref, isRef } from 'vue';
import { BodyCellSpecialValues } from '@/types/GridColumn';

export function useDisplayCell(
    cell: Ref<any> | any,
    specialDisplayValues: BodyCellSpecialValues
): ComputedRef<string> {
    return computed(() => {
        const value = isRef(cell) ? cell.value : cell;
        const displayValue = value?.display;

        if (displayValue === undefined) {
            return `<span class="text-muted">${specialDisplayValues['undefined']}</span>`;
        }
        if (displayValue === null) {
            return `<span class="text-muted">${specialDisplayValues['null']}</span>`;
        }
        return displayValue;
    });
}