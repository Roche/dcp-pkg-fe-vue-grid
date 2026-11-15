import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { useDisplayCell } from '@/composables/useGridDisplayCell'

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
})