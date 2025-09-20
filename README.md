# To-Do List — Simple Static App (HTML / CSS / JavaScript)

A clean, responsive, single-page To-Do list app that stores tasks in `localStorage` and supports drag-and-drop reordering, inline editing, and keyboard shortcuts. Ready to run locally or deploy to Vercel.

---

## Features

* Add / delete tasks
* Mark tasks complete / incomplete
* Persist tasks (text, order, completed state) in `localStorage`
* Drag & drop to reorder tasks (HTML5 Drag & Drop)
* Double-click to edit a task (press `Enter` to save, `Esc` to cancel)
* Keyboard shortcut: press `n` to focus the input
* No build step — plain static files

---

## File structure

```
todo-app/
├─ index.html
├─ styles.css
└─ app.js
```

---

## Quick start (local)

1. Clone or copy the files into a folder, e.g. `todo-app`.
2. Open `index.html` directly in your browser (double-click).

   > Note: opening the file directly usually works, but some browsers restrict `file://` scripts. Recommended: run a tiny local server.

### Recommended: run with Python HTTP server

```bash
cd todo-app
python -m http.server 5500
# then open http://localhost:5500
```

### Or use Node (http-server / live-server)

```bash
cd todo-app
npx http-server -p 5500
# or
npx live-server --port=5500
# then open http://localhost:5500
```

---

