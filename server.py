import os
import base64
import tempfile
import requests
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from docstrange.services.auth_service import get_authenticated_token

app = Flask(__name__)
CORS(app)

EXTRACTION_API_URL = "https://extraction-api.nanonets.com/api/v1/extract/sync"


def get_auth_token():
    try:
        return get_authenticated_token(force_reauth=False)
    except Exception:
        return os.environ.get("DOCSTRANGE_API_KEY", "")


def render_pdf_pages(file_path, dpi=150):
    from pdf2image import convert_from_path
    images = convert_from_path(file_path, dpi=dpi)
    pages = []
    for img in images:
        buf = BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        pages.append({"image": b64, "width": img.width, "height": img.height})
    return pages


@app.route("/extract-with-boxes", methods=["POST"])
def extract_with_boxes():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    filename = file.filename or "document.pdf"

    if not filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            resp = requests.post(
                EXTRACTION_API_URL,
                headers={"Authorization": f"Bearer {get_auth_token()}"},
                files={"file": (filename, f, "application/pdf")},
                data={"output_format": "markdown", "include_metadata": "bounding_boxes"},
                timeout=120,
            )

        resp.raise_for_status()
        api_data = resp.json()

        markdown_result = api_data.get("result", {}).get("markdown", {})
        content = markdown_result.get("content", "")
        elements = (
            markdown_result.get("metadata", {})
            .get("bounding_boxes", {})
            .get("elements", [])
        )

        pages = render_pdf_pages(tmp_path, dpi=150)

        return jsonify({"content": content, "bounding_boxes": elements, "pages": pages}), 200

    except requests.HTTPError as e:
        return jsonify({"error": f"API error: {e.response.status_code} {e.response.text}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
