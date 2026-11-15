import Grid from "@/components/Grid.vue";
import { diverseColumns, generateDiverseMockRows } from "./mockData";
import { useI18n } from "vue-i18n";
import type { StoryFn } from "@storybook/vue3";

export default {
    title: "Translation",
    component: Grid,
    parameters: {
        docs: {
            description: {
                component: "Demonstrates grid translation using vue-i18n's t function and translationPrefix.",
            },
        },
    },
};

const Template: StoryFn = (args: any) => ({
    components: { Grid },
    setup() {
        const { locale } = useI18n();

        // Language switcher
        const switchLanguage = (lang: string) => {
            locale.value = lang;
        };

        return { args, locale, switchLanguage };
    },
    template: `
    <div>
      <div class="w-full" style="margin-bottom: 1rem;">
        <label>
            <span style="margin-right:50px;">Language:</span>
            <select v-model="locale" @change="switchLanguage(locale)">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
            </select>
        </label>
      </div>
      <Grid
        v-bind="args"
        translation-prefix="@open-dcp/i18n"
      />
    </div>
    `,
});

export const GridTranslation = Template.bind({});
GridTranslation.args = {
    rows: generateDiverseMockRows(100),
    columns: diverseColumns,
    filterable: true,
};
GridTranslation.parameters = {
    docs: {
        description: {
            story: "Grid translations and filter labels are shown using vue-i18n's t function and translationPrefix.",
        },
    },
};