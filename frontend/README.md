# EchoChamber Frontend

This is the frontend application for EchoChamber, a multi-agent public relations simulator built with React, TypeScript, and Vite.

## Prerequisites

- Node.js (version 16 or higher)
- pnpm (recommended package manager)

## Installation

1. Install pnpm globally (if not already installed):
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `pnpm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `pnpm preview`

Serves the production build locally for testing.\
Open [http://localhost:4173](http://localhost:4173) to view the preview.

### `pnpm test`

Launches the test runner using Vitest.\
Runs tests in watch mode for development.

### `pnpm lint`

Runs ESLint to check for code quality issues.\
Automatically fixes issues where possible.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── scenario1/      # Scenario 1 related pages
│   └── scenario2/      # Scenario 2 related pages
├── layout/             # Layout components
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Features

- **Scenario 1**: Custom PR strategy simulation with LLM refinement
- **Scenario 2**: Historical case analysis and comparison
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark UI design
- **TypeScript**: Full type safety
- **Ant Design**: Professional UI components

## Development

This project uses:
- React 19.1.1
- TypeScript 5.0.2
- Vite 5.0.0
- Ant Design 5.27.4
- React Router DOM 6.8.0
- TanStack Query 5.0.0

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/).

To learn React, check out the [React documentation](https://reactjs.org/).

To learn pnpm, check out the [pnpm documentation](https://pnpm.io/).

To learn TypeScript, check out the [TypeScript documentation](https://www.typescriptlang.org/).
