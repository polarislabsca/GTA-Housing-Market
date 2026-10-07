"""Strip hidden text from TRREB Market Watch PDFs before extraction.

Reports from May 2022 to August 2026 draw a decoy copy of a neighbouring row on top of
each real row. The decoy is clipped to a different cell, so it never shows on the page,
but text extractors read both and mix their digits together. This module removes every
text object that lies entirely outside its clipping region (or is fully transparent) and
returns a cleaned PDF that pdfplumber can read as usual.
"""
import ctypes
import io

import pypdfium2 as pdfium
import pypdfium2.raw as raw


def _clip_bounds(obj):
    clip = raw.FPDFPageObj_GetClipPath(obj.raw)
    if not clip:
        return None
    xs, ys = [], []
    for path in range(raw.FPDFClipPath_CountPaths(clip)):
        for index in range(raw.FPDFClipPath_CountPathSegments(clip, path)):
            segment = raw.FPDFClipPath_GetPathSegment(clip, path, index)
            x, y = ctypes.c_float(), ctypes.c_float()
            raw.FPDFPathSegment_GetPoint(segment, ctypes.byref(x), ctypes.byref(y))
            xs.append(x.value)
            ys.append(y.value)
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def _is_hidden(obj):
    alpha = [ctypes.c_uint() for _ in range(4)]
    if raw.FPDFPageObj_GetFillColor(obj.raw, *(ctypes.byref(v) for v in alpha)) and alpha[3].value == 0:
        return True
    clip = _clip_bounds(obj)
    if clip is None:
        return False
    left, bottom, right, top = obj.get_bounds()
    overlap_x = min(right, clip[2]) - max(left, clip[0])
    overlap_y = min(top, clip[3]) - max(bottom, clip[1])
    return overlap_x <= 0.5 or overlap_y <= 0.5


def visible_pdf(path, pages=None):
    """Return (BytesIO of the cleaned PDF, number of hidden text objects removed)."""
    document = pdfium.PdfDocument(str(path))
    removed = 0
    for number in pages if pages is not None else range(len(document)):
        page = document[number]
        hidden = [obj for obj in page.get_objects() if obj.type == raw.FPDF_PAGEOBJ_TEXT and _is_hidden(obj)]
        for obj in hidden:
            page.remove_obj(obj)
        if hidden:
            page.gen_content()
        removed += len(hidden)
    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)
    return buffer, removed
