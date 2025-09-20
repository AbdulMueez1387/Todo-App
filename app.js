// app.js - To-Do with localStorage + drag & drop
(() => {
  const STORAGE_KEY = 'todo.tasks.v1';

  // DOM
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty');
  const clearBtn = document.getElementById('clear-btn');

  // State
  let tasks = loadTasks();

  // Helpers
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse tasks', e);
      return [];
    }
  }

  // Render
  function renderTasks() {
    list.innerHTML = '';
    if (tasks.length === 0) {
      empty.style.display = 'block';
      return;
    } else {
      empty.style.display = 'none';
    }

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.draggable = true;
      li.dataset.id = task.id;

      li.innerHTML = `
        <label class="checkbox" title="Mark complete">
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete" />
        </label>
        <div class="task-text ${task.completed ? 'completed' : ''}" contenteditable="false" tabindex="0">${escapeHtml(task.text)}</div>
        <div class="controls">
          <button class="btn-icon edit" title="Edit (double-click to edit)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21v-3l11-11 3 3L6 21H3z"></path></svg></button>
          <button class="btn-icon delete" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"></path><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg></button>
          <span class="drag-handle" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
        </div>
      `;

      // Events
      const checkbox = li.querySelector('input[type="checkbox"]');
      const deleteBtn = li.querySelector('.delete');
      const editBtn = li.querySelector('.edit');
      const textDiv = li.querySelector('.task-text');

      checkbox.addEventListener('change', () => {
        toggleComplete(task.id, checkbox.checked);
      });

      deleteBtn.addEventListener('click', () => {
        deleteTask(task.id);
      });

      // Double click to edit
      textDiv.addEventListener('dblclick', () => {
        enableEdit(textDiv, task.id);
      });

      // Allow pressing Enter while editing to save
      textDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          disableEdit(textDiv, task.id);
          li.querySelector('input[type="checkbox"]').focus();
        } else if (e.key === 'Escape') {
          // Cancel edit by re-rendering (discard changes)
          renderTasks();
        }
      });

      // Drag events
      li.addEventListener('dragstart', (e) => {
        li.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });

      list.appendChild(li);
    });

    // attach dragover to list (once)
    attachListDragHandlers();
  }

  function escapeHtml(text){
    return text
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  // Task operations
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tasks.unshift({ id: uid(), text: trimmed, completed: false });
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function toggleComplete(id, isCompleted) {
    const it = tasks.find(t => t.id === id);
    if (!it) return;
    it.completed = !!isCompleted;
    saveTasks();
    renderTasks();
  }

  function enableEdit(textDiv, id) {
    textDiv.contentEditable = 'true';
    textDiv.classList.remove('completed');
    textDiv.focus();
    // Move caret to end
    document.execCommand('selectAll', false, null);
    document.getSelection().collapseToEnd();
  }

  function disableEdit(textDiv, id) {
    textDiv.contentEditable = 'false';
    const newText = textDiv.textContent.trim();
    if (!newText) {
      // if emptied, remove task
      deleteTask(id);
      return;
    }
    const t = tasks.find(x => x.id === id);
    if (t) t.text = newText;
    saveTasks();
    renderTasks();
  }

  // Drag & drop helpers
  function attachListDragHandlers(){
    // prevent adding multiple listeners
    if (list._dragHandlersAttached) return;
    list._dragHandlersAttached = true;

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterEl = getDragAfterElement(list, e.clientY);
      const dragging = list.querySelector('.dragging');
      if (!dragging) return;
      if (afterEl == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterEl);
      }
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      // After drop, rebuild tasks order from DOM
      const ids = Array.from(list.children).map(li => li.dataset.id);
      tasks = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
      saveTasks();
      renderTasks();
    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
  }

  // UI wiring
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  // Add with Enter while input focused (native submit handles this), but ensure button works
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all tasks?')) return;
    tasks = [];
    saveTasks();
    renderTasks();
  });

  // Keyboard accessibility: pressing 'n' focuses the input
  document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      input.focus();
    }
  });

  // Initial render
  renderTasks();

  // Expose for debugging (optional)
  window._todo = {
    get tasks(){ return tasks; },
    save: saveTasks,
    load: () => { tasks = loadTasks(); renderTasks(); }
  };
})();
