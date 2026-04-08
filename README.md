# consoleReportCollector
Сбор консольных сообщений проекта для дальнейшего учёта

Небольшая утилита для перехвата `console.error`, `console.log` и `console.warn` и хранения их записей в памяти.

Экспортируемые сущности
- `stocks` — объект с массивами: `errors`, `logs`, `warnings` (каждый элемент — массив аргументов вызова).
- `errorUpdate(cb)` — регистрирует колбек, вызываемый при добавлении новой записи в `stocks.errors`. Возвращает функцию отписки.
- `logUpdate(cb)` — аналогично для `stocks.logs`.
- `warnUpdate(cb)` — аналогично для `stocks.warnings`.
- `stockSize` — настраиваемый максимум длины каждого стока (по умолчанию `100`). При добавлении новой записи она помещается в конец массива, а при превышении размера удаляется самая старая запись из головы.

Примеры использования

1) Простая регистрация и показ alert при ошибке

```ts
import stocks, { errorUpdate } from './consoleReportCollector'

const unsubscribe = errorUpdate(entry => {
	// entry — массив аргументов, например [message, Error?, stack?]
	alert(String(entry[0] ?? entry));
});

// позже, чтобы отписаться
// unsubscribe();
```

2) Логирование в UI при вызове `console.log`

```ts
import { logUpdate } from './consoleReportCollector'

logUpdate(entry => {
	// вывести первый аргумент в элемент на странице
	const el = document.getElementById('logs');
	if (el) el.textContent += String(entry[0] ?? entry) + '\n';
});
```

3) Немедленное уведомление и отладочные цели

```ts
import stocks, { warnUpdate } from './consoleReportCollector'

warnUpdate(entry => console.debug('warning collected', entry));

// Можно посмотреть все собранные ошибки
console.table(stocks.errors);
```

Замечания
- Записи хранятся в памяти — при больших объёмах возможно накопление памяти.
- Колбеки вызываются синхронно в момент вызова `console.*`.

Поведение стоков
- Новые записи добавляются в конец соответствующего массива (`push`).
- Если длина стока превышает `stockSize`, лишние старые записи удаляются с головы (`shift`).

Рекомендации
- Чтобы не допустить утечек памяти, при долгой работе увеличивайте `stockSize` осторожно или периодически очищайте `stocks` вручную.
- При регистрации слушателей учитывайте, что колбеки вызываются синхронно и не должны блокировать основной поток.

Лицензия: см. LICENSE