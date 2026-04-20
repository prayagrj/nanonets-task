# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend** (run from `frontend/`):
```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build to frontend/dist
npm run lint      # ESLint
npm run preview   # Preview production build
```

**Backend** (run from repo root):
```bash
python server.py          # Flask API on http://localhost:5000
python extract.py [file] [format]  # Standalone CLI extraction
```

**Full dev setup**: start `python server.py` and `npm run dev` concurrently. The React frontend proxies API calls to `http://localhost:5000`.

## Architecture

**Python Flask backend** (`server.py`):
- `POST /extract` — uploads a file, runs it through the local `docstrange.DocumentExtractor`, returns extracted content in one of: markdown, json, html, csv, text.
- `POST /extract-with-boxes` — uploads a file, authenticates via `docstrange.services.auth_service.get_authenticated_token()`, hits the Nanonets extraction API (`https://extraction-api.nanonets.com/api/v1/extract/sync`), and returns `{content, bounding_boxes}` with per-element metadata.

**React frontend** (`frontend/src/App.jsx`):
- Single-component architecture — all logic and styles live in `App.jsx` (styles as a top-level `styles` object, no external CSS).
- PDF rendering via `pdfjs-dist`; each page is drawn to a `<canvas>` element.
- A second overlay `<canvas>` renders bounding boxes returned from `/extract-with-boxes`, color-coded by element type (document_title, paragraph_title, text, table, figure, list_item).
- Features: drag-and-drop upload, page navigation, zoom (100–250%), element-type filter toggles, hover tooltips.

**Auth**: `DOCSTRANGE_API_KEY` must be set in `.env` (loaded via `export` — run `source .env` before starting the server, or set it in your shell).

## Key dependencies

| Package | Purpose |
|---|---|
| `docstrange` | Document extraction (Python) |
| `flask` + `flask_cors` | HTTP server |
| `pdfjs-dist` | PDF parsing & rendering in browser |
| `react@19` + `vite@8` | Frontend framework & bundler |
