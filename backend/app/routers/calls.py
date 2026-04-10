import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, UPLOAD_DIR
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.call import Call, Replica
from app.models.user import User
from app.schemas.call import CallDetailOut, CallOut, CallsListResponse, ReplicaOut

router = APIRouter()


def _call_to_out(call: Call) -> CallOut:
    return CallOut(
        id=call.id,
        filename=call.filename,
        date=call.date.isoformat() + "Z" if call.date else "",
        duration=call.duration,
        topics=call.topics or [],
        status=call.status,
        operator=call.operator,
    )


def _call_to_detail(call: Call) -> CallDetailOut:
    replicas = [
        ReplicaOut(role=r.role, text=r.text, timestamp=r.timestamp)
        for r in call.replicas
    ]
    audio_file = _find_audio_file(call.id)
    audio_url = f"/api/calls/{call.id}/audio" if audio_file else None

    return CallDetailOut(
        id=call.id,
        filename=call.filename,
        date=call.date.isoformat() + "Z" if call.date else "",
        duration=call.duration,
        topics=call.topics or [],
        status=call.status,
        operator=call.operator,
        summary=call.summary,
        replica_count=len(replicas),
        replicas=replicas,
        audio_url=audio_url,
    )


def _find_audio_file(call_id: str) -> Path | None:
    for ext in ALLOWED_EXTENSIONS:
        path = UPLOAD_DIR / f"{call_id}{ext}"
        if path.exists():
            return path
    return None


@router.get("", response_model=CallsListResponse)
def list_calls(
    search: str | None = None,
    topic: str | None = None,
    date_from: str | None = Query(None, alias="dateFrom"),
    date_to: str | None = Query(None, alias="dateTo"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Call).filter(Call.user_id == current_user.id)

    if search:
        query = query.filter(Call.filename.ilike(f"%{search}%"))

    if date_from:
        query = query.filter(Call.date >= datetime.fromisoformat(date_from))

    if date_to:
        query = query.filter(Call.date <= datetime.fromisoformat(date_to + "T23:59:59"))

    if topic:
        # SQLite stores JSON with unicode escapes — filter in Python after loading
        all_filtered = [
            c for c in query.order_by(Call.date.desc()).all()
            if any(topic.lower() in t.lower() for t in (c.topics or []))
        ]
        total = len(all_filtered)
        calls = all_filtered[(page - 1) * limit : (page - 1) * limit + limit]
    else:
        total = query.count()
        calls = query.order_by(Call.date.desc()).offset((page - 1) * limit).limit(limit).all()

    return CallsListResponse(
        items=[_call_to_out(c) for c in calls],
        total=total,
    )


@router.get("/{call_id}", response_model=CallDetailOut)
def get_call(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id, Call.user_id == current_user.id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Звонок не найден")
    return _call_to_detail(call)


@router.delete("/{call_id}")
def delete_call(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id, Call.user_id == current_user.id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Звонок не найден")

    audio_file = _find_audio_file(call.id)
    if audio_file:
        os.remove(audio_file)

    db.delete(call)
    db.commit()
    return Response(status_code=204)


@router.post("/upload", response_model=CallOut, status_code=200)
async def upload_call(
    file: UploadFile = File(...),
    language: str = Form(...),
    operator: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Неподдерживаемый формат файла")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Файл превышает допустимый размер 200 МБ")

    call_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{call_id}{ext}"
    file_path.write_bytes(content)

    call = Call(
        id=call_id,
        filename=file.filename or "unknown",
        date=datetime.now(timezone.utc),
        status="processing",
        operator=operator or None,
        user_id=current_user.id,
    )
    db.add(call)
    db.commit()

    # ML processing
    try:
        from app.services.processing import process_call
        process_call(call_id=call_id, file_path=str(file_path), language=language, db=db)
    except Exception:
        call = db.query(Call).filter(Call.id == call_id).first()
        if call:
            call.status = "failed"
            db.commit()

    db.refresh(call)
    return _call_to_out(call)


@router.get("/{call_id}/audio")
def get_audio(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Звонок не найден")

    audio_file = _find_audio_file(call_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Аудиофайл не найден")

    media_types = {".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4"}
    media_type = media_types.get(audio_file.suffix, "application/octet-stream")

    return FileResponse(path=str(audio_file), media_type=media_type)
