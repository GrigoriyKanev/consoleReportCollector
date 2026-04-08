export { }
declare global {
    interface Console {
        errorStd?: (...args: unknown[]) => void;
        logStd?: (...args: unknown[]) => void;
        warnStd?: (...args: unknown[]) => void;
    }
}

// Тип аргументов `console`-функций. В реальности в конце может
// добавляться массив строк со стеками ошибок — учтём это с помощью
// добавления `string[]` в конец записи.
// Представим запись как массив элементов: либо исходные аргументы
// `console.*`, либо строки стека (string). Это упрощённая, но
// практичная модель для хранения и типизации записей.
type ErrorEntry = Array<Parameters<typeof console.error>[number] | string>;
type LogEntry = Array<Parameters<typeof console.log>[number] | string>;
type WarnEntry = Array<Parameters<typeof console.warn>[number] | string>;

interface Stocks {
    errors: ErrorEntry[];
    logs: LogEntry[];
    warnings: WarnEntry[];
};

const stocks: Stocks = {
    errors: [],
    logs: [],
    warnings: [],
};

type ErrorListener = (entry: ErrorEntry) => void;
type LogListener = (entry: LogEntry) => void;
type WarnListener = (entry: WarnEntry) => void;

const errorListeners: ErrorListener[] = [];
const logListeners: LogListener[] = [];
const warnListeners: WarnListener[] = [];

/**
 * Регистрирует слушатель, который вызывается при добавлении новой записи в `stocks.errors`.
 * @param cb Колбек, получающий последнюю добавленную запись (массив аргументов, например `[message, error?, stack?]`).
 * @returns Функция отписки — вызовёт удаление слушателя.
 *
 * Пример:
 * const unsubscribe = errorUpdate(entry => alert(String(entry[0] ?? entry)));
 */
export const errorUpdate = (cb: ErrorListener) => {
    errorListeners.push(cb);
    return () => {
        const i = errorListeners.indexOf(cb);
        if (i !== -1) errorListeners.splice(i, 1);
    };
}

/**
 * Регистрирует слушатель, который вызывается при добавлении новой записи в `stocks.logs`.
 * @param cb Колбек, получающий последнюю добавленную запись (массив аргументов переданных в `console.log`).
 * @returns Функция отписки.
 */
export const logUpdate = (cb: LogListener) => {
    logListeners.push(cb);
    return () => {
        const i = logListeners.indexOf(cb);
        if (i !== -1) logListeners.splice(i, 1);
    };
}

/**
 * Регистрирует слушатель, который вызывается при добавлении новой записи в `stocks.warnings`.
 * @param cb Колбек, получающий последнюю добавленную запись (массив аргументов переданных в `console.warn`).
 * @returns Функция отписки.
 */
export const warnUpdate = (cb: WarnListener) => {
    warnListeners.push(cb);
    return () => {
        const i = warnListeners.indexOf(cb);
        if (i !== -1) warnListeners.splice(i, 1);
    };
}

/**
 * Максимальный размер каждого стока. По умолчанию 100.
 * Можно изменить при импорте: `import { stockSize } from '...'; stockSize = 200;`
 */
export let stockSize = 100;

console.errorStd = console.error.bind(console);
console.logStd = console.log.bind(console);
console.warnStd = console.warn.bind(console);

type StockArray = ErrorEntry[] | LogEntry[] | WarnEntry[];

const drain = (stock: StockArray, ...args: unknown[]) => {
    const stack = args
        .filter(arg => arg instanceof Error)
        .map(err => (err as Error).stack)
        .filter(Boolean);
    let entry: ErrorEntry | LogEntry | WarnEntry;
    if (stock === stocks.errors) {
        if (stack.length) entry = [...(args as unknown[] as ErrorEntry), ...(stack as string[])];
        else entry = args as ErrorEntry;
        stock.push(entry as ErrorEntry);
    } else if (stock === stocks.logs) {
        if (stack.length) entry = [...(args as unknown[] as LogEntry), ...(stack as string[])];
        else entry = args as LogEntry;
        stock.push(entry as LogEntry);
    } else {
        if (stack.length) entry = [...(args as unknown[] as WarnEntry), ...(stack as string[])];
        else entry = args as WarnEntry;
        stock.push(entry as WarnEntry);
    }

    if (stockSize > 0) {
        while (stock.length > stockSize) stock.shift();
    }

    if (stock === stocks.errors) {
        for (const l of errorListeners) {
            try { l(entry); } catch { }
        }
    } else if (stock === stocks.logs) {
        for (const l of logListeners) {
            try { l(entry); } catch { }
        }
    } else if (stock === stocks.warnings) {
        for (const l of warnListeners) {
            try { l(entry); } catch { }
        }
    }
}

export default stocks;

console.error = (...args: unknown[]) => {
    if (console.errorStd) console.errorStd(...args)
    drain(stocks.errors, ...args);
}
console.log = (...args: unknown[]) => {
    if (console.logStd) console.logStd(...args)
    drain(stocks.logs, ...args)
}
console.warn = (...args: unknown[]) => {
    if (console.warnStd) console.warnStd(...args)
    drain(stocks.warnings, ...args)
}