# MVVM — Minimal TypeScript Example

A tiny Task-list server that demonstrates the **Model / View / ViewModel** separation. Same domain as the sibling `MVC/` folder, same Express setup — the only thing that changes is where each piece of logic lives.

## The three layers

- **Model** (`src/models/task.model.ts`) — owns the data and the business rules. Unchanged from MVC: validation ("title must not be empty") still lives here.
- **ViewModel** (`src/viewmodels/task.viewmodel.ts`) — holds **display-ready state** the view can bind to (`items`, `isEmpty`, `errorMessage`) and exposes **Commands** (`addTask`) the outside world invokes. It knows about the Model, but nothing about HTTP or HTML.
- **View** (`src/views/task.view.ts`) — a pure function of the ViewModel. It never touches the Model directly; it reads the ViewModel's bindable properties and produces an HTML string.

`src/server.ts` is the composition root: it creates the shared Model, and for each request builds a fresh ViewModel, invokes any Command, then hands the ViewModel to the View.

## Data flow

```
  HTTP request
       │
       ▼
  ┌──────────────┐   calls        ┌────────────┐
  │   handler    │ ─────────────► │ ViewModel  │
  │  (server.ts) │                │            │
  └──────────────┘                │  Commands  │──► Model (data + rules)
                                  │            │
                                  │  Bindable  │
                                  │   state    │◄── Model data
                                  └─────┬──────┘
                                        │ passed to
                                        ▼
                                  ┌──────────────┐
                                  │     View     │ reads vm.items,
                                  │              │ vm.isEmpty,
                                  │              │ vm.errorMessage
                                  └──────┬───────┘
                                         │
                                         ▼
                                   HTTP response
```

## MVVM vs MVC — what actually moved

| Concern                            | MVC                               | MVVM                                                    |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------- |
| "Is the list empty?" check         | inline branch in the View         | `vm.isEmpty` getter on the ViewModel                    |
| Formatting `#1 — Buy milk`         | inline string in the View         | `vm.items[i].label`, pre-computed by the ViewModel      |
| Validation error → error page      | Controller catches, picks a view  | ViewModel stores `errorMessage`, View renders a banner  |
| What the View depends on           | `Task[]` (raw model data)         | `TaskListViewModel` (a single binding target)           |
| Where the Controller went          | —                                 | Split: a thin route handler + a stateful ViewModel      |

Same Model, leaner View, and a new object in the middle that owns every decision about "how should this be shown."

## Honest limitation

True MVVM relies on **two-way data binding** between View and ViewModel — in a desktop or mobile app the View subscribes to ViewModel changes and re-renders automatically. HTTP is request/response, so here we simulate one-way binding by rebuilding the ViewModel on every request. The pattern's intent — pulling presentation state and commands out of the Controller and into a dedicated object — still comes through clearly.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/tasks>. Add a task via the form, or submit an empty title to see the ViewModel's `errorMessage` drive the inline error banner with a `400` response.

Storage is an in-memory array — restarting the server clears the list. As in MVC, the Model is where domain data lives regardless of persistence backend; swapping the in-memory store for a database would touch neither the View nor the ViewModel.
