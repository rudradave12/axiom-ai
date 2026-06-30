export function sanitizeFirestorePayload<T>(payload: T): T {
  if (payload === undefined) {
    return payload; // Shouldn't be called directly with undefined at root, but just in case
  }
  
  if (payload === null) {
    return payload;
  }

  if (Array.isArray(payload)) {
    // Recursively sanitize each element in the array
    // Filter out undefined elements completely just in case
    return payload
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  if (
    typeof payload === 'object' &&
    !(payload instanceof Date) &&
    !('toDate' in payload && typeof (payload as { toDate?: unknown }).toDate === 'function')
  ) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeFirestorePayload(value);
      }
    }
    return sanitized as T;
  }

  // Primitive value (string, number, boolean) or Firestore Timestamp/Date
  return payload;
}
