import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { useDisplayCell, escapeHtml } from '@/composables/useGridDisplayCell'

describe('useDisplayCell', () => {
    const specialDisplayValues = {
        undefined: 'N/A',
        null: 'None'
    }

    it('returns special value for undefined', () => {
        const cell = ref({ display: undefined })
        const display = useDisplayCell(cell, specialDisplayValues)
        expect(display.value).toBe('<span class="text-muted">N/A</span>')
    })

    it('returns special value for null', () => {
        const cell = ref({ display: null })
        const display = useDisplayCell(cell, specialDisplayValues)
        expect(display.value).toBe('<span class="text-muted">None</span>')
    })

    it('returns display value for normal value', () => {
        const cell = ref({ display: 'Hello' })
        const display = useDisplayCell(cell, specialDisplayValues)
        expect(display.value).toBe('Hello')
    })

    it('works with plain object (not a ref)', () => {
        const cell = { display: 'World' }
        const display = useDisplayCell(cell, specialDisplayValues)
        expect(display.value).toBe('World')
    })

    it('escapes HTML in cell data (treated as text)', () => {
        const display = useDisplayCell({ display: '<img src=x onerror=alert(1)>' }, specialDisplayValues)
        expect(display.value).toBe('&lt;img src=x onerror=alert(1)&gt;')
    })

    it('escapes quotes, ampersands and special values', () => {
        expect(useDisplayCell({ display: `Tom & "Jerry" 'x'` }, specialDisplayValues).value)
            .toBe('Tom &amp; &quot;Jerry&quot; &#39;x&#39;')
        expect(useDisplayCell({ display: null }, { null: '<b>x</b>', undefined: '' }).value)
            .toBe('<span class="text-muted">&lt;b&gt;x&lt;/b&gt;</span>')
    })

    it('stringifies non-string display values', () => {
        expect(useDisplayCell({ display: 42 }, specialDisplayValues).value).toBe('42')
    })

    it('stays reactive with a getter', () => {
        const row = ref<Record<string, any>>({ a: { display: 'old' } })
        const display = useDisplayCell(() => row.value.a, () => specialDisplayValues)
        expect(display.value).toBe('old')

        row.value = { a: { display: 'new' } }
        expect(display.value).toBe('new')
    })

    it('escapeHtml leaves plain text unchanged', () => {
        expect(escapeHtml('Temperature 21.5 °C')).toBe('Temperature 21.5 °C')
    })
})
