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

  it('returns "dotnet" when CONFIGURE.md is absent', () => {
    expect(detectStack(join(tmp, 'NONEXISTENT.md'))).toBe('dotnet');
  });

  it('returns "dotnet" when PROJECT_STACK is not set', () => {
    const p = writeConfigure(tmp, '# CONFIGURE\nTOOLING_NODE=true\n');
    expect(detectStack(p)).toBe('dotnet');
  });

  it('detects node', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=node\n');
    expect(detectStack(p)).toBe('node');
  });

  it('detects dotnet', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=dotnet\n');
    expect(detectStack(p)).toBe('dotnet');
  });

  it('detects .net', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=.net\n');
    expect(detectStack(p)).toBe('dotnet');
  });

  it('detects none', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=none\n');
    expect(detectStack(p)).toBe('none');
  });

  it('is case-insensitive', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=Dotnet\n');
    expect(detectStack(p)).toBe('dotnet');
  });

  it('returns "dotnet" for unknown stack value', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=ruby\n');
    expect(detectStack(p)).toBe('dotnet');
  });

  it('ignores leading/trailing whitespace around value', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK= node \n');
    expect(detectStack(p)).toBe('node');
  });

  it('reads value amid other flags', () => {
    const p = writeConfigure(tmp, '# Config\nTOOLING_NODE=false\nCI_PROFILE=core\nPROJECT_STACK=none\n');
    expect(detectStack(p)).toBe('none');
  });

  it('is idempotent — same result on repeated calls', () => {
    const p = writeConfigure(tmp, 'PROJECT_STACK=dotnet\n');
    expect(detectStack(p)).toBe(detectStack(p));
  });
});
