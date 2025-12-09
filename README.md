# Todo Stack

## Live Web App
[👉 Open the hosted Todo Stack](https://your-username.github.io/todo_stack/)

A minimal browser-only todo stack app built with plain HTML, CSS, and JavaScript. All todos live in `localStorage`, and the most recent item always sits on top of the stack.

### Features
- Main view that shows only the top (most recent) todo with inline editing
- List view with drag-and-drop reordering, inline edits, and done/remove checkboxes
- Floating add button to push a new todo on top of the stack
- Import/export JSON and clear stack options from the hamburger menu
- Responsive, clean layout ready for GitHub Pages hosting (no build step)

### Running locally
1. Clone or download this repository.
2. Open `index.html` in your browser, or serve the folder with a simple server (e.g. `python -m http.server`).
3. Your todos stay in your browser via `localStorage`.

### Data format
Each todo is stored with:
- `id`: unique identifier
- `title`: text content
- `createdAt`: ISO timestamp
- `done`: completion flag (done items are removed from the active stack)

### Import/export
- **Export JSON** shows the current stack as formatted JSON.
- **Import JSON** replaces the current stack after validation and confirmation.

### License
MIT
