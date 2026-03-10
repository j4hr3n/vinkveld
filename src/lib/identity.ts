const STORAGE_KEY = 'vinkveld-name';

export function getUserName(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setUserName(name: string): void {
  localStorage.setItem(STORAGE_KEY, name.trim());
}
