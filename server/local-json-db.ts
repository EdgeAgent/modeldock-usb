import { getLocalJsonState, updateLocalJsonState } from "./local-json-store";

type Row = Record<string, any> & { id: number };

export const localPersistenceEnabled = () => process.env.PORTABLE_PERSISTENCE === "local-json" || !process.env.DATABASE_URL;

export async function listLocal<T extends Row>(table: string) {
  const state = await getLocalJsonState();
  return ((state.tables[table] || []) as T[]).map((row) => hydrate(row));
}

export async function findLocal<T extends Row>(table: string, predicate: (row: T) => boolean) {
  const rows = await listLocal<T>(table);
  return rows.find(predicate);
}

export async function insertLocal<T extends Row>(table: string, values: Omit<T, "id"> & Partial<Pick<T, "id">>) {
  const state = await getLocalJsonState();
  const rows = (state.tables[table] || []) as T[];
  const id = values.id || rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
  const row = hydrate({ ...values, id } as T);
  await updateLocalJsonState({ tables: { [table]: [...rows, row] } });
  return row;
}

export async function updateLocal<T extends Row>(table: string, predicate: (row: T) => boolean, patch: Partial<T>) {
  const state = await getLocalJsonState();
  const rows = (state.tables[table] || []) as T[];
  let updated: T | undefined;
  const next = rows.map((row) => {
    if (!predicate(row)) return row;
    updated = hydrate({ ...row, ...patch } as T);
    return updated;
  });
  if (updated) await updateLocalJsonState({ tables: { [table]: next } });
  return updated;
}

export async function removeLocal<T extends Row>(table: string, predicate: (row: T) => boolean) {
  const state = await getLocalJsonState();
  const rows = (state.tables[table] || []) as T[];
  await updateLocalJsonState({ tables: { [table]: rows.filter((row) => !predicate(row)) } });
}

function hydrate<T extends Row>(row: T): T {
  const copy = { ...row } as T;
  for (const key of ["createdAt", "updatedAt", "lastSignedIn", "startedAt", "targetDate", "deadline", "resolvedAt", "lastReviewDate"]) {
    const value = (copy as Record<string, any>)[key];
    if (value && !(value instanceof Date)) (copy as Record<string, any>)[key] = new Date(value);
  }
  return copy;
}
