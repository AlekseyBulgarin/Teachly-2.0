const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

type LocalizedText = {
  title: string;
  statement: string;
  options: Array<{ id: string; label: string }>;
  explanation: string;
};

export type DemoLearningTask = {
  taskId: string;
  versionId: string;
  skillId: string;
  track: 'python' | 'algorithms' | 'web';
  code?: string;
  correctOptionId: string;
  ru: LocalizedText;
  en: LocalizedText;
};

export const demoLearningIds = {
  trainerStudent: id(420),
  trainerExternalUser: id(421),
  skills: { python: id(300), algorithms: id(301), web: id(302) },
} as const;

export const demoLearningTasks: DemoLearningTask[] = [
  {
    taskId: id(310), versionId: id(330), skillId: id(300), track: 'python', code: 'x = 5\nprint(x)', correctOptionId: 'b',
    ru: { title: 'Переменная и вывод', statement: 'Что выведет программа?', options: [{ id: 'a', label: 'x' }, { id: 'b', label: '5' }, { id: 'c', label: 'Ничего' }], explanation: 'Переменная x хранит число 5, а print выводит сохранённое значение.' },
    en: { title: 'Variable and output', statement: 'What does the program print?', options: [{ id: 'a', label: 'x' }, { id: 'b', label: '5' }, { id: 'c', label: 'Nothing' }], explanation: 'The variable x stores the number 5, and print outputs the stored value.' },
  },
  {
    taskId: id(311), versionId: id(331), skillId: id(300), track: 'python', code: 'numbers = [10, 20, 30]\nprint(numbers[1])', correctOptionId: 'b',
    ru: { title: 'Индекс списка', statement: 'Какое значение появится в консоли?', options: [{ id: 'a', label: '10' }, { id: 'b', label: '20' }, { id: 'c', label: '30' }], explanation: 'Индексация списка начинается с нуля, поэтому индекс 1 указывает на второй элемент.' },
    en: { title: 'List index', statement: 'Which value appears in the console?', options: [{ id: 'a', label: '10' }, { id: 'b', label: '20' }, { id: 'c', label: '30' }], explanation: 'List indexing starts at zero, so index 1 points to the second item.' },
  },
  {
    taskId: id(312), versionId: id(332), skillId: id(300), track: 'python', code: 'for i in range(3):\n    print(i)', correctOptionId: 'a',
    ru: { title: 'Цикл range', statement: 'Какую последовательность напечатает цикл?', options: [{ id: 'a', label: '0, 1, 2' }, { id: 'b', label: '1, 2, 3' }, { id: 'c', label: '0, 1, 2, 3' }], explanation: 'range(3) создаёт значения от 0 включительно до 3 не включительно.' },
    en: { title: 'A range loop', statement: 'Which sequence does the loop print?', options: [{ id: 'a', label: '0, 1, 2' }, { id: 'b', label: '1, 2, 3' }, { id: 'c', label: '0, 1, 2, 3' }], explanation: 'range(3) yields values from 0 inclusive to 3 exclusive.' },
  },
  {
    taskId: id(313), versionId: id(333), skillId: id(300), track: 'python', code: 'def double(n):\n    return n * 2\n\nprint(double(4))', correctOptionId: 'c',
    ru: { title: 'Возврат из функции', statement: 'Что вернёт вызов double(4)?', options: [{ id: 'a', label: '4' }, { id: 'b', label: '6' }, { id: 'c', label: '8' }], explanation: 'Функция умножает переданный аргумент на два и возвращает результат.' },
    en: { title: 'Function return value', statement: 'What does double(4) return?', options: [{ id: 'a', label: '4' }, { id: 'b', label: '6' }, { id: 'c', label: '8' }], explanation: 'The function multiplies its argument by two and returns the result.' },
  },
  {
    taskId: id(314), versionId: id(334), skillId: id(300), track: 'python', code: 'x = "5"\nprint(x + 1)', correctOptionId: 'c',
    ru: { title: 'Отладка типов', statement: 'Почему программа завершится с ошибкой?', options: [{ id: 'a', label: 'print нельзя использовать с числами' }, { id: 'b', label: 'Переменная x не объявлена' }, { id: 'c', label: 'Строку нельзя сложить с целым числом' }], explanation: 'x — строка. Перед сложением её нужно преобразовать в int или число — в строку.' },
    en: { title: 'Debugging types', statement: 'Why does the program fail?', options: [{ id: 'a', label: 'print cannot be used with numbers' }, { id: 'b', label: 'x is not declared' }, { id: 'c', label: 'A string cannot be added to an integer' }], explanation: 'x is a string. Convert it to int, or convert the number to a string, before combining them.' },
  },
  {
    taskId: id(315), versionId: id(335), skillId: id(301), track: 'algorithms', correctOptionId: 'a',
    ru: { title: 'Поиск максимума', statement: 'Какой способ находит максимум в неотсортированном списке за один проход?', options: [{ id: 'a', label: 'Хранить текущий максимум и сравнивать каждый элемент' }, { id: 'b', label: 'Всегда брать первый элемент' }, { id: 'c', label: 'Сравнить только первый и последний элементы' }], explanation: 'Один последовательный проход со сравнением каждого элемента даёт линейную сложность O(n).' },
    en: { title: 'Finding a maximum', statement: 'Which method finds the maximum in an unsorted list in one pass?', options: [{ id: 'a', label: 'Keep the current maximum and compare every item' }, { id: 'b', label: 'Always take the first item' }, { id: 'c', label: 'Compare only the first and last items' }], explanation: 'A sequential pass that compares every item has linear O(n) complexity.' },
  },
  {
    taskId: id(316), versionId: id(336), skillId: id(301), track: 'algorithms', correctOptionId: 'b',
    ru: { title: 'Условие бинарного поиска', statement: 'Какое условие необходимо для обычного бинарного поиска?', options: [{ id: 'a', label: 'Все элементы должны быть уникальными' }, { id: 'b', label: 'Коллекция должна быть отсортирована' }, { id: 'c', label: 'Размер должен быть степенью двойки' }], explanation: 'Бинарный поиск отбрасывает половину диапазона, опираясь на порядок элементов.' },
    en: { title: 'Binary search prerequisite', statement: 'What does ordinary binary search require?', options: [{ id: 'a', label: 'Every item must be unique' }, { id: 'b', label: 'The collection must be sorted' }, { id: 'c', label: 'The size must be a power of two' }], explanation: 'Binary search discards half of the range by relying on item order.' },
  },
  {
    taskId: id(317), versionId: id(337), skillId: id(301), track: 'algorithms', code: 'isAdult = age >= 18\nhasAccess = isAdult and paid', correctOptionId: 'c',
    ru: { title: 'Логическое И', statement: 'Когда hasAccess станет true?', options: [{ id: 'a', label: 'Если выполнено хотя бы одно условие' }, { id: 'b', label: 'Только если age меньше 18' }, { id: 'c', label: 'Если пользователь совершеннолетний и оплатил доступ' }], explanation: 'Оператор and возвращает true только когда истинны оба условия.' },
    en: { title: 'Boolean AND', statement: 'When does hasAccess become true?', options: [{ id: 'a', label: 'When either condition is true' }, { id: 'b', label: 'Only when age is below 18' }, { id: 'c', label: 'When the user is an adult and has paid' }], explanation: 'The and operator is true only when both conditions are true.' },
  },
  {
    taskId: id(318), versionId: id(338), skillId: id(301), track: 'algorithms', code: 'for i in range(len(items) + 1):\n    print(items[i])', correctOptionId: 'a',
    ru: { title: 'Ошибка на единицу', statement: 'Как исправить выход за границы списка?', options: [{ id: 'a', label: 'Убрать + 1 из range' }, { id: 'b', label: 'Заменить print на return' }, { id: 'c', label: 'Добавить ещё один элемент после цикла' }], explanation: 'Последний допустимый индекс равен len(items) - 1; range(len(items)) уже создаёт нужные индексы.' },
    en: { title: 'Off-by-one error', statement: 'How should the out-of-range access be fixed?', options: [{ id: 'a', label: 'Remove + 1 from range' }, { id: 'b', label: 'Replace print with return' }, { id: 'c', label: 'Add one more item after the loop' }], explanation: 'The final valid index is len(items) - 1; range(len(items)) already yields the correct indices.' },
  },
  {
    taskId: id(319), versionId: id(339), skillId: id(302), track: 'web', code: 'fetch("/api/courses", { method: "GET" })', correctOptionId: 'b',
    ru: { title: 'HTTP GET', statement: 'Для чего обычно используется этот запрос?', options: [{ id: 'a', label: 'Для удаления курса' }, { id: 'b', label: 'Для получения списка курсов' }, { id: 'c', label: 'Для изменения пароля' }], explanation: 'GET запрашивает представление ресурса и не должен изменять его состояние.' },
    en: { title: 'HTTP GET', statement: 'What is this request usually used for?', options: [{ id: 'a', label: 'Deleting a course' }, { id: 'b', label: 'Fetching the course list' }, { id: 'c', label: 'Changing a password' }], explanation: 'GET requests a resource representation and should not change its state.' },
  },
  {
    taskId: id(320), versionId: id(340), skillId: id(302), track: 'web', correctOptionId: 'a',
    ru: { title: 'Статус 404', statement: 'Что означает HTTP-статус 404?', options: [{ id: 'a', label: 'Ресурс не найден' }, { id: 'b', label: 'Запрос выполнен успешно' }, { id: 'c', label: 'Сервер навсегда выключен' }], explanation: '404 сообщает, что сервер не нашёл запрошенный ресурс по этому адресу.' },
    en: { title: 'Status 404', statement: 'What does HTTP status 404 mean?', options: [{ id: 'a', label: 'The resource was not found' }, { id: 'b', label: 'The request succeeded' }, { id: 'c', label: 'The server is permanently offline' }], explanation: '404 means the server could not find the requested resource at that address.' },
  },
  {
    taskId: id(321), versionId: id(341), skillId: id(302), track: 'web', code: 'const response = await fetch("/api/profile")\nconst profile = await response.json()', correctOptionId: 'c',
    ru: { title: 'Ответ JSON', statement: 'Что делает response.json()?', options: [{ id: 'a', label: 'Отправляет второй запрос' }, { id: 'b', label: 'Удаляет тело ответа' }, { id: 'c', label: 'Разбирает JSON-тело ответа' }], explanation: 'Метод читает тело ответа и преобразует JSON в значение JavaScript.' },
    en: { title: 'JSON response', statement: 'What does response.json() do?', options: [{ id: 'a', label: 'Sends a second request' }, { id: 'b', label: 'Deletes the response body' }, { id: 'c', label: 'Parses the JSON response body' }], explanation: 'The method reads the response body and converts JSON into a JavaScript value.' },
  },
];

export const demoLearningTracks = [
  { id: 'python', taskIds: demoLearningTasks.filter((task) => task.track === 'python').map((task) => task.taskId) },
  { id: 'algorithms', taskIds: [id(315), id(316), id(317), id(318), id(314)] },
  { id: 'web', taskIds: [id(319), id(320), id(321), id(317), id(318)] },
] as const;

export const demoLearningVariants = demoLearningTracks.map((track, trackIndex) => ({
  variantId: id(350 + trackIndex),
  versionId: id(360 + trackIndex),
  title: track.id === 'python' ? 'Python: первые программы' : track.id === 'algorithms' ? 'Алгоритмы и отладка' : 'Web: клиент и API',
  description: track.id === 'python' ? 'Пять коротких задач от переменных до функций.' : track.id === 'algorithms' ? 'Логика, поиск и диагностика типичных ошибок.' : 'HTTP, JSON и границы клиент-серверного взаимодействия.',
  track: track.id,
  taskIds: [...track.taskIds],
}));

export const demoTheoryFixtures = [
  { materialId: id(390), versionId: id(400), linkId: id(410), taskId: id(310), skillId: id(300), title: 'Как Python выполняет выражения', description: 'Переменные, типы и порядок вычислений на коротких примерах.', category: 'Python', blocks: [{ type: 'heading', text: 'Сначала значение, затем действие' }, { type: 'paragraph', text: 'Переменная хранит значение. Операция использует тип этого значения, поэтому строка «5» и число 5 ведут себя по-разному.' }, { type: 'example', text: 'int("5") + 1 вернёт 6, потому что строка заранее преобразована в число.' }] },
  { materialId: id(391), versionId: id(401), linkId: id(411), taskId: id(315), skillId: id(301), title: 'Один проход по данным', description: 'Как рассуждать о линейных алгоритмах без лишней теории.', category: 'Алгоритмы', blocks: [{ type: 'heading', text: 'Храните лучший результат' }, { type: 'paragraph', text: 'Чтобы найти максимум, достаточно сравнить каждый новый элемент с текущим максимумом.' }, { type: 'formula', latex: 'T(n) = O(n)' }] },
  { materialId: id(392), versionId: id(402), linkId: id(412), taskId: id(318), skillId: id(301), title: 'Как находить ошибку на единицу', description: 'Границы диапазона и индексы коллекций.', category: 'Отладка', blocks: [{ type: 'heading', text: 'Проверяйте последний индекс' }, { type: 'paragraph', text: 'Если длина списка равна n, допустимые индексы идут от 0 до n − 1.' }, { type: 'callout', text: 'Перед запуском цикла назовите первое и последнее значение счётчика.' }] },
  { materialId: id(393), versionId: id(403), linkId: id(413), taskId: id(319), skillId: id(302), title: 'Что происходит между клиентом и API', description: 'Запрос, HTTP-статус и разбор JSON-ответа.', category: 'Web', blocks: [{ type: 'heading', text: 'Три шага одного запроса' }, { type: 'list', items: ['Клиент отправляет HTTP-запрос.', 'Сервер возвращает статус и тело.', 'Клиент разбирает JSON и обновляет интерфейс.'] }, { type: 'callout', text: 'Клиент отображает результат, но бизнес-правила и права доступа остаются на сервере.' }] },
] as const;
