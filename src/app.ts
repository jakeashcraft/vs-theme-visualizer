import { ThemeParser } from './parser.js';
import type { VSTheme, ThemeColor, ColorStats } from './types.js';

class ThemeViewer {
    private parser: ThemeParser;
    private currentTheme: VSTheme | null = null;
    private filteredColors: ThemeColor[] = [];
    private allColors: ThemeColor[] = [];
    private currentView: 'grid' | 'list' = 'grid';
    private selectedColor: ThemeColor | null = null;

    constructor() {
        this.parser = new ThemeParser();
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
        exportBtn.addEventListener('click', () => this.exportTheme());

        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        searchInput.addEventListener('input', () => this.filterColors());

        const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
        categoryFilter.addEventListener('change', () => this.filterColors());

        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const view = target.dataset.view as 'grid' | 'list';
                this.setView(view);
            });
        });

        const modal = document.getElementById('colorModal') as HTMLElement;
        const closeBtn = modal.querySelector('.close') as HTMLElement;
        closeBtn.addEventListener('click', () => this.closeModal());

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        const resetBtn = document.getElementById('resetColorBtn') as HTMLButtonElement;
        resetBtn.addEventListener('click', () => this.resetColor());

        const applyBtn = document.getElementById('applyColorBtn') as HTMLButtonElement;
        applyBtn.addEventListener('click', () => this.applyColorChanges());

        const colorPicker = document.getElementById('modalColorPicker') as HTMLInputElement;
        colorPicker.addEventListener('input', (e) => {
            const hexInput = document.getElementById('modalColorHex') as HTMLInputElement;
            hexInput.value = (e.target as HTMLInputElement).value;
            this.updateColorPreview();
        });

        const hexInput = document.getElementById('modalColorHex') as HTMLInputElement;
        hexInput.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                colorPicker.value = value;
                this.updateColorPreview();
            }
        });
    }

    private async handleFileUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;

        try {
            const content = await this.readFile(file);
            this.currentTheme = this.parser.parseThemeFile(content);
            this.extractAllColors();
            this.displayTheme();
            this.enableControls();
        } catch (error) {
            alert('Error loading theme file: ' + (error as Error).message);
        }
    }

    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    private extractAllColors(): void {
        if (!this.currentTheme) return;

        this.allColors = [];
        this.currentTheme.categories.forEach(category => {
            this.allColors.push(...category.colors);
        });
        this.filteredColors = [...this.allColors];
    }

    private displayTheme(): void {
        if (!this.currentTheme) return;

        const loadingMessage = document.getElementById('loadingMessage') as HTMLElement;
        loadingMessage.classList.add('hidden');

        const themeInfo = document.getElementById('themeInfo') as HTMLElement;
        themeInfo.classList.remove('hidden');

        const themeName = document.getElementById('themeName') as HTMLElement;
        themeName.textContent = this.currentTheme.name;

        const stats = this.calculateStats();
        
        const categoryCount = document.getElementById('categoryCount') as HTMLElement;
        categoryCount.textContent = `${this.currentTheme.categories.size} categories`;

        const colorCount = document.getElementById('colorCount') as HTMLElement;
        colorCount.textContent = `${stats.totalColors} colors`;

        this.updateModifiedCount();
        this.populateCategoryFilter();
        this.renderColors();
    }

    private calculateStats(): ColorStats {
        const stats: ColorStats = {
            totalColors: 0,
            uniqueForegrounds: new Set(),
            uniqueBackgrounds: new Set(),
            modifiedColors: 0
        };

        this.allColors.forEach(color => {
            stats.totalColors++;
            if (color.foreground) stats.uniqueForegrounds.add(color.foreground);
            if (color.background) stats.uniqueBackgrounds.add(color.background);
            if (color.isModified) stats.modifiedColors++;
        });

        return stats;
    }

    private populateCategoryFilter(): void {
        if (!this.currentTheme) return;

        const filter = document.getElementById('categoryFilter') as HTMLSelectElement;
        filter.innerHTML = '<option value="">All Categories</option>';

        const categories = Array.from(this.currentTheme.categories.keys()).sort();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filter.appendChild(option);
        });
    }

    private filterColors(): void {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        this.filteredColors = this.allColors.filter(color => {
            const matchesSearch = !searchTerm || 
                color.name.toLowerCase().includes(searchTerm) ||
                color.foreground?.toLowerCase().includes(searchTerm) ||
                color.background?.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory || color.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderColors();
    }

    private renderColors(): void {
        const container = document.getElementById('colorGrid') as HTMLElement;
        container.innerHTML = '';
        container.className = this.currentView === 'grid' ? 'color-grid' : 'color-list';

        const uniqueColors = new Map<string, ThemeColor>();
        
        this.filteredColors.forEach(color => {
            if (color.foreground && !uniqueColors.has(color.foreground)) {
                uniqueColors.set(color.foreground, color);
            }
            if (color.background && !uniqueColors.has(color.background)) {
                uniqueColors.set(color.background, color);
            }
        });

        uniqueColors.forEach((color, colorValue) => {
            const element = this.createColorElement(color, colorValue);
            container.appendChild(element);
        });
    }

    private createColorElement(color: ThemeColor, displayColor: string): HTMLElement {
        const element = document.createElement('div');
        element.className = 'color-item';
        if (color.isModified) {
            element.classList.add('modified');
        }

        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = displayColor;

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        
        const colorName = document.createElement('div');
        colorName.className = 'color-name';
        colorName.textContent = color.name;

        const colorValue = document.createElement('div');
        colorValue.className = 'color-value';
        colorValue.textContent = displayColor;

        const colorCategory = document.createElement('div');
        colorCategory.className = 'color-category';
        colorCategory.textContent = color.category;

        colorInfo.appendChild(colorName);
        colorInfo.appendChild(colorValue);
        colorInfo.appendChild(colorCategory);

        element.appendChild(colorBox);
        element.appendChild(colorInfo);

        element.addEventListener('click', () => this.openColorModal(color));

        return element;
    }

    private openColorModal(color: ThemeColor): void {
        this.selectedColor = color;
        
        const modal = document.getElementById('colorModal') as HTMLElement;
        modal.classList.remove('hidden');

        const modalName = document.getElementById('modalColorName') as HTMLElement;
        modalName.textContent = color.name;

        const modalCategory = document.getElementById('modalCategory') as HTMLElement;
        modalCategory.textContent = color.category;

        const modalType = document.getElementById('modalColorType') as HTMLElement;
        const types = [];
        if (color.foreground) types.push('Foreground');
        if (color.background) types.push('Background');
        modalType.textContent = types.join(' & ');

        const displayColor = color.foreground || color.background || '#000000';
        const originalColor = color.originalForeground || color.originalBackground || '#000000';

        const modalOriginal = document.getElementById('modalOriginalColor') as HTMLElement;
        modalOriginal.textContent = originalColor;

        const colorPicker = document.getElementById('modalColorPicker') as HTMLInputElement;
        colorPicker.value = displayColor;

        const hexInput = document.getElementById('modalColorHex') as HTMLInputElement;
        hexInput.value = displayColor;

        this.updateColorPreview();
    }

    private updateColorPreview(): void {
        const colorPicker = document.getElementById('modalColorPicker') as HTMLInputElement;
        const preview = document.getElementById('modalColorPreview') as HTMLElement;
        preview.style.backgroundColor = colorPicker.value;
    }

    private resetColor(): void {
        if (!this.selectedColor) return;

        if (this.selectedColor.originalForeground) {
            this.selectedColor.foreground = this.selectedColor.originalForeground;
        }
        if (this.selectedColor.originalBackground) {
            this.selectedColor.background = this.selectedColor.originalBackground;
        }
        
        this.selectedColor.isModified = false;
        this.updateModifiedCount();
        this.renderColors();
        this.closeModal();
    }

    private applyColorChanges(): void {
        if (!this.selectedColor) return;

        const colorPicker = document.getElementById('modalColorPicker') as HTMLInputElement;
        const newColor = colorPicker.value;

        if (this.selectedColor.foreground) {
            this.selectedColor.foreground = newColor;
        }
        if (this.selectedColor.background) {
            this.selectedColor.background = newColor;
        }

        const isOriginal = 
            this.selectedColor.foreground === this.selectedColor.originalForeground &&
            this.selectedColor.background === this.selectedColor.originalBackground;

        this.selectedColor.isModified = !isOriginal;
        
        this.updateModifiedCount();
        this.renderColors();
        this.closeModal();
    }

    private closeModal(): void {
        const modal = document.getElementById('colorModal') as HTMLElement;
        modal.classList.add('hidden');
        this.selectedColor = null;
    }

    private updateModifiedCount(): void {
        const stats = this.calculateStats();
        const modifiedBadge = document.getElementById('modifiedCount') as HTMLElement;
        
        if (stats.modifiedColors > 0) {
            modifiedBadge.textContent = `${stats.modifiedColors} modified`;
            modifiedBadge.classList.remove('hidden');
        } else {
            modifiedBadge.classList.add('hidden');
        }
    }

    private setView(view: 'grid' | 'list'): void {
        this.currentView = view;
        
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            const btnElement = btn as HTMLElement;
            btnElement.classList.toggle('active', btnElement.dataset.view === view);
        });
        
        this.renderColors();
    }

    private enableControls(): void {
        const filterControls = document.getElementById('filterControls') as HTMLElement;
        filterControls.classList.remove('hidden');

        const colorContainer = document.getElementById('colorContainer') as HTMLElement;
        colorContainer.classList.remove('hidden');

        const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
        exportBtn.disabled = false;
    }

    private exportTheme(): void {
        if (!this.currentTheme) return;

        const xmlContent = this.parser.exportTheme(this.currentTheme);
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentTheme.name}_modified.vstheme`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ThemeViewer();
});