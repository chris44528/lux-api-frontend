declare module 'lodash/debounce' {
    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked, or until the next browser frame is drawn.
     *
     * @param func The function to debounce.
     * @param wait The number of milliseconds to delay.
     * @param options The options object.
     * @returns Returns the new debounced function.
     */
    function debounce<T extends (...args: unknown[]) => unknown>(
        func: T,
        wait?: number,
        options?: {
            leading?: boolean;
            maxWait?: number;
            trailing?: boolean;
        }
    ): T & {
        cancel(): void;
        flush(): ReturnType<T>;
    };

    export default debounce;
} 