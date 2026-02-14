(function () {
  'use strict';

  var STORAGE_KEY_TASKS = 'duewise:v1:tasks';
  var STORAGE_KEY_THEME = 'duewise:v1:theme';
  var debugList = null;
  var fallbackNode = null;

  var state = {
    tasks: [],
    editingId: null,
    theme: 'light'
  };

  var refs = {};

  function appendDebug(message) {
    try {
      if (!debugList) debugList = document.getElementById('debug-list');
      if (!debugList) return;
      if (debugList.children.length === 1 && debugList.children[0].textContent === 'No runtime errors.') {
        debugList.innerHTML = '';
      }
      var li = document.createElement('li');
      li.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
      debugList.appendChild(li);
    } catch (_error) {
      // ignore recursive debug errors
    }
  }

  function showFallback() {
    if (!fallbackNode) fallbackNode = document.getElementById('load-fallback');
    if (fallbackNode) fallbackNode.classList.remove('hidden');
  }

  window.addEventListener('error', function (event) {
    appendDebug((event.message || 'Unknown error') + ' @ ' + (event.filename || 'inline') + ':' + (event.lineno || 0));
    showFallback();
  });

  window.addEventListener('unhandledrejection', function (event) {
    appendDebug('Unhandled promise rejection: ' + String((event && event.reason) || 'unknown'));
    showFallback();
  });

  function createId() {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  }

  function safeParseArray(raw) {
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (_error) {
      appendDebug('Could not parse stored tasks; reset to empty list.');
      return [];
    }
  }

  function sanitizeTask(task) {
    if (!task || typeof task !== 'object') return null;
    if (!task.title || !task.dueDate) return null;

    var due = new Date(task.dueDate);
    if (isNaN(due.getTime())) return null;
    var iso = due.toISOString();
    var minutes = Math.max(5, Number(task.estimatedMinutes) || 5);
    var importanceRaw = task.importance === undefined || task.importance === null || task.importance === '' ? undefined : Number(task.importance);
    var importance = [1, 2, 3].indexOf(importanceRaw) >= 0 ? importanceRaw : undefined;

    return {
      id: String(task.id || createId()),
      title: String(task.title).trim() || 'Untitled task',
      dueDate: iso,
      estimatedMinutes: minutes,
      importance: importance,
      completed: Boolean(task.completed)
    };
  }

  function loadTasks() {
    var parsed = safeParseArray(localStorage.getItem(STORAGE_KEY_TASKS));
    var cleaned = parsed.map(sanitizeTask).filter(function (task) {
      return task !== null;
    });
    return cleaned;
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(state.tasks));
  }

  function loadTheme() {
    var saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved === 'dark' ? 'dark' : 'light';
  }

  function saveTheme() {
    localStorage.setItem(STORAGE_KEY_THEME, state.theme);
  }

  function setTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('dark', state.theme === 'dark');
    if (refs.themeToggle) refs.themeToggle.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    saveTheme();
  }

  function formatCountdown(timeLeftMinutes) {
    if (timeLeftMinutes <= 0) {
      var late = Math.abs(timeLeftMinutes);
      if (late < 60) return late + 'm overdue';
      return Math.floor(late / 60) + 'h ' + (late % 60) + 'm overdue';
    }

    var days = Math.floor(timeLeftMinutes / 1440);
    var hours = Math.floor((timeLeftMinutes % 1440) / 60);
    var minutes = timeLeftMinutes % 60;

    if (days > 0) return days + 'd ' + hours + 'h left';
    if (hours > 0) return hours + 'h ' + minutes + 'm left';
    return minutes + 'm left';
  }

  function urgencyLevel(bufferMinutes) {
    if (bufferMinutes < 0) return 'critical';
    if (bufferMinutes <= 240) return 'urgent';
    if (bufferMinutes <= 1440) return 'soon';
    return 'safe';
  }

  function urgencyRank(level) {
    var map = { critical: 4, urgent: 3, soon: 2, safe: 1 };
    return map[level] || 0;
  }

  function calculateTaskView(task) {
    var now = Date.now();
    var due = new Date(task.dueDate).getTime();
    var timeLeftMinutes = Math.round((due - now) / 60000);
    var buffer = timeLeftMinutes - task.estimatedMinutes;
    var level = urgencyLevel(buffer);

    return {
      task: task,
      timeLeftMinutes: timeLeftMinutes,
      buffer: buffer,
      level: level
    };
  }

  function getSortedTaskViews() {
    return state.tasks
      .map(calculateTaskView)
      .sort(function (a, b) {
        if (a.task.completed !== b.task.completed) return Number(a.task.completed) - Number(b.task.completed);
        if (a.level !== b.level) return urgencyRank(b.level) - urgencyRank(a.level);
        return a.timeLeftMinutes - b.timeLeftMinutes;
      });
  }

  function makeBadge(level) {
    var text = {
      critical: 'Critical',
      urgent: 'Urgent',
      soon: 'Soon',
      safe: 'Safe'
    }[level] || 'Safe';

    var span = document.createElement('span');
    span.className = 'urgency-pill ' + level;
    span.textContent = text;
    return span;
  }

  function createTaskCard(view) {
    var card = document.createElement('article');
    card.className = 'task-card ' + view.level;

    var top = document.createElement('div');
    top.className = 'card-top';

    var title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = view.task.title;

    top.appendChild(title);
    top.appendChild(makeBadge(view.level));

    var meta = document.createElement('p');
    meta.className = 'task-meta';

    var importanceText = view.task.importance ? ' · P' + view.task.importance : '';
    meta.textContent =
      formatCountdown(view.timeLeftMinutes) +
      ' · ' +
      view.task.estimatedMinutes +
      ' min needed' +
      importanceText +
      ' · Due ' +
      new Date(view.task.dueDate).toLocaleString();

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var completeBtn = document.createElement('button');
    completeBtn.className = 'secondary';
    completeBtn.type = 'button';
    completeBtn.textContent = view.task.completed ? 'Mark Incomplete' : 'Complete';
    completeBtn.addEventListener('click', function () {
      toggleComplete(view.task.id);
    });

    var editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function () {
      openModalForEdit(view.task.id);
    });

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function () {
      deleteTask(view.task.id);
    });

    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(top);
    card.appendChild(meta);
    card.appendChild(actions);

    return card;
  }

  function createEmptyState() {
    var empty = document.createElement('div');
    empty.className = 'empty-state';

    var title = document.createElement('h3');
    title.textContent = 'Your day is clear';

    var text = document.createElement('p');
    text.textContent = 'Add your first task to get a smart "Work on Next" recommendation.';

    var actions = document.createElement('div');
    actions.className = 'cta-row';

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Add Task';
    addBtn.addEventListener('click', openModalForAdd);

    var sampleBtn = document.createElement('button');
    sampleBtn.type = 'button';
    sampleBtn.className = 'secondary';
    sampleBtn.textContent = 'Add Sample Task';
    sampleBtn.addEventListener('click', addSampleTask);

    actions.appendChild(addBtn);
    actions.appendChild(sampleBtn);

    empty.appendChild(title);
    empty.appendChild(text);
    empty.appendChild(actions);
    return empty;
  }

  function render() {
    var taskViews = getSortedTaskViews();
    refs.listContainer.innerHTML = '';
    refs.nextContainer.innerHTML = '';

    var next = taskViews.find(function (view) {
      return !view.task.completed;
    });

    if (next) {
      refs.nextContainer.appendChild(createTaskCard(next));
    } else {
      refs.nextContainer.appendChild(createEmptyState());
    }

    if (taskViews.length === 0) {
      refs.listContainer.appendChild(createEmptyState());
      return;
    }

    for (var i = 0; i < taskViews.length; i += 1) {
      refs.listContainer.appendChild(createTaskCard(taskViews[i]));
    }
  }

  function updateDueDefault() {
    var d = new Date();
    d.setHours(d.getHours() + 3);
    var local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    refs.formDue.value = local;
  }

  function openModalForAdd() {
    state.editingId = null;
    refs.modalTitle.textContent = 'Add Task';
    refs.form.reset();
    refs.formId.value = '';
    refs.formMinutes.value = '30';
    updateDueDefault();
    refs.deleteTaskBtn.classList.add('hidden');
    showModal(true);
  }

  function openModalForEdit(taskId) {
    var task = state.tasks.find(function (item) {
      return item.id === taskId;
    });
    if (!task) return;

    state.editingId = task.id;
    refs.modalTitle.textContent = 'Edit Task';
    refs.formId.value = task.id;
    refs.formTitle.value = task.title;
    refs.formMinutes.value = String(task.estimatedMinutes);
    refs.formImportance.value = task.importance ? String(task.importance) : '';

    var local = new Date(new Date(task.dueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    refs.formDue.value = local;

    refs.deleteTaskBtn.classList.remove('hidden');
    showModal(true);
  }

  function showModal(open) {
    refs.modal.classList.toggle('hidden', !open);
    refs.modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function addOrUpdateTaskFromForm(event) {
    event.preventDefault();

    var title = refs.formTitle.value.trim();
    if (!title) return;

    var due = new Date(refs.formDue.value);
    if (isNaN(due.getTime())) return;

    var taskData = {
      id: refs.formId.value || createId(),
      title: title,
      dueDate: due.toISOString(),
      estimatedMinutes: Math.max(5, Number(refs.formMinutes.value) || 5),
      importance: refs.formImportance.value ? Number(refs.formImportance.value) : undefined,
      completed: false
    };

    if (state.editingId) {
      state.tasks = state.tasks.map(function (item) {
        return item.id === state.editingId ? Object.assign({}, item, taskData, { completed: item.completed }) : item;
      });
    } else {
      state.tasks.unshift(taskData);
    }

    saveTasks();
    showModal(false);
    render();
  }

  function deleteTask(taskId) {
    state.tasks = state.tasks.filter(function (task) {
      return task.id !== taskId;
    });
    saveTasks();
    showModal(false);
    render();
  }

  function toggleComplete(taskId) {
    state.tasks = state.tasks.map(function (task) {
      return task.id === taskId ? Object.assign({}, task, { completed: !task.completed }) : task;
    });
    saveTasks();
    render();
  }

  function addSampleTask() {
    var due = new Date(Date.now() + 2 * 60 * 60000).toISOString();
    state.tasks.unshift({
      id: createId(),
      title: 'Sample: Ship sprint summary',
      dueDate: due,
      estimatedMinutes: 35,
      importance: 2,
      completed: false
    });
    saveTasks();
    render();
  }

  function bindDom() {
    refs.listContainer = document.getElementById('task-list-container');
    refs.nextContainer = document.getElementById('next-task-container');
    refs.addTaskBtn = document.getElementById('add-task-btn');
    refs.themeToggle = document.getElementById('theme-toggle');

    refs.modal = document.getElementById('task-modal');
    refs.modalBackdrop = document.getElementById('modal-backdrop');
    refs.modalTitle = document.getElementById('modal-title');
    refs.closeModalBtn = document.getElementById('close-modal-btn');

    refs.form = document.getElementById('task-form');
    refs.formId = document.getElementById('task-id');
    refs.formTitle = document.getElementById('task-title');
    refs.formDue = document.getElementById('task-due-date');
    refs.formMinutes = document.getElementById('task-minutes');
    refs.formImportance = document.getElementById('task-importance');
    refs.deleteTaskBtn = document.getElementById('delete-task-btn');

    var required = [
      refs.listContainer,
      refs.nextContainer,
      refs.addTaskBtn,
      refs.themeToggle,
      refs.modal,
      refs.form,
      refs.formTitle,
      refs.formDue,
      refs.formMinutes
    ];

    var hasMissing = required.some(function (node) {
      return !node;
    });

    if (hasMissing) {
      appendDebug('Critical HTML containers missing.');
      showFallback();
      return false;
    }

    refs.addTaskBtn.addEventListener('click', openModalForAdd);
    refs.themeToggle.addEventListener('click', function () {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
    refs.closeModalBtn.addEventListener('click', function () {
      showModal(false);
    });
    refs.modalBackdrop.addEventListener('click', function () {
      showModal(false);
    });
    refs.form.addEventListener('submit', addOrUpdateTaskFromForm);
    refs.deleteTaskBtn.addEventListener('click', function () {
      if (state.editingId) deleteTask(state.editingId);
    });

    return true;
  }

  function init() {
    try {
      if (!bindDom()) return;

      state.tasks = loadTasks();
      state.theme = loadTheme();
      setTheme(state.theme);

      render();
    } catch (error) {
      appendDebug('Bootstrap failed: ' + (error && error.message ? error.message : String(error)));
      showFallback();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
