// Host bazli devre kesici (Metehan kalibi)
type State = "closed" | "open" | "half-open";

interface HostState {
  state: State;
  failures: number;
  openedAt: number;
  lastFailure: number;
}

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 45_000;

const hosts = new Map<string, HostState>();

function getHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function getState(host: string): HostState {
  let s = hosts.get(host);
  if (!s) {
    s = { state: "closed", failures: 0, openedAt: 0, lastFailure: 0 };
    hosts.set(host, s);
  }
  // open -> half-open after cooldown
  if (s.state === "open" && Date.now() - s.openedAt >= COOLDOWN_MS) {
    s.state = "half-open";
  }
  return s;
}

export function circuitCheck(url: string): { allowed: boolean; state: State } {
  const host = getHost(url);
  const s = getState(host);
  if (s.state === "open") return { allowed: false, state: "open" };
  return { allowed: true, state: s.state };
}

export function circuitSuccess(url: string): void {
  const host = getHost(url);
  const s = getState(host);
  s.state = "closed";
  s.failures = 0;
}

export function circuitFailure(url: string): void {
  const host = getHost(url);
  const s = getState(host);
  s.failures += 1;
  s.lastFailure = Date.now();
  if (s.failures >= FAILURE_THRESHOLD) {
    s.state = "open";
    s.openedAt = Date.now();
  }
}

export function circuitStatus(): Array<{ host: string; state: State; failures: number }> {
  return Array.from(hosts.entries()).map(([host, s]) => ({
    host,
    state: s.state,
    failures: s.failures,
  }));
}