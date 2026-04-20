# DocExtract MVP

A lightweight, purely frontend PDF document extraction and visualization tool. Upload a PDF, extract its elements locally via the `docstrange-api` TypeScript SDK, and view annotated bounding boxes overlaid on each page.

## How it works

The entire extraction process executes securely and directly from the frontend React environment. There is **no backend server** required. We avoid cross-origin restriction issues through our Vite proxy configuration.

Features:
- **Client-Side Extraction** — Calls Nanonets extraction API directly from `App.jsx` using `docstrange-api`.
- **In-Browser Rendering** — Uses `pdfjs-dist` to parse PDFs locally directly on user's device.
- **Interactive UI** — Zoom, hover tooltips, element type color coding, file navigation.

## Setup

### Prerequisites

- Node.js 18+ and `npm`

### Environment Configuration

In the repository root, create a `.env` file containing your API token:
```
DOCSTRANGE_API_KEY=your_api_key_here
```
*(The Vite configuration will automatically inject this to the frontend SDK as `import.meta.env.VITE_DOCSTRANGE_API_KEY`!)*

### Install & Run

Simply jump into the `frontend/` directory, install packages, and boot up your Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. 

## Project structure

```
.
├── frontend/
│   ├── vite.config.js     # Configures Nanonets proxy and environment variables
│   └── src/
│       └── App.jsx        # Main React component + SDK logic
└── .env                   # Secret API key (not committed)
```
