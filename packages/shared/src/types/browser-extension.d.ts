/**
 * Type declarations for browser extension APIs
 * These are minimal types needed for runtime detection
 */

declare namespace chrome {
  namespace runtime {
    const id: string | undefined;
  }
}

declare namespace browser {
  namespace runtime {
    const id: string | undefined;
  }
}
