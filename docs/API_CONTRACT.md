# API Contract — Платформа анализа звонков

> Документ описывает контракт между frontend и backend.
> Frontend готов к подключению — все запросы идут через `axios` на `/api/*`.
> Переменная окружения: `VITE_API_URL` (по умолчанию `/api`).

---

## Оглавление

1. [Форматы данных](#форматы-данных)
2. [Аутентификация](#аутентификация)
3. [Звонки — REST](#звонки--rest)
4. [Загрузка файла](#загрузка-файла)
5. [Kafka — топики и события](#kafka--топики-и-события)
6. [Коды ошибок](#коды-ошибок)

---

## Форматы данных

### Типы полей

| Поле | Тип | Пример |
|------|-----|--------|
| `date` | ISO 8601 string | `"2025-01-15T10:30:00Z"` |
| `duration` | integer (секунды) | `272` |
| `timestamp` | integer (секунды от начала) | `47` |
| `status` | enum | `"done"`, `"processing"`, `"queued"` |
| `role` | enum | `"operator"`, `"client"` |
| `language` | ISO 639-1 | `"ru"`, `"en"` |

### Call (объект звонка)

```json
{
  "id":       "uuid-v4",
  "filename": "zvonok_2025_01_15.mp3",
  "date":     "2025-01-15T10:30:00Z",
  "duration": 272,
  "topics":   ["Возврат товара", "Компенсация"],
  "status":   "done",
  "operator": "Иванов"
}
```

### CallDetail (карточка звонка)

```json
{
  "id":           "uuid-v4",
  "filename":     "zvonok_2025_01_15.mp3",
  "date":         "2025-01-15T10:30:00Z",
  "duration":     272,
  "topics":       ["Возврат товара", "Компенсация"],
  "status":       "done",
  "operator":     "Иванов",
  "summary":      "Клиент обратился по поводу возврата бракованного товара...",
  "replicaCount": 42,
  "audioUrl":     "https://storage.example.com/audio/uuid.mp3",
  "replicas": [
    { "role": "operator", "text": "Здравствуйте, чем могу помочь?", "timestamp": 3 },
    { "role": "client",   "text": "Хочу вернуть товар.",             "timestamp": 8 }
  ]
}
```

> **audioUrl** — presigned URL или путь к аудио. Frontend передаёт его напрямую в `<audio src="">`.
> Если URL отсутствует (null/undefined) — плеер отображается в задизейбленном состоянии.

---

## Аутентификация

Все защищённые ручки требуют заголовок:
```
Authorization: Bearer <token>
```

### POST `/auth/login`

**Request:**
```json
{ "username": "ivanov", "password": "secret123" }
```

**Response 200:**
```json
{
  "token": "eyJhbGci...",
  "user":  { "id": "uuid", "name": "Иванов" }
}
```

**Response 401:**
```json
{ "message": "Неверный логин или пароль" }
```

---

### POST `/auth/register`

**Request:**
```json
{ "username": "ivanov", "password": "secret123" }
```

**Response 201:**
```json
{
  "token": "eyJhbGci...",
  "user":  { "id": "uuid", "name": "ivanov" }
}
```

**Response 409:**
```json
{ "message": "Пользователь с таким логином уже существует" }
```

---

## Звонки — REST

### GET `/calls`

Список звонков с фильтрацией.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Поиск по имени файла (contains, case-insensitive) |
| `topic` | string | Фильтр по теме (contains) |
| `dateFrom` | string | Дата от, ISO date `"2025-01-01"` |
| `dateTo` | string | Дата до, ISO date `"2025-01-31"` |
| `page` | integer | Страница (default: 1) |
| `limit` | integer | Размер страницы (default: 20) |

**Response 200:**
```json
{
  "items": [ /* Call[] */ ],
  "total": 42
}
```

---

### GET `/calls/:id`

Полная карточка звонка.

**Response 200:** `CallDetail`

**Response 404:**
```json
{ "message": "Звонок не найден" }
```

---

### DELETE `/calls/:id`

Удалить звонок и связанные файлы.

**Response 204:** (no body)

---

## Загрузка файла

### POST `/calls/upload`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | ✅ | Аудиофайл (MP3, WAV, M4A, до 200 МБ) |
| `language` | string | ✅ | ISO 639-1: `"ru"` или `"en"` |
| `operator` | string | ❌ | Имя оператора |

**Response 202 (Accepted):**
```json
{
  "id":       "uuid-v4",
  "filename": "zvonok.mp3",
  "date":     "2025-01-15T10:30:00Z",
  "duration": 0,
  "topics":   [],
  "status":   "queued",
  "operator": "Иванов"
}
```

> Backend сохраняет файл, создаёт запись в БД со статусом `queued`,
> затем публикует событие в Kafka и возвращает 202.

**Response 413:**
```json
{ "message": "Файл превышает допустимый размер 200 МБ" }
```

**Response 415:**
```json
{ "message": "Неподдерживаемый формат файла" }
```

---

## Kafka — топики и события

### Архитектура потока

```
Frontend
  → POST /calls/upload (REST)
      → Backend сохраняет файл в S3/хранилище
      → Создаёт запись Call{status: queued}
      → Публикует в Kafka ──► calls.processing.requested

ML-сервис (consumer)
  ← calls.processing.requested
      → Обновляет статус: processing
      → Публикует ──────────────► calls.status.updated
      → Транскрибирует аудио
      → Анализирует транскрипцию
      → Публикует ──────────────► calls.processing.completed

Backend (consumer)
  ← calls.processing.completed
      → Сохраняет результаты в БД
      → Обновляет статус: done
      → Публикует ──────────────► calls.status.updated

Frontend
  → Polling: GET /calls (каждые 5 сек, пока есть queued/processing)
```

---

### Topic: `calls.processing.requested`

Публикуется backend после загрузки файла. Инициирует обработку.

**Key:** `call_id`

**Value:**
```json
{
  "event":     "call.processing.requested",
  "call_id":   "uuid-v4",
  "file_path": "s3://bucket/audio/uuid.mp3",
  "language":  "ru",
  "operator":  "Иванов",
  "created_at":"2025-01-15T10:30:00Z"
}
```

---

### Topic: `calls.status.updated`

Публикуется при каждом изменении статуса звонка.

**Key:** `call_id`

**Value:**
```json
{
  "event":      "call.status.updated",
  "call_id":    "uuid-v4",
  "status":     "processing",
  "updated_at": "2025-01-15T10:31:00Z"
}
```

Возможные значения `status`: `queued` → `processing` → `done` | `failed`

---

### Topic: `calls.processing.completed`

Публикуется ML-сервисом после завершения анализа.

**Key:** `call_id`

**Value:**
```json
{
  "event":    "call.processing.completed",
  "call_id":  "uuid-v4",
  "summary":  "Клиент обратился с вопросом о возврате...",
  "topics":   ["Возврат товара", "Компенсация"],
  "duration": 272,
  "replicas": [
    {
      "role":      "operator",
      "text":      "Здравствуйте, чем могу помочь?",
      "timestamp": 3
    },
    {
      "role":      "client",
      "text":      "Хочу вернуть товар.",
      "timestamp": 8
    }
  ],
  "audio_url":    "https://storage.example.com/audio/uuid.mp3",
  "completed_at": "2025-01-15T10:35:00Z"
}
```

---

### Topic: `calls.processing.failed`

Публикуется ML-сервисом при ошибке обработки.

**Key:** `call_id`

**Value:**
```json
{
  "event":    "call.processing.failed",
  "call_id":  "uuid-v4",
  "reason":   "Не удалось распознать речь: неподдерживаемый кодек",
  "failed_at":"2025-01-15T10:33:00Z"
}
```

> При получении этого события backend должен обновить статус звонка на `failed`
> (нужно добавить в `CallStatus` на frontend после согласования).

---

## Коды ошибок

Все ошибки возвращаются в формате:
```json
{ "message": "Описание ошибки" }
```

| HTTP код | Значение |
|----------|----------|
| 400 | Невалидный запрос (неверные параметры) |
| 401 | Не аутентифицирован |
| 403 | Нет доступа к ресурсу |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, логин занят) |
| 413 | Файл слишком большой |
| 415 | Неподдерживаемый формат |
| 500 | Внутренняя ошибка сервера |

---

## Что нужно согласовать

- [ ] Статус `failed` — добавить на frontend после подтверждения
- [ ] Пагинация в `GET /calls` — scroll или page-based?
- [ ] `audioUrl` — presigned S3 или внутренний прокси-эндпоинт?
- [ ] Срок жизни JWT токена и логика refresh
- [ ] CORS origins для prod-окружения
