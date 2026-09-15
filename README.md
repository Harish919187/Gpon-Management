# GPON Network Management System

A modern, responsive web application for managing GPON network details, built with React, TypeScript, Tailwind CSS, and Lucide React.

## Prerequisites

You need to have **Node.js** installed on your system to run this application.
1. Download and install Node.js from [nodejs.org](https://nodejs.org/).
2. Verify the installation by opening a new Command Prompt or PowerShell and running:
   ```bash
   node -v
   npm -v
   ```

## Getting Started

Follow these steps to run the application:

1. **Open a terminal** (Command Prompt or PowerShell) and navigate to this project folder:
   ```bash
   cd "c:\Users\haree\OneDrive\Documents\NETWORK AREA\gpon-management"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   The terminal will output a local URL (e.g., `http://localhost:5173`). Open that URL in your web browser.

## Features Included

- **Excel Data Upload**: Click the "Upload Excel" button to select `.xlsx` or `.xls` files. The data will be parsed and loaded into the table.
- **Persistent Data Storage**: All data is saved in your browser's `localStorage`, meaning your data persists even after refreshing the page.
- **Search Functionality**: Instantly search across fields like Customer Name, ONU Serial, Location, OLT Name, and Contact Number.
- **Add, Edit, and Delete**: Easily add new records using the "Add Record" button, edit existing rows with the pencil icon, or delete rows with the trash bin icon.
- **Pagination and Sorting**: The table supports sorting by clicking on column headers and includes pagination for large datasets.
- **Responsive UI**: Built with Tailwind CSS, ensuring the layout is clean, professional, and responsive across desktop and mobile.
