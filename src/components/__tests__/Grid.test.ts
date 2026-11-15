import { flushPromises, shallowMount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Grid from '@/components/Grid.vue';
import HeaderCell from '@/components/table/HeaderCell.vue';
import HeaderCellFilter from '@/components/table/HeaderCellFilter.vue';
import type { GridColumn } from '@/types/GridColumn';

vi.mock('@/components/table/HeaderCellFilter.vue', () => ({ default: {} }));
vi.mock('@/components/table/GridBody.vue', () => ({ default: {} }));

vi.mock('@open-dcp/utilities', () => ({
  logger: { log: vi.fn(), warn: vi.fn() }
}));

vi.mock('@/composables/useGridService', () => ({
  useGridService: () => ({
    gridService: {
      attachContainer: vi.fn(),
      handleScroll: vi.fn(),
      hasFilter: () => false,
      getSortCondition: () => undefined,
      toggleSort: vi.fn(),
      addFilter: vi.fn(),
      resetFilter: vi.fn(),
      clearGlobalSearch: vi.fn(),
      rowCount$: { subscribe: () => ({ unsubscribe: vi.fn() }) },
      filterSort$: { subscribe: () => ({ unsubscribe: vi.fn() }) }
    },
    renderRows: ref([]),
    firstRowHeight: ref(0),
    lastRowHeight: ref(0),
    selectedIndexes: ref(new Set<number>()),
    getRowKey: vi.fn(),
    toggleSelection: vi.fn(),
    toggleSelectAll: vi.fn()
  })
}));

class MockResizeObserver implements ResizeObserver {
  static instance: MockResizeObserver;
  static instances: MockResizeObserver[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instance = this;
    MockResizeObserver.instances.push(this);
  }

  notify() {
    this.callback([], this);
  }
}

describe('Grid container sizing', () => {
  let containerWidth: number;
  let frameId: number;
  let frames: Map<number, FrameRequestCallback>;
  const wrappers: ReturnType<typeof shallowMount<typeof Grid>>[] = [];

  const columns: GridColumn[] = [
    { key: 'name', label: 'Name', type: 'string' },
    { key: 'city', label: 'City', type: 'string' }
  ];

  function mountGrid(gridColumns = columns, rows = [{ name: 'Ada', city: 'Basel' }],
    options: { filterable?: boolean; sortable?: boolean } = {}) {
    const wrapper = shallowMount(Grid, {
      props: { columns: gridColumns, rows, resizable: true, ...options },
      global: { stubs: { HeaderCell: false, 'v-checkbox': true } }
    });
    wrappers.push(wrapper);
    return wrapper;
  }

  function notifyWidth(width: number) {
    containerWidth = width;
    MockResizeObserver.instance.notify();
  }

  async function flushFrames() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
    await nextTick();
  }

  async function flushMount() {
    await flushPromises();
    await flushFrames();
  }

  function widths(wrapper: ReturnType<typeof mountGrid>) {
    return wrapper.findAll('col').map(col => col.element.style.width);
  }

  beforeEach(() => {
    MockResizeObserver.instances = [];
    containerWidth = 800;
    frameId = 0;
    frames = new Map();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => containerWidth);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(0);
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  });

  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount());
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('updates auto widths when the container shrinks and grows', async () => {
    const wrapper = mountGrid();
    await flushMount();
    expect(MockResizeObserver.instance.observe).toHaveBeenCalledWith(wrapper.element);
    expect(widths(wrapper)).toEqual(['400px', '400px']);

    notifyWidth(450);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['225px', '225px']);

    notifyWidth(1000);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['500px', '500px']);
  });

  it('keeps long titles separate from controls and preserves header interactions', async () => {
    const label = 'Starttemperature T1/T2 with a very long column title';
    const wrapper = mountGrid([{ ...columns[0], label, width: '100px' }], undefined,
      { filterable: true, sortable: true });
    await flushMount();
    const header = wrapper.findComponent(HeaderCell);
    const title = header.find('.header-label');
    expect(title.text()).toBe(label);
    expect(title.attributes('title')).toBeUndefined();
    expect(title.attributes('role')).toBe('button');
    expect(header.find('.header-actions').findComponent(HeaderCellFilter).exists()).toBe(true);

    await title.trigger('click');
    const service = header.props('gridService');
    expect(service.toggleSort).toHaveBeenCalledWith('name');

    const filter = header.findComponent(HeaderCellFilter);
    const condition = { type: 'condition', columnKey: 'name', operator: 'equals', value: 'Ada' } as const;
    filter.vm.$emit('update-filter', condition);
    expect(service.addFilter).toHaveBeenCalledWith(condition);
    filter.vm.$emit('reset-filter');
    expect(service.resetFilter).toHaveBeenCalledWith('name');
    expect(header.find('.col-resizer').exists()).toBe(true);
    expect(widths(wrapper)).toEqual(['100px']);
  });

  it('only adds native titles for truncated labels and updates after resizing and content changes', async () => {
    let labelWidth = 100;
    let contentWidth = 100;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('header-label') ? labelWidth : containerWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => contentWidth);
    const wrapper = mountGrid([columns[0]]);
    await flushMount();
    const label = wrapper.find('.header-label');
    const observer = MockResizeObserver.instances.find(instance =>
      instance.observe.mock.calls.some(([element]) => element === label.element)
    );
    expect(observer).toBeDefined();
    expect(label.attributes('title')).toBeUndefined();

    contentWidth = 101;
    observer!.notify();
    await nextTick();
    expect(label.attributes('title')).toBe('Name');

    labelWidth = 150;
    observer!.notify();
    await nextTick();
    expect(label.attributes('title')).toBeUndefined();

    contentWidth = 200;
    await wrapper.setProps({ columns: [{ ...columns[0], label: 'Longer name' }] });
    await flushPromises();
    expect(label.attributes('title')).toBe('Longer name');

    labelWidth = 0;
    observer!.notify();
    await nextTick();
    expect(label.attributes('title')).toBeUndefined();
    wrapper.unmount();
    expect(observer!.disconnect).toHaveBeenCalledOnce();
  });

  it('adds control width and spacing to auto header measurements, not body measurements', async () => {
    containerWidth = 200;
    const wrapper = mountGrid(columns, undefined, { filterable: true });
    await nextTick();
    const tbody = document.createElement('tbody');
    const row = tbody.insertRow();
    row.insertCell().textContent = 'long body value';
    row.insertCell().textContent = 'short';
    wrapper.find('table').element.appendChild(tbody);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('header-actions')) return 32;
      if (this.textContent === 'long body value') return 300;
      return this.textContent === 'City' ? 200 : 100;
    });
    await flushMount();
    expect(widths(wrapper)).toEqual(['300px', '232px']);
  });

  it('remeasures auto widths when filtering is enabled or disabled', async () => {
    containerWidth = 200;
    const wrapper = mountGrid();
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('header-actions') ? 32 : 200;
    });
    await flushMount();
    expect(widths(wrapper)).toEqual(['200px', '200px']);
    await wrapper.setProps({ filterable: true });
    await flushFrames();
    expect(widths(wrapper)).toEqual(['232px', '232px']);
    await wrapper.setProps({ filterable: false });
    await flushFrames();
    expect(widths(wrapper)).toEqual(['200px', '200px']);
  });

  it('waits for a positive width when mounted hidden, even without rows', async () => {
    containerWidth = 0;
    const wrapper = mountGrid(columns, []);
    await flushMount();
    expect(widths(wrapper)).toEqual(['auto', 'auto']);
    notifyWidth(0);
    expect(frames.size).toBe(0);

    notifyWidth(450);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['225px', '225px']);
  });

  it('recalculates after hiding and showing at the same width', async () => {
    const wrapper = mountGrid();
    await flushMount();
    notifyWidth(0);
    expect(frames.size).toBe(0);
    notifyWidth(800);
    expect(frames.size).toBe(1);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['400px', '400px']);
  });

  it('ignores height-only notifications and coalesces width changes', async () => {
    const wrapper = mountGrid();
    await flushMount();
    notifyWidth(800);
    expect(frames.size).toBe(0);
    notifyWidth(600);
    notifyWidth(450);
    expect(frames.size).toBe(1);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['225px', '225px']);

    notifyWidth(450);
    expect(frames.size).toBe(0);
  });

  it('does not calculate while hidden if a resize was already queued', async () => {
    const wrapper = mountGrid();
    await flushMount();
    notifyWidth(450);
    notifyWidth(0);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['400px', '400px']);
    notifyWidth(450);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['225px', '225px']);
  });

  it('preserves fixed widths, scales percentages, and respects minimum widths', async () => {
    const wrapper = mountGrid([
      { ...columns[0], width: '120px' },
      { key: 'percent', label: 'Percent', type: 'string', width: '20%' },
      columns[1]
    ]);
    await flushMount();
    expect(widths(wrapper)).toEqual(['120px', '160px', '520px']);
    notifyWidth(450);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['120px', '90px', '240px']);
    notifyWidth(200);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['120px', '40px', '100px']);
  });

  it('preserves manually resized columns on container and data changes', async () => {
    const wrapper = mountGrid();
    await flushMount();
    await wrapper.find('.col-resizer').trigger('mousedown', { clientX: 400 });
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }));
    document.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(widths(wrapper)).toEqual(['300px', '400px']);

    notifyWidth(450);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['300px', '150px']);
    await wrapper.setProps({ rows: [{ name: 'Grace', city: 'Zurich' }] });
    await flushFrames();
    expect(widths(wrapper)).toEqual(['300px', '150px']);
  });

  it('disconnects and cancels pending work on unmount', async () => {
    const wrapper = mountGrid();
    await flushMount();
    notifyWidth(450);
    const pendingFrameId = frameId;
    wrapper.unmount();
    expect(MockResizeObserver.instance.disconnect).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(pendingFrameId);
    expect(frames.size).toBe(0);
    notifyWidth(600);
    expect(frames.size).toBe(0);
  });

  it('safely skips the initial nextTick calculation after immediate unmount', async () => {
    const wrapper = mountGrid();
    const measure = vi.spyOn(document, 'createElement');
    wrapper.unmount();
    await nextTick();
    expect(measure).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('coalesces row, column, mount, and resize requests into one calculation', async () => {
    const wrapper = mountGrid();
    await nextTick();
    await wrapper.setProps({
      rows: [{ name: 'Grace', city: 'Zurich' }],
      columns: columns.map(column => ({ ...column, label: `${column.label}!` }))
    });
    notifyWidth(600);
    expect(frames.size).toBe(1);
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
    await flushFrames();
    expect(measure).toHaveBeenCalledTimes(2);
    expect(widths(wrapper)).toEqual(['300px', '300px']);
    expect(frames.size).toBe(0);
  });

  it('preserves deep watching for in-place content and column changes', async () => {
    const rows = ref([{ name: 'Ada', city: 'Basel' }]);
    const reactiveColumns = ref(columns.map(column => ({ ...column })));
    const wrapper = mountGrid(reactiveColumns.value, rows.value);
    await flushMount();
    rows.value[0].name = 'Grace';
    reactiveColumns.value[0].width = '200px';
    await nextTick();
    expect(frames.size).toBe(1);
    await flushFrames();
    expect(widths(wrapper)).toEqual(['200px', '600px']);
  });

  it('batches all sampled spans before reading widths and removes them after all reads', async () => {
    const wrapper = mountGrid();
    await flushMount();
    const tbody = document.createElement('tbody');
    for (let i = 0; i < 12; i++) {
      const row = tbody.insertRow();
      row.insertCell().textContent = i < 10 ? 'name sample' : 'excluded';
      row.insertCell().textContent = i < 10 ? 'city sample' : 'excluded';
    }
    wrapper.find('table').element.appendChild(tbody);

    const append = vi.spyOn(document.body, 'appendChild');
    const remove = vi.spyOn(Element.prototype, 'remove');
    const measuredSpans: HTMLElement[] = [];
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockClear().mockImplementation(function (this: HTMLElement) {
      expect(document.body.querySelectorAll('span')).toHaveLength(22);
      expect(remove).not.toHaveBeenCalled();
      measuredSpans.push(this);
      if (this.textContent === 'excluded') return 1000;
      return this.textContent === 'name sample' ? 300 : 100;
    });

    wrapper.vm.calculateColumnWidths();
    await nextTick();

    expect(append.mock.calls.filter(([node]) => node instanceof DocumentFragment)).toHaveLength(1);
    expect(append.mock.calls[0][0]).toBeInstanceOf(DocumentFragment);
    expect(measure).toHaveBeenCalledTimes(22);
    expect(remove).toHaveBeenCalledTimes(22);
    expect(measuredSpans.every(span => !span.isConnected)).toBe(true);
    expect(widths(wrapper)).toEqual(['600px', '200px']);
  });

  it('keeps explicit sizing synchronous and cancels redundant scheduled work', async () => {
    const wrapper = mountGrid();
    await flushMount();
    notifyWidth(600);
    expect(frames.size).toBe(1);
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockClear();
    wrapper.vm.calculateColumnWidths();
    expect(measure).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    await nextTick();
    expect(widths(wrapper)).toEqual(['300px', '300px']);
  });

  it('cleans up all measurement spans when a width read fails', async () => {
    const wrapper = mountGrid();
    await flushMount();
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => {
      throw new Error('Measurement failed');
    });
    expect(() => wrapper.vm.calculateColumnWidths()).toThrow('Measurement failed');
    expect(document.body.querySelectorAll('span')).toHaveLength(0);
  });
});
