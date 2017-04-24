import { Promise } from "es6-promise";

export function onReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        document.addEventListener("DOMContentLoaded", () => {
            resolve();
        });
    });
}