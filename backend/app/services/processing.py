from sqlalchemy.orm import Session

from app.models.call import Call, Replica
from app.services.analysis import analyze
from app.services.transcription import transcribe


def process_call(call_id: str, file_path: str, language: str, db: Session) -> None:
    """Run transcription + analysis pipeline and save results to DB."""
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        return

    call.status = "processing"
    db.commit()

    # Step 1: Whisper transcription
    result = transcribe(file_path, language)

    # Step 2: Save replicas
    for r in result["replicas"]:
        replica = Replica(
            call_id=call_id,
            role=r["role"],
            text=r["text"],
            timestamp=r["timestamp"],
        )
        db.add(replica)

    call.duration = result["duration"]

    # Step 3: DeepSeek analysis
    transcript_text = "\n".join(
        f"{'Оператор' if r['role'] == 'operator' else 'Клиент'}: {r['text']}"
        for r in result["replicas"]
    )

    if transcript_text.strip():
        analysis = analyze(transcript_text)
        call.topics = analysis["topics"]
        call.summary = analysis["summary"]

    call.status = "done"
    db.commit()
