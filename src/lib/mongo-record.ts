export function serializeRecord<T extends Record<string, unknown>>(value: T): T & { id: string } {
  const { _id, ...record } = value;
  return { ...record, id: String(_id) } as T & { id: string };
}

export function serializeRecords<T extends Record<string, unknown>>(values: T[]): Array<T & { id: string }> {
  return values.map(serializeRecord);
}
