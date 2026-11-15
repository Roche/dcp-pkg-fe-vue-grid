import { describe, it, expect } from 'vitest'
import { useRounding } from '@/composables/useRounding'

describe('useRounding', () => {
    const { round } = useRounding()

    it('rounds a single number to 0 digits by default', () => {
        expect(round(1.7)).toBe(2)
        expect(round(1.2)).toBe(1)
    })

    it('rounds a single number to specified digits', () => {
        expect(round(1.2345, 2)).toBe(1.23)
        expect(round(1.2355, 2)).toBe(1.24)
    })

    it('returns integer as is', () => {
        expect(round(5, 2)).toBe(5)
    })

    it('returns x as is if digits is Infinity or NaN', () => {
        expect(round(1.234, Infinity)).toBe(1.234)
        expect(round(1.234, Number.NaN)).toBe(1.234)
    })

    it('adds trailing zeros if requested', () => {
        expect(round(1.2, 3, true)).toBe('1.200')
        expect(round(1.234, 2, true)).toBe('1.23')
    })

    it('works with arrays', () => {
        expect(round([1.234, 2.345], 2)).toEqual([1.23, 2.35])
        expect(round([1.2, 2.3], 2, true)).toEqual(['1.20', '2.30'])
    })
})