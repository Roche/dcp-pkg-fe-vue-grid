import { describe, it, expect, vi } from 'vitest'

// Mock vue-i18n composable
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: { value: 'en' }
    })
}))

import { useTimeUtils } from '@/composables/useTimeUtils'

describe('useTimeUtils', () => {
    const { formatRelativeTime, parseAndFormatDate, getCurrentUtcIsoString } = useTimeUtils()

    it('formats relative time for a recent date', () => {
        const now = new Date()
        const result = formatRelativeTime(now)
        expect(result).toMatch(/less than a minute|minute|second/)
    })

    it('formats relative time for a past date', () => {
        const past = new Date(Date.now() - 1000 * 60 * 60 * 24)
        const result = formatRelativeTime(past)
        expect(result).toMatch(/day|24 hours/)
    })

    it('returns "Invalid date" for invalid input', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        expect(formatRelativeTime('not-a-date')).toBe('Invalid date')
        spy.mockRestore()
    })

    it('parses and formats a UTC ISO date string with timezone', () => {
        const iso = '2024-01-01T12:00:00Z'
        const formatted = parseAndFormatDate(iso, 'yyyy-MM-dd HH:mm:ssXXX', 'Europe/Berlin')
        expect(typeof formatted).toBe('string')
        expect(formatted).toMatch(/^2024-01-01 13:00:00\+01:00$/)
    })

    it('returns null for invalid parseAndFormatDate input', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        expect(parseAndFormatDate('bad-date', 'yyyy-MM-dd', 'Europe/Berlin')).toBeNull()
        spy.mockRestore()
    })

    it('gets current UTC ISO string', () => {
        const iso = getCurrentUtcIsoString()
        expect(typeof iso).toBe('string')
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
})