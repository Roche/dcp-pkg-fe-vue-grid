import { Column as OriginalColumn, ColumnType } from '@open-dcp/grid';

export interface GridColumn extends OriginalColumn {
    width?: string | number;
    notSortable?: boolean;
    notFilterable?: boolean;
    filterType?: Exclude<ColumnType, 'custom' | 'component'>;
}

export interface BodyCellSpecialValues {
    'null': string;
    'undefined': string;
}