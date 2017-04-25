export function onReady(callback: Function) {
    document.addEventListener("DOMContentLoaded", () => {
        callback();
    });
}