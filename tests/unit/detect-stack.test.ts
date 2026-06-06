import { describe, it, expect, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectStack } from '../../scripts/detect-stack.js';

function writeConfigure(dir: string, content: string): string {
  const path = join(dir, 'CONFIGURE.md');
  writeFileSync(path, content, 'utf8');
  return path;
}

describe('detectStack', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = join(tmpdir(), `detect-stack-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
  });

  it('returns "node" when CONFIGURE.md is absent', () => {
    expect(detectStack(join(tmp, 'NONEXISTENT.md'))).toBe('node');
  });

  it('returns "node" when PROJECT_STACK is not set', () => {
    const p = writeConfigure(tmp, '# CONFIGURE\nTOOLING_NODE=true\n');
    expect(detectStack(p)).toBe('node');
  });

  it('detects node', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=node\n');
    expect(detectStack(p)).toBe('node');
  });

  it('detects python', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=python\n');
    expect(detectStack(p)).toBe('python');
  });

  it('detects go', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=go\n');
    expect(detectStack(p)).toBe('go');
  });

  it('detects rust', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=rust\n');
    expect(detectStack(p)).toBe('rust');
  });

  it('detects none', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=none\n');
    expect(detectStack(p)).toBe('none');
  });

  it('is case-insensitive', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=Python\n');
    expect(detectStack(p)).toBe('python');
  });

  it('returns "node" for unknown stack value', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=ruby\n');
    expect(detectStack(p)).toBe('node');
  });

  it('ignores leading/trailing whitespace around value', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK= go \n');
    expect(detectStack(p)).toBe('go');
  });

  it('reads value amid other flags', () => {
    const p = writeConfigure(tmp, '# Config\nTOOLING_NODE=false\nCI_PROFILE=core\nPROJECT_STACK=rust\n');
    expect(detectStack(p)).toBe('rust');
  });

  it('is idempotent — same result on repeated calls', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=python\n');
    expect(detectStack(p)).toBe(detectStack(p));
  });
});
