const storageKey = 'todoStack';
let stack = loadStack();
let editingId = null;

const mainView = document.getElementById('mainView');
const listView = document.getElementById('listView');
const mainViewBtn = document.getElementById('mainViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const topCard = document.getElementById('topCard');
const todoList = document.getElementById('todoList');
const emptyList = document.getElementById('emptyList');
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

function saveStack() {
  localStorage.setItem(storageKey, JSON.stringify(stack));
  render();
}

function createTodo(title = '') {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    createdAt: new Date().toISOString(),
    done: false,
  };
}

function addTodo(openEdit = false) {
  const todo = createTodo('New todo');
  stack.unshift(todo);
  editingId = openEdit ? todo.id : null;
  saveStack();
}

function markDone(id) {
  const index = stack.findIndex((t) => t.id === id);
  if (index >= 0) {
    stack[index].done = true;
    stack.splice(index, 1);
    saveStack();
  }
}

function updateTitle(id, newTitle) {
  const item = stack.find((t) => t.id === id);
  if (item) {
    item.title = newTitle.trim() || 'Untitled';
    saveStack();
  }
}

function switchView(target) {
  const isMain = target === 'main';
  mainView.classList.toggle('active', isMain);
  listView.classList.toggle('active', !isMain);
  mainViewBtn.classList.toggle('active', isMain);
  listViewBtn.classList.toggle('active', !isMain);
}

function renderMainView() {
  const top = stack[0];
  if (!top) {
    topCard.classList.add('placeholder');
    topCard.innerHTML = 'No todos yet. Add one!';
    return;
  }
  topCard.classList.remove('placeholder');
  topCard.innerHTML = '';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.addEventListener('change', () => markDone(top.id));

  const titleEl = document.createElement('div');
  titleEl.className = 'title';

  const isEditing = editingId === top.id;
  if (isEditing) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = top.title;
    input.addEventListener('blur', () => finishEdit(top.id, input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });
    titleEl.appendChild(input);
    queueMicrotask(() => input.focus());
  } else {
    titleEl.textContent = top.title;
    titleEl.addEventListener('click', () => {
      editingId = top.id;
      render();
    });
  }

  topCard.appendChild(checkbox);
  topCard.appendChild(titleEl);
}

function renderListView() {
  todoList.innerHTML = '';

  if (!stack.length) {
    emptyList.style.display = 'block';
    return;
  }
  emptyList.style.display = 'none';

  stack.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.draggable = true;
    li.dataset.index = index;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.addEventListener('change', () => markDone(todo.id));

    const title = document.createElement('div');
    title.className = 'title';

    if (editingId === todo.id) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = todo.title;
      input.addEventListener('blur', () => finishEdit(todo.id, input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
      title.appendChild(input);
      queueMicrotask(() => input.focus());
    } else {
      title.textContent = todo.title;
      title.addEventListener('click', () => {
        editingId = todo.id;
        render();
      });
    }

    li.appendChild(checkbox);
    li.appendChild(title);

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

function reorder(from, to) {
  if (from === to || Number.isNaN(from) || Number.isNaN(to)) return;
  const [item] = stack.splice(from, 1);
  stack.splice(to, 0, item);
  saveStack();
}

function finishEdit(id, value) {
  editingId = null;
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
          };
        });
        if (confirm('Replace current stack with imported data?')) {
          stack = sanitized.filter((t) => !t.done);
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
}

function render() {
  renderMainView();
  renderListView();
}

addButton.addEventListener('click', () => addTodo(true));
setupMenu();
setupNav();
render();
