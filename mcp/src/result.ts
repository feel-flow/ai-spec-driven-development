// Resultパターン最小実装（エラー握り潰し防止）
export interface Ok<T> { ok: true; value: T }
export interface Err<E extends Error = Error> { ok: false; error: E }
export type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> { return { ok: true, value }; }
export function err<E extends Error>(error: E): Err<E> { return { ok: false, error }; }

export function map<T, U, E extends Error>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function unwrapOr<T, E extends Error>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}
