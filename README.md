# Preproute Test Studio

A comprehensive, high-fidelity Test Management application built for candidate evaluations. Redesigned to align 100% with the Figma design specifications and structural page flows.

---

## 🚀 Implemented Features

### 1. Split-Screen Login Page
*   **Custom Graphic**: Hand-crafted a modern workspace desk graphic in pure CSS on the left panel (monitor, desk, chair, plant).
*   **Fields**: Configured custom styled form fields labeled "Email ID" and "Password" with preloaded defaults.
*   **Interactive Links**: Includes an interactive dialog alert for "Forgot password?".

### 2. Dashboard / Test List
*   Displays all created tests in a table showing Name, Subject, Topics, status pills, and Date Created.
*   Filter/search by test name, subject, or topics in real-time.
*   Actions: Inline buttons to Edit details, Preview, or Delete.

### 3. Create & Edit Test Form
*   **Figma tabs**: Toggle between "Chapterwise", "PYQ", and "Mock Test" to dynamically configure test type.
*   **Card Radios**: Replace standard select lists with cards to mark test difficulty (Easy, Medium, Difficult).
*   **Custom Multiselect**: Built a custom react `MultiSelect` checkbox-dropdown list with dropdown overlays and search triggers to select Subject Topics and Subtopics.
*   **Footer Actions**: Restructured buttons to cleanly align with Figma controls ("Cancel", "Save as Draft", and "Next").

### 4. Split-Screen Question Builder
*   **checklists Navigator**: Displays list of questions on the left side with complete indicators (green checkmarks) and trash deletes.
*   **CSV Import**: Fully handles bulk uploading questions from standard CSV files into the editor draft list.
*   **Figma Options Layout**: Configured inline radio buttons directly next to Option 1–4 input fields to set the correct answer. Includes custom trash-can clear buttons next to each option.
*   **Settings Panel**: Renders Layout, Topic, and Sub Topic selectors fetched directly from the subject/topic endpoints.

### 5. Preview & Publish Settings
*   **Confirmation Modal**: Clicking "Publish Test" triggers an overlay drawer to configure final launching settings.
*   **Publish Now**: Select live duration availability (e.g. Always Available, 3 Days, 1 Week).
*   **Schedule Publish**: Select a future Date/Time picker and availability window.

### 6. App Header & Shell
*   Relocated user profile metadata (avatar, name) and the **Logout** action from the sidebar footer to the top-right header section.
*   Navigation links styled with active states matching Figma.

---

## 🛠️ Technical Decisions

1.  **Framework & Language**: React 19 + TypeScript for type-safety and robust component declarations.
2.  **State Management & Forms**: `React Hook Form` combined with `Zod` schema validation to handle complex multiselect fields, marking scheme limits, and instant validation styling.
3.  **Icons**: `Lucide React` for clean, consistent, scalable iconography.
4.  **Styling**: Structured Vanilla CSS (`src/styles.css`) for high flexibility, custom CSS illustrations, and desktop-first media query breakpoints.

---

## 📦 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run local development server:
    ```bash
    npm run dev
    ```

3.  Build production bundle:
    ```bash
    npm run build
    ```

---

## 📋 API Integration Summary

All endpoints proxy to the staging Railway backend:
*   `POST /auth/login` (Admin/moderator login)
*   `GET /subjects` (Subject metadata)
*   `GET /topics/subject/:subjectId` (Topics list)
*   `POST /sub-topics/multi-topics` (Subtopics list)
*   `GET /tests` (List tests)
*   `POST /tests` (Create test)
*   `PUT /tests/:id` (Update/Publish test)
*   `POST /questions/bulk` (Create questions)
