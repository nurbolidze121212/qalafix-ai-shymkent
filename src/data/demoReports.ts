import { type CityReport } from '../types/report'
import { generateId } from '../utils/storage'

export const initialReports: CityReport[] = [
  { id: 'QF-2026-0001', category: 'Дороги', title: 'Яма на проспекте Назарбаева', description: 'Большая яма около перекрёстка, образовалась после зимы.', severity: 'high', status: 'review', latitude: 42.3165, longitude: 69.6067, address: 'Шымкент, проспект Назарбаева', createdAt: '2026-08-14T09:12:00Z', confidence: 94 },
  { id: 'QF-2026-0002', category: 'Освещение', title: 'Не работает фонарь на Туране', description: 'Фонарь не включается уже неделю.', severity: 'medium', status: 'new', latitude: 42.3241, longitude: 69.5965, address: 'Шымкент, микрорайон Туран', createdAt: '2026-08-14T11:05:00Z', confidence: 95 },
  { id: 'QF-2026-0003', category: 'Мусор', title: 'Переполненный контейнер на Нурсате', description: 'Контейнер переполнен, мусор разносит ветром.', severity: 'medium', status: 'new', latitude: 42.3098, longitude: 69.6123, address: 'Шымкент, микрорайон Нурсат', createdAt: '2026-08-13T18:40:00Z', confidence: 93 },
  { id: 'QF-2026-0004', category: 'Водоснабжение', title: 'Утечка на Каратау', description: 'Из-под асфальта бьёт вода.', severity: 'high', status: 'in_progress', latitude: 42.3312, longitude: 69.5891, address: 'Шымкент, микрорайон Каратау', createdAt: '2026-08-13T08:20:00Z', confidence: 97 },
  { id: 'QF-2026-0005', category: 'Безопасность / ЖКХ', title: 'Открытый люк на Аль-Фараби', description: 'Люк открыт, ограждения нет.', severity: 'critical', status: 'in_progress', latitude: 42.3189, longitude: 69.6012, address: 'Шымкент, микрорайон Аль-Фараби', createdAt: '2026-08-12T20:15:00Z', confidence: 96 },
  { id: 'QF-2026-0006', category: 'Дороги', title: 'Разбитая дорога у школы 15', description: 'Дорога полностью разбита, дети ходят по проезжей части.', severity: 'high', status: 'new', latitude: 42.3223, longitude: 69.6145, address: 'Шымкент, улица Байтурсынова', createdAt: '2026-08-12T07:45:00Z', confidence: 94 },
  { id: 'QF-2026-0007', category: 'Освещение', title: 'Тёмный переулок', description: 'Переулок между домами 12 и 14 не освещается.', severity: 'medium', status: 'review', latitude: 42.3156, longitude: 69.6089, address: 'Шымкент, переулок Достык', createdAt: '2026-08-11T22:10:00Z', confidence: 95 },
  { id: 'QF-2026-0008', category: 'Благоустройство', title: 'Сломанная скамейка в парке', description: 'Скамейка сломана, может травмировать.', severity: 'low', status: 'resolved', latitude: 42.3198, longitude: 69.6034, address: 'Шымкент, парк имени Абая', createdAt: '2026-08-10T16:30:00Z', confidence: 88 },
  { id: 'QF-2026-0009', category: 'Мусор', title: 'Свалка за гаражным кооперативом', description: 'Несанкционированная свалка строительного мусора.', severity: 'high', status: 'review', latitude: 42.3056, longitude: 69.6178, address: 'Шымкент, гаражный кооператив «Строитель»', createdAt: '2026-08-10T14:20:00Z', confidence: 91 },
  { id: 'QF-2026-0010', category: 'Транспорт', title: 'Остановка без навеса', description: 'Автобусная остановка не имеет навеса от солнца и дождя.', severity: 'low', status: 'new', latitude: 42.3278, longitude: 69.5923, address: 'Шымкент, остановка «Технопарк»', createdAt: '2026-08-09T08:55:00Z', confidence: 89 },
  { id: 'QF-2026-0011', category: 'Дороги', title: 'Столб на проезжей части', description: 'Опасный столб стоит на проезжей части без разметки.', severity: 'critical', status: 'new', latitude: 42.3112, longitude: 69.6056, address: 'Шымкент, улица Жибек Жолы', createdAt: '2026-08-09T06:40:00Z', confidence: 92 },
  { id: 'QF-2026-0012', category: 'Освещение', title: 'Мигающий фонарь', description: 'Фонарь работает нестабильно, мерцает.', severity: 'low', status: 'resolved', latitude: 42.3234, longitude: 69.5987, address: 'Шымкент, улица Тауекель', createdAt: '2026-08-08T21:05:00Z', confidence: 90 },
  { id: 'QF-2026-0013', category: 'Водоснабжение', title: 'Нет воды в доме 25', description: 'Отключение воды без предупреждения.', severity: 'high', status: 'in_progress', latitude: 42.3178, longitude: 69.6102, address: 'Шымкент, микрорайон Нурсат, дом 25', createdAt: '2026-08-08T09:30:00Z', confidence: 95 },
  { id: 'QF-2026-0014', category: 'Безопасность / ЖКХ', title: 'Острые края люка', description: 'Люк имеет острые края, опасен для детей.', severity: 'high', status: 'review', latitude: 42.3145, longitude: 69.6134, address: 'Шымкент, улица Манас', createdAt: '2026-08-07T17:15:00Z', confidence: 93 },
  { id: 'QF-2026-0015', category: 'Благоустройство', title: 'Разбитый бордюр', description: 'Бордюр разрушен около входа в подъезд.', severity: 'low', status: 'new', latitude: 42.3267, longitude: 69.6012, address: 'Шымкент, микрорайон Каратау', createdAt: '2026-08-07T12:45:00Z', confidence: 87 },
  { id: 'QF-2026-0016', category: 'Дороги', title: 'Размыв дороги после дождя', description: 'Дорога размыта, образовалась колея.', severity: 'medium', status: 'new', latitude: 42.3089, longitude: 69.6078, address: 'Шымкент, улица Желтоксан', createdAt: '2026-08-06T19:20:00Z', confidence: 90 },
  { id: 'QF-2026-0017', category: 'Мусор', title: 'Мусор вокруг бака', description: 'Вокруг бака много мусора, вонь.', severity: 'medium', status: 'resolved', latitude: 42.3201, longitude: 69.5998, address: 'Шымкент, микрорайон Туран', createdAt: '2026-08-06T10:05:00Z', confidence: 92 },
  { id: 'QF-2026-0018', category: 'Транспорт', title: 'Разбитая остановка', description: 'Остановка сломана, нет информации.', severity: 'low', status: 'review', latitude: 42.3123, longitude: 69.6045, address: 'Шымкент, остановка «Базар»', createdAt: '2026-08-05T15:30:00Z', confidence: 88 },
  { id: 'QF-2026-0019', category: 'Освещение', title: 'Нет света на пешеходном переходе', description: 'Переход не освещается, опасно переходить.', severity: 'high', status: 'new', latitude: 42.3256, longitude: 69.5934, address: 'Шымкент, пешеходный переход на проспекте Республики', createdAt: '2026-08-05T07:15:00Z', confidence: 94 },
  { id: 'QF-2026-0020', category: 'Водоснабжение', title: 'Грязная вода из крана', description: 'Вода имеет ржавый цвет и запах.', severity: 'high', status: 'in_progress', latitude: 42.3167, longitude: 69.6019, address: 'Шымкент, микрорайон Аль-Фараби', createdAt: '2026-08-04T11:50:00Z', confidence: 96 },
]

export function createDemoReport(overrides?: Partial<CityReport>): CityReport {
  const id = generateId()
  return {
    id,
    category: 'Безопасность / ЖКХ',
    title: 'Открытый люк',
    description: 'На пешеходной территории обнаружен открытый люк. Объект представляет опасность для жителей и требует оперативной проверки городской службой.',
    severity: 'high',
    status: 'new',
    latitude: 42.315,
    longitude: 69.605,
    address: 'Шымкент, микрорайон Нурсат',
    createdAt: new Date().toISOString(),
    confidence: 96,
    ...overrides,
  }
}
