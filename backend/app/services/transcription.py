import whisper

from app.config import WHISPER_MODEL

_model = None


def _get_model():
    global _model
    if _model is None:
        print(f"Loading Whisper model '{WHISPER_MODEL}' (cpu)...")
        _model = whisper.load_model(WHISPER_MODEL, device="cpu")
    return _model


def transcribe(file_path: str, language: str) -> dict:
    """
    Transcribe audio file using Whisper.

    Returns:
        {
            "duration": int (seconds),
            "replicas": [{"role": "operator"|"client", "text": str, "timestamp": int}, ...]
        }
    """
    model = _get_model()
    result = model.transcribe(file_path, language=language)

    duration = int(result.get("segments", [{}])[-1].get("end", 0)) if result.get("segments") else 0

    replicas = []
    for i, segment in enumerate(result.get("segments", [])):
        text = segment.get("text", "").strip()
        if not text:
            continue
        replicas.append({
            "role": "operator" if i % 2 == 0 else "client",
            "text": text,
            "timestamp": int(segment.get("start", 0)),
        })

    return {"duration": duration, "replicas": replicas}
