import { computed, ComputedRef, Ref, isRef } from 'vue';
import { BodyCellSpecialValues } from '@/types/GridColumn';

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/** Escapes text for safe use inside HTML. */
export function escapeHtml(value: unknown): string {
    return String(value).replace(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

type MaybeGetter<T> = Ref<T> | (() => T) | T;

function resolve<T>(source: MaybeGetter<T>): T {
    if (typeof source === 'function') return (source as () => T)();
    return isRef(source) ? source.value : source;
}

/**
 * Display HTML for a grid cell. The cell's `display` value is **escaped** (cell data is treated as text,
 * never as markup), so the result is safe for `v-html`. `null` / `undefined` show the special values in a
 * muted span. Pass a getter (`() => row[key]`) or a ref to keep the result reactive.
 */
export function useDisplayCell(
    cell: MaybeGetter<any>,
    specialDisplayValues: MaybeGetter<BodyCellSpecialValues>
): ComputedRef<string> {
    return computed(() => {
        const value = resolve(cell);
        const specials = resolve(specialDisplayValues) ?? {};
        const displayValue = value?.display;

        if (displayValue === undefined) {
            return `<span class="text-muted">${escapeHtml(specials['undefined'] ?? '')}</span>`;
        }
        if (displayValue === null) {
            return `<span class="text-muted">${escapeHtml(specials['null'] ?? '')}</span>`;
        }
        return escapeHtml(displayValue);
    });
}
