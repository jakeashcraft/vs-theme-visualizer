import type { VSTheme, ThemeCategory, ThemeColor } from './types.js';

export class ThemeParser {
    parseThemeFile(xmlContent: string): VSTheme {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        const themeElement = doc.querySelector('Theme');
        if (!themeElement) {
            throw new Error('Invalid theme file: No Theme element found');
        }

        const baseGuid = themeElement.getAttribute('BaseGUID');
        const theme: VSTheme = {
            name: themeElement.getAttribute('Name') || 'Unknown Theme',
            guid: themeElement.getAttribute('GUID') || '',
            categories: new Map()
        };
        
        if (baseGuid) {
            theme.baseGuid = baseGuid;
        }

        const categoryElements = doc.querySelectorAll('Category');
        categoryElements.forEach(categoryEl => {
            const category = this.parseCategory(categoryEl);
            theme.categories.set(category.name, category);
        });

        return theme;
    }

    private parseCategory(categoryElement: Element): ThemeCategory {
        const category: ThemeCategory = {
            name: categoryElement.getAttribute('Name') || 'Unknown Category',
            guid: categoryElement.getAttribute('GUID') || '',
            colors: []
        };

        const colorElements = categoryElement.querySelectorAll('Color');
        colorElements.forEach(colorEl => {
            const color = this.parseColor(colorEl, category.name);
            if (color) {
                category.colors.push(color);
            }
        });

        return category;
    }

    private parseColor(colorElement: Element, categoryName: string): ThemeColor | null {
        const name = colorElement.getAttribute('Name');
        if (!name) return null;

        const color: ThemeColor = {
            name,
            category: categoryName
        };

        const foregroundEl = colorElement.querySelector('Foreground');
        if (foregroundEl) {
            const source = foregroundEl.getAttribute('Source');
            if (source) {
                color.foreground = this.normalizeColor(source);
                color.originalForeground = color.foreground;
            }
        }

        const backgroundEl = colorElement.querySelector('Background');
        if (backgroundEl) {
            const source = backgroundEl.getAttribute('Source');
            if (source) {
                color.background = this.normalizeColor(source);
                color.originalBackground = color.background;
            }
        }

        return (color.foreground || color.background) ? color : null;
    }

    private normalizeColor(colorValue: string): string {
        if (colorValue.startsWith('FF')) {
            return '#' + colorValue.substring(2);
        }
        if (colorValue.startsWith('#')) {
            return colorValue;
        }
        return '#' + colorValue;
    }

    exportTheme(theme: VSTheme): string {
        let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        xml += '<Themes>\n';
        xml += `  <Theme Name="${theme.name}" GUID="${theme.guid}"`;
        if (theme.baseGuid) {
            xml += ` BaseGUID="${theme.baseGuid}"`;
        }
        xml += '>\n';

        theme.categories.forEach(category => {
            xml += `    <Category Name="${category.name}" GUID="${category.guid}">\n`;
            
            category.colors.forEach(color => {
                xml += `      <Color Name="${color.name}">\n`;
                
                if (color.foreground) {
                    const foregroundValue = 'FF' + color.foreground.substring(1).toUpperCase();
                    xml += `        <Foreground Type="CT_RAW" Source="${foregroundValue}" />\n`;
                }
                
                if (color.background) {
                    const backgroundValue = 'FF' + color.background.substring(1).toUpperCase();
                    xml += `        <Background Type="CT_RAW" Source="${backgroundValue}" />\n`;
                }
                
                xml += '      </Color>\n';
            });
            
            xml += '    </Category>\n';
        });

        xml += '  </Theme>\n';
        xml += '</Themes>';
        
        return xml;
    }
}