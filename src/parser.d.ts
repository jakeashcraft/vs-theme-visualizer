import type { VSTheme } from './types.js';
export declare class ThemeParser {
    parseThemeFile(xmlContent: string): VSTheme;
    private parseCategory;
    private parseColor;
    private normalizeColor;
    exportTheme(theme: VSTheme): string;
}
//# sourceMappingURL=parser.d.ts.map