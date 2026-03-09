export function safeData<T>(data: T[] | null): T[] {
  return (data ?? []) as T[];
}
