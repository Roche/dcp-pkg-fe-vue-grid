import { describe, it, expect } from 'vitest'
import { useFilterOperatorList } from '@/composables/useFilterOperatorList'

describe('useFilterOperatorList', () => {
    it('returns numeric operator options with default labels', () => {
        const result = useFilterOperatorList('numeric')
        expect(result.some(o => o.value === '=')).toBe(true)
        expect(result.some(o => o.value === 'between')).toBe(true)
        expect(result[0].label).toContain('filter.operator.')
    })

    it('returns string operator options with translation', () => {
        const t = (key: string) => `translated:${key}`
        const result = useFilterOperatorList('string', t)
        expect(result[0].label.startsWith('translated:')).toBe(true)
    })

    it('applies translationPrefix correctly', () => {
        const t = (key: string) => key
        const result = useFilterOperatorList('numeric', t, 'foo')
        expect(result[0].label.startsWith('foo.filter.operator.')).toBe(true)
    })

    it('applies include and exclude overrides', () => {
        const result = useFilterOperatorList('numeric', undefined, '', {
            exclude: ['between'],
            include: ['matches']
        })
        expect(result.some(o => o.value === 'between')).toBe(false)
        expect(result.some(o => o.value === 'matches')).toBe(true)
    })

    it('works with a custom operator list', () => {
        const result = useFilterOperatorList(['=', '!=', 'in'])
        expect(result.map(o => o.value)).toEqual(['=', '!=', 'in'])
    })
})