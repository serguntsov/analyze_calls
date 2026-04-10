"""Seed script: creates a demo user and 5 test calls with replicas."""

from datetime import datetime, timezone

from app.database import init_db, SessionLocal
from app.models.call import Call, Replica
from app.models.user import User
from app.utils.security import hash_password


DEMO_USER = {"username": "demo", "password": "demo123"}

CALLS = [
    {
        "id": "1",
        "filename": "zvonok_2025_01_15.mp3",
        "date": datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc),
        "duration": 272,
        "topics": ["Возврат"],
        "status": "done",
        "operator": "Иванов",
        "summary": "Клиент обратился по поводу возврата бракованного товара. Оператор предложил компенсацию и оформил заявку на возврат. Клиент остался доволен решением.",
        "replicas": [
            {"role": "operator", "text": "Здравствуйте, меня зовут Алексей, чем могу помочь?", "timestamp": 3},
            {"role": "client", "text": "Добрый день, хочу вернуть товар, он оказался бракованным.", "timestamp": 7},
            {"role": "operator", "text": "Понял вас, давайте я оформлю заявку на возврат прямо сейчас.", "timestamp": 14},
            {"role": "client", "text": "Хорошо, что нужно для этого сделать?", "timestamp": 22},
            {"role": "operator", "text": "Назовите, пожалуйста, номер заказа и опишите дефект.", "timestamp": 28},
            {"role": "client", "text": "Заказ номер 48291, у товара сломана застёжка с завода.", "timestamp": 35},
            {"role": "operator", "text": "Принял, оформляю возврат. Деньги вернутся в течение 3–5 дней.", "timestamp": 44},
            {"role": "client", "text": "Отлично, спасибо за быстрое решение!", "timestamp": 52},
        ],
    },
    {
        "id": "2",
        "filename": "call_operator_petrov.mp3",
        "date": datetime(2025, 1, 14, 14, 12, tzinfo=timezone.utc),
        "duration": 434,
        "topics": ["Жалоба"],
        "status": "done",
        "operator": "Петров",
        "summary": "Клиент пожаловался на долгое ожидание доставки. Оператор уточнил статус заказа, принёс извинения и предложил приоритетную доставку.",
        "replicas": [
            {"role": "client", "text": "Почему мой заказ так долго не доставляют?", "timestamp": 4},
            {"role": "operator", "text": "Прошу прощения за неудобство, сейчас уточню статус.", "timestamp": 10},
            {"role": "operator", "text": "Ваш заказ задержался на сортировочном центре, ожидается завтра.", "timestamp": 22},
            {"role": "client", "text": "Это недопустимо! Мне нужно было сегодня.", "timestamp": 28},
            {"role": "operator", "text": "Понимаю вас, оформлю компенсацию и приоритетную доставку.", "timestamp": 36},
        ],
    },
    {
        "id": "3",
        "filename": "record_130124.mp3",
        "date": datetime(2025, 1, 13, 9, 5, tzinfo=timezone.utc),
        "duration": 178,
        "topics": ["Консультация"],
        "status": "done",
        "operator": "Сидорова",
        "summary": "Клиент задал вопросы по тарифам и условиям обслуживания. Оператор предоставил исчерпывающую информацию.",
        "replicas": [
            {"role": "client", "text": "Расскажите, какие у вас тарифы?", "timestamp": 3},
            {"role": "operator", "text": "Конечно, у нас три пакета: базовый, стандартный и премиум.", "timestamp": 8},
            {"role": "client", "text": "Чем отличается стандартный от премиума?", "timestamp": 16},
            {"role": "operator", "text": "В премиуме доступна приоритетная поддержка и расширенная гарантия.", "timestamp": 22},
        ],
    },
    {
        "id": "4",
        "filename": "support_call_2025.mp3",
        "date": datetime(2025, 1, 12, 16, 44, tzinfo=timezone.utc),
        "duration": 345,
        "topics": ["Техподдержка"],
        "status": "done",
        "operator": "Козлов",
        "summary": "Клиент обратился с проблемой подключения к сервису. Оператор провёл диагностику и помог настроить соединение.",
        "replicas": [
            {"role": "client", "text": "Не могу подключиться к личному кабинету, пишет ошибку.", "timestamp": 5},
            {"role": "operator", "text": "Какую именно ошибку видите?", "timestamp": 10},
            {"role": "client", "text": "Ошибка 403 — доступ запрещён.", "timestamp": 15},
            {"role": "operator", "text": "Скорее всего истёк токен. Попробуйте выйти и войти заново.", "timestamp": 21},
            {"role": "client", "text": "Помогло, спасибо!", "timestamp": 40},
        ],
    },
    {
        "id": "5",
        "filename": "incoming_001.mp3",
        "date": datetime(2025, 1, 11, 11, 20, tzinfo=timezone.utc),
        "duration": 200,
        "topics": ["Консультация", "Возврат"],
        "status": "done",
        "operator": "Иванов",
        "summary": "Клиент проконсультировался по условиям возврата и уточнил сроки. Вопросы решены в ходе разговора.",
        "replicas": [
            {"role": "client", "text": "Хочу узнать условия возврата товара.", "timestamp": 2},
            {"role": "operator", "text": "Возврат возможен в течение 14 дней с момента получения.", "timestamp": 7},
            {"role": "client", "text": "А если товар был в использовании?", "timestamp": 13},
            {"role": "operator", "text": "В таком случае рассматривается индивидуально, зависит от дефекта.", "timestamp": 18},
        ],
    },
]


def seed():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    existing = db.query(User).filter(User.username == DEMO_USER["username"]).first()
    if existing:
        print("Database already seeded. Skipping.")
        db.close()
        return

    # Create demo user
    user = User(
        username=DEMO_USER["username"],
        password_hash=hash_password(DEMO_USER["password"]),
    )
    db.add(user)
    db.flush()

    # Create calls
    for call_data in CALLS:
        replicas_data = call_data.pop("replicas")
        call = Call(**call_data, user_id=user.id)
        db.add(call)
        db.flush()

        for r in replicas_data:
            db.add(Replica(call_id=call.id, **r))

    db.commit()
    db.close()
    print(f"Seeded: user '{DEMO_USER['username']}' with password '{DEMO_USER['password']}' and {len(CALLS)} calls.")


if __name__ == "__main__":
    seed()
