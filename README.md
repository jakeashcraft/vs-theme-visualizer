# Visual Studio Theme Visualizer

## Project Overview

Visual Studio Theme Visualizer - A web-based tool that loads Visual Studio `.vstheme` files and displays their color palettes. Users can view, modify, and export theme colors through an interactive interface.

## Development Commands

### TypeScript Compilation
```bash
npx tsc          # Compile TypeScript files
npx tsc --watch  # Watch mode for development
```

### Running the Application
```bash
npx http-server -p 8080 -o  # Start local web server and open browser
```
Note: The application must be served through a web server due to ES module requirements. Direct file:// access will not work.

## Project Structure

This is a minimal TypeScript project for visualizing Visual Studio themes. The application:
- Parses `.vstheme` XML files to extract color definitions
- Displays unique foreground and background colors in a grid layout
- Provides color picker functionality for modifying colors
- Tracks original and modified colors for export

## TypeScript Configuration

The project uses strict TypeScript settings with:
- Target: ESNext
- Module: NodeNext
- Strict mode enabled
- React JSX support configured
- Source maps and declarations enabled