// @vitest-environment jsdom
// jsdom instead of happy-dom: DOMPurify relies on a spec-compliant DOM (happy-dom keeps onerror and drops <b>).
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, afterEach } from 'vitest'
import BodyCell from '@/components/table/BodyCell.vue'

const specialDisplayValues = { null: 'N/A', undefined: 'N/A' }
const payload = '<img src=x onerror="window.__xss = true">'

const mountCell = (column: Record<string, unknown>, row: Record<string, unknown>) =>
    mount(BodyCell, {
        props: { column: { label: 'A', type: 'string', ...column } as any, row: row as any, specialDisplayValues },
        attachTo: document.createElement('tr')
    })

describe('BodyCell', () => {
    afterEach(() => {
        delete (window as any).__xss
    })

    it('renders cell data as text by default (no HTML injection)', async () => {
        const wrapper = mountCell({ key: 'a' }, { a: { display: payload } })
        await nextTick()

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.text()).toBe(payload)
        expect((window as any).__xss).toBeUndefined()
    })

    it('shows the special value for empty cells', () => {
        const wrapper = mountCell({ key: 'a' }, { a: { display: null } })
        expect(wrapper.find('span.text-muted').text()).toBe('N/A')
    })

    it('sanitizes opt-in HTML (displayAsHtml)', async () => {
        const wrapper = mountCell(
            { key: 'a', displayAsHtml: true },
            { a: { display: `<b>bold</b>${payload}<script>window.__xss = true</script>` } }
        )
        await nextTick()

        expect(wrapper.find('b').text()).toBe('bold')
        expect(wrapper.html()).not.toContain('onerror')
        expect(wrapper.find('script').exists()).toBe(false)
        expect((window as any).__xss).toBeUndefined()
    })

    it('updates when the row prop is replaced (no stale display, #3)', async () => {
        const wrapper = mountCell({ key: 'a' }, { a: { display: 'old' } })
        expect(wrapper.text()).toBe('old')

        await wrapper.setProps({ row: { a: { display: 'new' } } as any })

        expect(wrapper.text()).toBe('new')
    })
})
