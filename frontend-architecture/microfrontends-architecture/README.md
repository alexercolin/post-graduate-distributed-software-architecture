# Microfrontends Architecture

Didactic example using `single-spa` with:

- `root-config`
- `movies-mf`
- `my-list-mf`

## Ownership

- `root-config`: shell and route orchestration
- `movies-mf`: owns `/movies`
- `my-list-mf`: owns `/my-list`

## Ports

- `root-config`: `4100`
- `movies-mf`: `4101`
- `my-list-mf`: `4102`

## Run

```bash
cd frontend-architecture/microfrontends-architecture/root-config && npm install && npm run dev
cd frontend-architecture/microfrontends-architecture/movies-mf && npm install && npm run dev
cd frontend-architecture/microfrontends-architecture/my-list-mf && npm install && npm run dev
```

## Teaching Notes

This example intentionally avoids:

- shared global state between microfrontends
- mixed frameworks
- advanced federation tooling

The goal is to make route ownership and `single-spa` mount/unmount behavior easy to understand.
