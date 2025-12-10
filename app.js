const storageKey = 'todoStack';
const basePlaceholder = 'What do you want to do?';
const emptyPlaceholder = 'Quite empty here... Click to add your first todo 🫶';
let stack = loadStack();
let editingId = null;
let pendingCaret = null;

const mainView = document.getElementById('mainView');
const listView = document.getElementById('listView');
const doneView = document.getElementById('doneView');
const mainViewBtn = document.getElementById('mainViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const doneViewBtn = document.getElementById('doneViewBtn');
const topCard = document.getElementById('topCard');
const todoList = document.getElementById('todoList');
const emptyList = document.getElementById('emptyList');
const doneList = document.getElementById('doneList');
const emptyDone = document.getElementById('emptyDone');
const addButton = document.getElementById('addButton');
const menuButton = document.getElementById('menuButton');
const menuDropdown = document.getElementById('menuDropdown');
const modal = document.getElementById('modal');
const modalTextarea = document.getElementById('modalTextarea');
const modalTitle = document.getElementById('modalTitle');
const modalConfirm = document.getElementById('modalConfirm');

function loadStack() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(data)) return data;
  } catch (e) {
    console.error('Failed to parse stored stack', e);
  }
  return [];
}

function getActiveTodos() {
  return stack.filter((t) => !t.done);
}

function getDoneTodos() {
  return stack.filter((t) => t.done);
}

function getCaretOffsetFromClick(target, event) {
  const text = target.textContent || '';
  if (!text) return 0;

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
      return range.startOffset;
    }
  }

  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (position && position.offset !== undefined) {
      return position.offset;
    }
  }

  return text.length;
}

function focusInputWithCaret(input, id) {
  queueMicrotask(() => {
    input.focus();
    if (pendingCaret && pendingCaret.id === id) {
      const pos = Math.min(input.value.length, Math.max(0, pendingCaret.offset));
      input.setSelectionRange(pos, pos);
      pendingCaret = null;
    }
  });
}

function saveStack() {
  ensureTodoExists();
  localStorage.setItem(storageKey, JSON.stringify(stack));
  render();
}

function ensureTodoExists() {
  if (getActiveTodos().length) return;
  const todo = createTodo('');
  stack.unshift(todo);
  editingId = todo.id;
}

function createTodo(title = '') {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    createdAt: new Date().toISOString(),
    done: false,
    doneAt: null,
  };
}

function addTodo(openEdit = false) {
  const todo = createTodo('');
  stack.unshift(todo);
  editingId = openEdit ? todo.id : null;
  saveStack();
}

function deleteTodo(id) {
  const index = stack.findIndex((t) => t.id === id);
  if (index === -1) return;
  stack.splice(index, 1);
  if (editingId === id) {
    editingId = null;
    pendingCaret = null;
  }
  saveStack();
}

function setDoneState(id, done) {
  const item = stack.find((t) => t.id === id);
  if (item) {
    const wasDone = item.done;
    item.done = done;
    item.doneAt = done ? (item.doneAt && wasDone ? item.doneAt : new Date().toISOString()) : null;
    saveStack();
  }
}

function updateTitle(id, newTitle) {
  const item = stack.find((t) => t.id === id);
  if (item) {
    item.title = newTitle.trim();
    saveStack();
  }
}

function getPlaceholder(isEmptyState = false) {
  return isEmptyState ? emptyPlaceholder : basePlaceholder;
}

function isStackPlaceholderState() {
  const active = getActiveTodos();
  return active.length === 1 && !(active[0].title || '').trim();
}

function switchView(target) {
  const isMain = target === 'main';
  const isList = target === 'list';
  const isDone = target === 'done';
  mainView.classList.toggle('active', isMain);
  listView.classList.toggle('active', isList);
  doneView.classList.toggle('active', isDone);
  mainViewBtn.classList.toggle('active', isMain);
  listViewBtn.classList.toggle('active', isList);
  doneViewBtn.classList.toggle('active', isDone);
}

function renderMainView() {
  const top = getActiveTodos()[0];
  if (!top) {
    topCard.classList.add('placeholder');
    topCard.innerHTML = getPlaceholder(true);
    return;
  }
  topCard.classList.remove('placeholder');
  topCard.innerHTML = '';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.title = 'Mark as Done [d/Delete]';
  checkbox.className = 'checkbox';
  checkbox.checked = top.done;
  checkbox.addEventListener('change', () => setDoneState(top.id, checkbox.checked));

  const titleEl = document.createElement('div');
  titleEl.className = 'title';

  const isEditing = editingId === top.id;
  if (isEditing) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = top.title;
    input.placeholder = getPlaceholder(isStackPlaceholderState());
    input.addEventListener('blur', () => finishEdit(top.id, input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        input.blur();
      }
    });
    titleEl.appendChild(input);
    focusInputWithCaret(input, top.id);
  } else {
    const displayTitle = top.title.trim()
      ? top.title
      : getPlaceholder(isStackPlaceholderState());
    titleEl.textContent = displayTitle;
    titleEl.classList.toggle('placeholder-text', !top.title.trim());
    titleEl.addEventListener('click', (e) => {
      const offset = getCaretOffsetFromClick(titleEl, e);
      editingId = top.id;
      pendingCaret = { id: top.id, offset };
      render();
    });
  }

  topCard.appendChild(checkbox);
  topCard.appendChild(titleEl);
}

function renderListView() {
  todoList.innerHTML = '';
  const activeTodos = getActiveTodos();

  if (!activeTodos.length) {
    emptyList.style.display = 'block';
    return;
  }
  emptyList.style.display = 'none';

  activeTodos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.draggable = true;
    li.dataset.index = index;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => setDoneState(todo.id, checkbox.checked));

    const title = document.createElement('div');
    title.className = 'title';

    if (editingId === todo.id) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = todo.title;
      input.placeholder = getPlaceholder(isStackPlaceholderState());
      input.addEventListener('blur', () => finishEdit(todo.id, input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
      title.appendChild(input);
      focusInputWithCaret(input, todo.id);
    } else {
      const displayTitle = todo.title.trim()
        ? todo.title
        : getPlaceholder(isStackPlaceholderState());
      title.textContent = displayTitle;
      title.classList.toggle('placeholder-text', !todo.title.trim());
      title.addEventListener('click', (e) => {
        const offset = getCaretOffsetFromClick(title, e);
        editingId = todo.id;
        pendingCaret = { id: todo.id, offset };
        render();
      });
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-button delete-button';
    deleteBtn.title = 'Delete [Shift+Delete]';
    deleteBtn.textContent = '🗑';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(todo.id);
    });

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(deleteBtn);

    li.addEventListener('dragstart', (e) => {
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = Number(li.dataset.index);
      reorder(from, to);
    });

    todoList.appendChild(li);
  });
}

function renderDoneView() {
  doneList.innerHTML = '';
  const doneTodos = getSortedDoneTodos();

  const formatDoneAt = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (isToday) return time;
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}, ${time}`;
  };

  if (!doneTodos.length) {
    emptyDone.style.display = 'block';
    return;
  }
  emptyDone.style.display = 'none';

  doneTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => setDoneState(todo.id, checkbox.checked));

    const title = document.createElement('div');
    title.className = 'title';

    if (editingId === todo.id) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = todo.title;
      input.placeholder = getPlaceholder();
      input.addEventListener('blur', () => finishEdit(todo.id, input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
      title.appendChild(input);
      focusInputWithCaret(input, todo.id);
    } else {
      const displayTitle = todo.title.trim() ? todo.title : getPlaceholder(true);
      title.textContent = displayTitle;
      title.classList.toggle('placeholder-text', !todo.title.trim());
      title.addEventListener('click', (e) => {
        const offset = getCaretOffsetFromClick(title, e);
        editingId = todo.id;
        pendingCaret = { id: todo.id, offset };
        render();
      });
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-button delete-button';
    deleteBtn.title = 'Delete [Shift+Delete]';
    deleteBtn.textContent = '🗑';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(todo.id);
    });

    li.appendChild(checkbox);
    li.appendChild(title);

    const doneTime = document.createElement('div');
    doneTime.className = 'done-time';
    doneTime.textContent = formatDoneAt(todo.doneAt || todo.createdAt);
    li.appendChild(doneTime);
    li.appendChild(deleteBtn);
    doneList.appendChild(li);
  });
}

function reorder(from, to) {
  const active = getActiveTodos();
  const fromId = active[from]?.id;
  const toId = active[to]?.id;
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = stack.findIndex((t) => t.id === fromId);
  const toIndex = stack.findIndex((t) => t.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [item] = stack.splice(fromIndex, 1);
  stack.splice(toIndex, 0, item);
  saveStack();
}

function getSortedDoneTodos() {
  return getDoneTodos()
    .slice()
    .sort((a, b) => new Date(b.doneAt || b.createdAt) - new Date(a.doneAt || a.createdAt));
}

function finishEdit(id, value) {
  editingId = null;
  pendingCaret = null;
  updateTitle(id, value);
}

function handleMenu(action) {
  if (action === 'import') {
    modalTitle.textContent = 'Import JSON';
    modalTextarea.value = '';
    modalConfirm.onclick = () => {
      const text = modalTextarea.value.trim();
      try {
        const parsed = JSON.parse(text || '[]');
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
        const sanitized = parsed.map((item, i) => {
          if (!item || typeof item !== 'object') throw new Error(`Item ${i + 1} is invalid`);
          if (!item.id || !item.title || !item.createdAt) throw new Error(`Item ${i + 1} missing fields`);
          return {
            id: String(item.id),
            title: String(item.title),
            createdAt: item.createdAt,
            done: Boolean(item.done),
            doneAt: item.doneAt || null,
          };
        });
        if (confirm('Replace current stack with imported data?')) {
          stack = sanitized;
          saveStack();
          modal.close();
        }
      } catch (err) {
        alert(err.message || 'Invalid JSON');
      }
    };
    modal.showModal();
  }

  if (action === 'export') {
    modalTitle.textContent = 'Export JSON';
    modalTextarea.value = JSON.stringify(stack, null, 2);
    modalConfirm.onclick = () => modal.close();
    modal.showModal();
  }

  if (action === 'clear') {
    if (confirm('Clear the entire stack?')) {
      stack = [];
      saveStack();
    }
  }
}

function setupMenu() {
  menuButton.addEventListener('click', () => {
    const isOpen = menuDropdown.style.display === 'flex';
    menuDropdown.style.display = isOpen ? 'none' : 'flex';
    menuDropdown.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
  });

  menuDropdown.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      menuDropdown.style.display = 'none';
      menuDropdown.setAttribute('aria-hidden', 'true');
      handleMenu(e.target.dataset.action);
    }
  });

  document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuButton) {
      menuDropdown.style.display = 'none';
      menuDropdown.setAttribute('aria-hidden', 'true');
    }
  });
}

function setupNav() {
  mainViewBtn.addEventListener('click', () => switchView('main'));
  listViewBtn.addEventListener('click', () => switchView('list'));
  doneViewBtn.addEventListener('click', () => switchView('done'));
}

function render() {
  renderMainView();
  renderListView();
  renderDoneView();
}

function setupShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (editingId) return;
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'n' || e.key === 'Enter') {
      e.preventDefault();
      addTodo(true);
    }
    if (e.shiftKey && e.key === 'Delete') {
      e.preventDefault();
      const activeView = document.querySelector('.view.active');
      const viewId = activeView?.id;
      const targetTodo =
        viewId === 'doneView'
          ? getSortedDoneTodos()[0]
          : getActiveTodos()[0];
      if (targetTodo) {
        deleteTodo(targetTodo.id);
      }
    } else if (e.key.toLowerCase() === 'd' || e.key === 'Delete') {
      e.preventDefault();
      const top = getActiveTodos()[0];
      if (top) {
        setDoneState(top.id, true);
      }
    }
  });
}

addButton.addEventListener('click', () => addTodo(true));
setupMenu();
setupNav();
setupShortcuts();
const hadInitialTodos = stack.length > 0;
ensureTodoExists();

if (!hadInitialTodos) {
  saveStack();
} else {
  render();
}
