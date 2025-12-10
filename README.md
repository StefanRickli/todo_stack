# Todo Stack

## Live Web App
[👉 Open the hosted Todo Stack](https://stefanrickli.github.io/todo_stack/)

A minimal browser-only todo stack app built with plain HTML, CSS, and JavaScript. All todos live in `localStorage`, and the most recent item always sits on top of the stack.

### How it works
- **Three views:** the Main view shows only the top todo, the List view shows the full stack with drag-and-drop reordering, and the Done view keeps a history of completed items.
- **Local-first:** all data is stored in your browser; reloading the page or closing the tab will keep your stack intact.
- **Menus for power users:** import/export JSON and clear the stack from the hamburger menu.

### Controls & shortcuts
- **Add a todo:** click the floating `+` button or press `Enter`/`N` when not editing.
- **Edit text:** click a title to inline-edit it; empty stacks auto-create a blank item for you.
- **Mark done:** click the checkbox on the active todo or press `Delete/D` to send the top item to Done.
- **Remove:** press `Shift+Delete` to delete the top item in the active view (Done view deletes the latest completed item).
- **Reorder:** drag list items in the List view to rearrange the stack.
- **Navigation:** use the tabs to switch between Main, List, and Done views.

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
