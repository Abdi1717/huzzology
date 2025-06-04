/**
 * Simple in-memory proxy pool.
 *
 * In production we will likely replace this with a database-backed or external
 * proxy provider integration.  The interface below keeps future changes
 * non-breaking for calling code.
 */

export interface ProxyInfo {
  host: string; // e.g. 127.0.0.1:8888
  lastFailure?: number;
  failures: number;
}

export class ProxyPool {
  private readonly proxies: ProxyInfo[] = [];
  private pointer = 0;

  constructor(initialProxies: string[] = []) {
    for (const host of initialProxies) {
      this.proxies.push({ host, failures: 0 });
    }
  }

  /** Add a proxy to the pool at runtime */
  public add(host: string): void {
    this.proxies.push({ host, failures: 0 });
  }

  /**
   * Round-robin selection ignoring proxies that have failed more than 3 times
   * in the last 10 minutes.
   */
  public next(): string | undefined {
    if (this.proxies.length === 0) return undefined;

    for (let i = 0; i < this.proxies.length; i++) {
      const index = (this.pointer + i) % this.proxies.length;
      const proxy = this.proxies[index];
      const coolOff = proxy.lastFailure && Date.now() - proxy.lastFailure < 10 * 60 * 1000;
      if (proxy.failures < 3 || !coolOff) {
        this.pointer = index + 1;
        return proxy.host;
      }
    }
    // All proxies are cooling off—return undefined so caller can fallback to
    // direct connection.
    return undefined;
  }

  /** Mark proxy as failed so it can be deprioritised */
  public reportFailure(host: string): void {
    const proxy = this.proxies.find(p => p.host === host);
    if (!proxy) return;
    proxy.failures += 1;
    proxy.lastFailure = Date.now();
  }
}