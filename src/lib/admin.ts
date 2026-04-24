const STORAGE_KEY = "vinkveld-admin-enabled";
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE?.trim() ?? "";
const CHANGE_EVENT = "vinkveld-admin-change";

export const hasAdminCodeConfigured = ADMIN_CODE.length > 0;

export function isAdminEnabled(): boolean {
    if (typeof localStorage === "undefined") return false;
    return hasAdminCodeConfigured && localStorage.getItem(STORAGE_KEY) === "true";
}

export function enableAdmin(code: string): boolean {
    if (typeof localStorage === "undefined") return false;
    if (!hasAdminCodeConfigured || code.trim() !== ADMIN_CODE) return false;
    localStorage.setItem(STORAGE_KEY, "true");
    notifyAdminChange(true);
    return true;
}

export function disableAdmin(): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    notifyAdminChange(false);
}

export function onAdminChange(callback: (active: boolean) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: Event) => {
        callback((event as CustomEvent<{ active: boolean }>).detail.active);
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
}

function notifyAdminChange(active: boolean): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { active } }));
}
