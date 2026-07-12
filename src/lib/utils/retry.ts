/**
 * Retries an operation a couple of times on transient-looking failures
 * before giving up for real. Specifically targets "JWT issued at future" —
 * a known, brief Supabase/PostgREST clock-sync hiccup that occurs on some
 * underlying compute instances but not others; a retry on a fresh
 * invocation typically succeeds. Not a general-purpose retry-everything
 * wrapper — only retries errors that match this known transient pattern,
 * so a genuine data/logic error still fails immediately and visibly.
 */
export async function retryOnTransientAuthError<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isTransient = /jwt issued at future|jwt expired|fetch failed/i.test(message);

      if (!isTransient || attempt === attempts) {
        throw error;
      }

      // Short, small backoff — this is a clock-sync blip, not a rate limit,
      // so there's no need to wait long.
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw lastError;
}
