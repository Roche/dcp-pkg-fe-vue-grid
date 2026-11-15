import DcpGrid from '@/components/Grid.vue';
import DcpThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import DcpHeaderCell from '@/components/table/HeaderCell.vue';
import DcpHeaderCellFilter from '@/components/table/HeaderCellFilter.vue';
import BodyCell from '@/components/table/BodyCell.vue';

import { useTimeUtils } from '@/composables/useTimeUtils';
import { useDisplayCell } from '@/composables/useGridDisplayCell';

export type { GridService as DcpGridService, FilterCondition as DcpFilteringCondition, FilterNode as DcpFilterNode, FilterGroup as DcpFilterGroup } from '@open-dcp/grid';

const dcpComponents = {
  DcpGrid,
  DcpThreeDotsMenu,
  DcpHeaderCell,
  DcpHeaderCellFilter,
  BodyCell
};

export default {
  install(app: any) {
    Object.entries(dcpComponents).forEach(([name, component]) => {
      app.component(name, component);
    });
  },
};

// Export components individually as well
export {
  DcpGrid,
  DcpThreeDotsMenu,
  DcpHeaderCell,
  DcpHeaderCellFilter,
  BodyCell,
  
  useTimeUtils,
  useDisplayCell
};
