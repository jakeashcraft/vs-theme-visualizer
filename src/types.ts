export interface ThemeColor {
    name: string;
    category: string;
    foreground?: string;
    background?: string;
    originalForeground?: string;
    originalBackground?: string;
    isModified?: boolean;
}

export interface ThemeCategory {
    name: string;
    guid: string;
    colors: ThemeColor[];
}

export interface VSTheme {
    name: string;
    guid: string;
    baseGuid?: string;
    categories: Map<string, ThemeCategory>;
}

export interface ColorStats {
    totalColors: number;
    uniqueForegrounds: Set<string>;
    uniqueBackgrounds: Set<string>;
    modifiedColors: number;
}