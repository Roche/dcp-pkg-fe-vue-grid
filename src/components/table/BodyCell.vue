<template>
    <td :style="column.style">
        <template v-if="column.component">
            <component :is="column.component" :value="row[column.key]" :row="row"
                v-bind="column.componentPropsMapper ? column.componentPropsMapper(row[column.key], row) : {}" />
        </template>
        <template v-else-if="isRenderedElementValid">
            <span v-bind="normalizedRenderedElement"></span>
        </template>
        <template v-else-if="column.displayAsHtml">
            <span v-html="row[column.key].display"></span>
        </template>
        <template v-else>
            <span v-html="displayCell"></span>
        </template>
    </td>
</template>

<script lang="ts" setup>
import { PropType, computed } from 'vue';
import { GridColumn, BodyCellSpecialValues } from '@/types/GridColumn';
import { useDisplayCell } from '@/composables/useGridDisplayCell';
import { Row } from '@open-dcp/grid';

const props = defineProps({
    column: {
        type: Object as PropType<GridColumn>,
        required: true
    },
    row: {
        type: Object as PropType<Row>,
        required: true
    },
    specialDisplayValues: {
        type: Object as PropType<BodyCellSpecialValues>,
        required: true
    },
})

defineEmits(['toggle-sort'])

// Check if renderedElement is valid
const isRenderedElementValid = computed(() => {
    const renderedElement = props.row[props.column.key]?.renderedElement;
    return renderedElement && typeof renderedElement === 'object';
});

// Normalize renderedElement to ensure compatibility with Vue's v-bind
const normalizedRenderedElement = computed(() => {
    const renderedElement = props.row[props.column.key]?.renderedElement;

    if (!renderedElement || typeof renderedElement !== 'object') {
        return {};
    }

    // Normalize the style property if it exists
    const { style, ...rest } = renderedElement;
    if (style instanceof CSSStyleDeclaration) {
        const normalizedStyle = Array.from(style).reduce((styleObj, key) => {
            styleObj[key] = style.getPropertyValue(key);
            return styleObj;
        }, {} as Record<string, string>);
        return { ...rest, style: normalizedStyle };
    }

    return renderedElement;
});

const displayCell = useDisplayCell(props.row[props.column.key], props.specialDisplayValues);
</script>
