// composables/useColumnResizing.ts
import { ref } from 'vue';

export function useColumnResizing() {
    const columnWidths = ref<Record<string, string>>({});
    const manuallyResizedColumns = new Set<string>();
    const resizing = ref(false);
    const resizingColKey = ref<string | number | null>(null);
    const startX = ref(0);
    const startWidth = ref(0);

    function startResize(event: MouseEvent, colKey: string | number) {
        resizing.value = true;
        resizingColKey.value = colKey;
        startX.value = event.clientX;

        // Find the corresponding <col> element
        const colIndex = Object.keys(columnWidths.value).indexOf(String(colKey));
        const table = (event.target as HTMLElement).closest('table');
        let col: HTMLElement | null = null;
        if (table) {
            const cols = table.querySelectorAll('col');
            // If you have a selectable column, adjust colIndex accordingly
            col = cols[colIndex + (/* isSelectable */ 0)] as HTMLElement;
        }
        if (col?.style?.width) {
            startWidth.value = Number.parseInt(col.style.width, 10);
        } else {
            // fallback to th width
            const th = (event.target as HTMLElement).closest('th') as HTMLElement;
            startWidth.value = th ? th.offsetWidth : 0;
        }

        document.body.classList.add('select-none');
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
    }

    function onResize(event: MouseEvent) {
        if (!resizing.value || !resizingColKey.value) return;
        const diff = event.clientX - startX.value;
        const newWidth = Math.max(40, startWidth.value + diff); // min width 40px
        manuallyResizedColumns.add(String(resizingColKey.value));
        columnWidths.value[resizingColKey.value] = `${newWidth}px`;
    }

    function stopResize() {
        resizing.value = false;
        resizingColKey.value = null;
        document.body.classList.remove('select-none');
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    }

    return {
        columnWidths, manuallyResizedColumns, resizing, resizingColKey, startX, startWidth,
        startResize, onResize, stopResize
    };
}