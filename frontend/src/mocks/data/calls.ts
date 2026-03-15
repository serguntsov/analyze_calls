import type { Call, CallDetail } from '../../types';

export const mockCalls: Call[] = [
  {
    id: '1',
    filename: 'zvonok_2025_01_15.mp3',
    date: '2025-01-15T10:30:00Z',
    duration: 272,
    topics: ['Возврат'],
    status: 'done',
    operator: 'Иванов',
  },
  {
    id: '2',
    filename: 'call_operator_petrov.mp3',
    date: '2025-01-14T14:12:00Z',
    duration: 434,
    topics: ['Жалоба'],
    status: 'processing',
    operator: 'Петров',
  },
  {
    id: '3',
    filename: 'record_130124.mp3',
    date: '2025-01-13T09:05:00Z',
    duration: 178,
    topics: ['Консультация'],
    status: 'queued',
    operator: 'Сидорова',
  },
  {
    id: '4',
    filename: 'support_call_2025.mp3',
    date: '2025-01-12T16:44:00Z',
    duration: 345,
    topics: ['Техподдержка'],
    status: 'done',
    operator: 'Козлов',
  },
  {
    id: '5',
    filename: 'incoming_001.mp3',
    date: '2025-01-11T11:20:00Z',
    duration: 200,
    topics: ['Консультация', 'Возврат'],
    status: 'done',
    operator: 'Иванов',
  },
];

const makeDetail = (base: Call, summary: string, replicas: CallDetail['replicas']): CallDetail => ({
  ...base,
  summary,
  replicaCount: replicas.length,
  replicas,
  audioUrl: undefined,
});

export const mockCallDetails: Record<string, CallDetail> = {
  '1': makeDetail(
    mockCalls[0],
    'Клиент обратился по поводу возврата бракованного товара. Оператор предложил компенсацию и оформил заявку на возврат. Клиент остался доволен решением.',
    [
      { role: 'operator', text: 'Здравствуйте, меня зовут Алексей, чем могу помочь?', timestamp: 3 },
      { role: 'client',   text: 'Добрый день, хочу вернуть товар, он оказался бракованным.', timestamp: 7 },
      { role: 'operator', text: 'Понял вас, давайте я оформлю заявку на возврат прямо сейчас.', timestamp: 14 },
      { role: 'client',   text: 'Хорошо, что нужно для этого сделать?', timestamp: 22 },
      { role: 'operator', text: 'Назовите, пожалуйста, номер заказа и опишите дефект.', timestamp: 28 },
      { role: 'client',   text: 'Заказ номер 48291, у товара сломана застёжка с завода.', timestamp: 35 },
      { role: 'operator', text: 'Принял, оформляю возврат. Деньги вернутся в течение 3–5 дней.', timestamp: 44 },
      { role: 'client',   text: 'Отлично, спасибо за быстрое решение!', timestamp: 52 },
    ],
  ),
  '2': makeDetail(
    mockCalls[1],
    'Клиент пожаловался на долгое ожидание доставки. Оператор уточнил статус заказа, принёс извинения и предложил приоритетную доставку.',
    [
      { role: 'client',   text: 'Почему мой заказ так долго не доставляют?', timestamp: 4 },
      { role: 'operator', text: 'Прошу прощения за неудобство, сейчас уточню статус.', timestamp: 10 },
      { role: 'operator', text: 'Ваш заказ задержался на сортировочном центре, ожидается завтра.', timestamp: 22 },
      { role: 'client',   text: 'Это недопустимо! Мне нужно было сегодня.', timestamp: 28 },
      { role: 'operator', text: 'Понимаю вас, оформлю компенсацию и приоритетную доставку.', timestamp: 36 },
    ],
  ),
  '3': makeDetail(
    mockCalls[2],
    'Клиент задал вопросы по тарифам и условиям обслуживания. Оператор предоставил исчерпывающую информацию.',
    [
      { role: 'client',   text: 'Расскажите, какие у вас тарифы?', timestamp: 3 },
      { role: 'operator', text: 'Конечно, у нас три пакета: базовый, стандартный и премиум.', timestamp: 8 },
      { role: 'client',   text: 'Чем отличается стандартный от премиума?', timestamp: 16 },
      { role: 'operator', text: 'В премиуме доступна приоритетная поддержка и расширенная гарантия.', timestamp: 22 },
    ],
  ),
  '4': makeDetail(
    mockCalls[3],
    'Клиент обратился с проблемой подключения к сервису. Оператор провёл диагностику и помог настроить соединение.',
    [
      { role: 'client',   text: 'Не могу подключиться к личному кабинету, пишет ошибку.', timestamp: 5 },
      { role: 'operator', text: 'Какую именно ошибку видите?', timestamp: 10 },
      { role: 'client',   text: 'Ошибка 403 — доступ запрещён.', timestamp: 15 },
      { role: 'operator', text: 'Скорее всего истёк токен. Попробуйте выйти и войти заново.', timestamp: 21 },
      { role: 'client',   text: 'Помогло, спасибо!', timestamp: 40 },
    ],
  ),
  '5': makeDetail(
    mockCalls[4],
    'Клиент проконсультировался по условиям возврата и уточнил сроки. Вопросы решены в ходе разговора.',
    [
      { role: 'client',   text: 'Хочу узнать условия возврата товара.', timestamp: 2 },
      { role: 'operator', text: 'Возврат возможен в течение 14 дней с момента получения.', timestamp: 7 },
      { role: 'client',   text: 'А если товар был в использовании?', timestamp: 13 },
      { role: 'operator', text: 'В таком случае рассматривается индивидуально, зависит от дефекта.', timestamp: 18 },
    ],
  ),
};
