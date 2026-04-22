# MVC — Minimal TypeScript Example

A tiny Task-list server that demonstrates the classic **Model / View / Controller** separation.

## The three layers

- **Model** (`src/models/task.model.ts`) — owns the data and the business rules. The "title must not be empty" rule lives here, not in the controller.
- **View** (`src/views/task.view.ts`) — a pure function that turns plain data into an HTML string. Knows nothing about HTTP, Express, or the model's internals.
- **Controller** (`src/controllers/task.controller.ts`) — orchestrates. Reads the request, calls the model, passes the model's data to the view, writes the view's output to the response. No HTML, no business rules.

`src/server.ts` is the composition root: it creates the model, injects it into the controller, and wires the Express routes.

## Request flow

```
  HTTP request
       │
       ▼
  ┌──────────────┐   calls    ┌──────────┐
  │  Controller  │ ─────────► │  Model   │   (data + rules)
  │  (task.*)    │ ◄───────── │          │
  └──────┬───────┘   data     └──────────┘
         │
         │ passes data
         ▼
  ┌──────────────┐
  │     View     │   returns HTML string
  └──────┬───────┘
         │
         ▼
  HTTP response
```

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/tasks>. Add a task via the form, or try submitting an empty title to see the model's validation rule fire with a `400` response.

Storage is an in-memory array — restarting the server clears the list. That is deliberate: the model is where domain data lives regardless of persistence backend, and a real MVC app would swap the in-memory store for a database without touching the view or controller.
