type EngineStreams = {
  stdout?: string | null
  stderr?: string | null
}

/**
 * Join whatever an engine wrote to either stream.
 *
 * JSC is the reason this exists: it prints program output *and* uncaught
 * exceptions to stdout, but sends the `-d` bytecode dump to stderr, so looking
 * at a single stream always loses half the picture.
 */
export function engineOutput(r: EngineStreams) {
  return [r.stdout, r.stderr].filter(Boolean).join('\n')
}

/**
 * Turn a rejected execa promise into something worth showing.
 *
 * `e.stderr ?? e.toString()` looks like a fallback but isn't: `??` only steps
 * in for null/undefined, and execa always attaches a string. A process that
 * fails without writing to stderr — exactly what JSC does when a script throws
 * — therefore reported an empty string as its error message.
 */
export function engineErrorOutput(e: any) {
  return engineOutput(e ?? {}) || e?.toString?.() || String(e)
}
