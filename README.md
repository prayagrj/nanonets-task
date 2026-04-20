# DocExtract

A PDF document extraction and visualization tool. Upload a PDF, extract its elements via the Nanonets API, and view annotated bounding boxes overlaid on each page.

## How it works

### Backend (`server.py`)

A Flask API with a single endpoint:

**`POST /extract-with-boxes`**

1. Accepts a PDF file upload.
2. Forwards the file to the Nanonets extraction API (`https://extraction-api.nanonets.com/api/v1/extract/sync`) with `output_format=markdown` and `include_metadata=bounding_boxes`.
3. Parses the response to extract the markdown content and per-element bounding box metadata (type, position, confidence).
4. Renders each PDF page to a PNG image via `pdf2image` at 150 DPI and base64-encodes them.
5. Returns `{ content, bounding_boxes, pages }` to the frontend.

Authentication uses `docstrange`'s `get_authenticated_token()`, falling back to the `DOCSTRANGE_API_KEY` environment variable.

### Frontend (`frontend/src/App.jsx`)

A single-component React app with three screens:

- **Upload screen** — drag-and-drop or file picker for PDFs.
- **Confirm screen** — shows file name/size; triggers extraction on button click.
- **Viewer** — displays the extracted document with interactive bounding box overlays.

**Viewer logic:**

- Pages are rendered as `<img>` elements from the base64 PNGs returned by the backend.
- Bounding boxes are positioned as absolutely-placed `<div>` elements on top of each page image, using the normalized `(x, y, width, height)` coordinates from the API (values 0–1, mapped to `%`-based CSS).
- Element types are color-coded. The following types have predefined colors: Document Title, Paragraph Title, Section Title, Text, Caption, Footnote, Header, Footer, Table, Table Cell, Figure, Image, List Item, Formula, Code, Page Number. Any other type returned by the API is displayed using its exact field name converted to Title Case (e.g. `my_type` → "My Type") and rendered in a default indigo color.
- The left panel provides page navigation, zoom control (75%–200%), element-type filter toggles (each showing a count of boxes for that type), a total box count in the Elements heading, a confidence score toggle, and a detail card for the currently hovered element.

## Setup

### Prerequisites

- Python 3.9+, `pip`
- Node.js 18+, `npm`
- `poppler` (required by `pdf2image` for PDF rendering)

```bash
# macOS
brew install poppler
```

### Install

```bash
# Backend
pip install flask flask-cors requests pdf2image docstrange

# Frontend
cd frontend && npm install
```

### Configure auth

Create a `.env` file in the repo root:

```
DOCSTRANGE_API_KEY=your_api_key_here
```

Then load it before starting the server:

```bash
source .env
```

### Run

```bash
# Terminal 1 — backend
python server.py

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

## Project structure

```
.
├── server.py              # Flask backend
├── frontend/
│   └── src/
│       └── App.jsx        # React frontend (single component)
└── .env                   # API key (not committed)
```
