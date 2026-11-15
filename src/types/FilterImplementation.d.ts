import { Ref } from "vue";
import { FilterCondition } from "@open-dcp/grid";

export interface FilterDefinition {
  operator: OperatorType;
  value: any;
}

export interface FilterImplementation {
  getFilterDefinition: () => null | FilterDefinition;
  resetFilter: () => void;
  valid: Ref<boolean>;
}

export interface ColumnDropdownSlotProps {
  columnKey: string;
  updateColumn: (val: string) => void;
  columnOptions?: Array<{ label: string; value: string; type?: string }>;
};