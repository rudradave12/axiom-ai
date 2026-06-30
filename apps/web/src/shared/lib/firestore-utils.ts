export function sanitizeFirestorePayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      if (
        value !== null && 
        typeof value === 'object' && 
        !Array.isArray(value) && 
        !(value instanceof Date) &&
        !('toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') // avoid recursing into Firestore Timestamps
      ) {
        // Recursively sanitize nested objects
        const nestedSanitized = sanitizeFirestorePayload(value as Record<string, unknown>);
        if (Object.keys(nestedSanitized).length > 0) {
          sanitized[key] = nestedSanitized;
        }
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as Partial<T>;
}
