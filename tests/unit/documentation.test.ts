import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validates referential integrity of the knowledge base index.
 * Ensures:
 * 1. All context files listed in AGENTS.md physically exist on disk.
 * 2. All physical files in .agent/context/ are registered in AGENTS.md (no orphans).
 * 3. No broken local links in the master index.
 */
describe('Documentation Integrity & Compliance Test', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const agentsMdPath = path.join(rootDir, 'AGENTS.md');
  const contextDir = path.join(rootDir, '.agent/context');

  it('should verify that AGENTS.md exists', () => {
    expect(
      fs.existsSync(agentsMdPath),
      `AGENTS.md not found at expected root path: ${agentsMdPath}. Ensure rootDir resolves to the repository root.`,
    ).toBe(true);
  });

  it('should verify rootDir is the repository root (contains AGENTS.md)', () => {
    expect(
      fs.existsSync(path.join(rootDir, 'AGENTS.md')),
      `rootDir (${rootDir}) does not contain AGENTS.md — test is running from the wrong directory.`,
    ).toBe(true);
  });

  it('should verify that .agent/context directory exists', () => {
    expect(fs.existsSync(contextDir)).toBe(true);
  });

  it('should ensure all context files listed in AGENTS.md physically exist', () => {
    const agentsContent = fs.readFileSync(agentsMdPath, 'utf-8');

    // Regex to capture markdown links of the form [.agent/context/FILE.md]
    const fileRegex = /\.agent\/context\/([a-zA-Z0-9_.-]+\.md)/g;
    let match;
    const listedFiles: string[] = [];

    while ((match = fileRegex.exec(agentsContent)) !== null) {
      const captured = match[1];
      if (captured) listedFiles.push(captured);
    }

    expect(listedFiles.length).toBeGreaterThan(0);

    const missingFiles: string[] = [];
    listedFiles.forEach((file) => {
      const filePath = path.join(contextDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });

    expect(
      missingFiles,
      `Files listed in AGENTS.md that do NOT exist on disk: ${missingFiles.join(', ')}`,
    ).toEqual([]);
  });

  it('should ensure all physical context files are registered in AGENTS.md (no orphans)', () => {
    const agentsContent = fs.readFileSync(agentsMdPath, 'utf-8');
    const physicalFiles = fs.readdirSync(contextDir).filter((file) => file.endsWith('.md'));

    const unregisteredFiles: string[] = [];
    physicalFiles.forEach((file) => {
      // Check if the file name appears in AGENTS.md
      if (!agentsContent.includes(file)) {
        unregisteredFiles.push(file);
      }
    });

    expect(
      unregisteredFiles,
      `Orphaned context files on disk NOT registered in AGENTS.md: ${unregisteredFiles.join(', ')}`,
    ).toEqual([]);
  });

  it('should ensure relative markdown links in context files resolve to existing files', () => {
    const mdFiles = fs.readdirSync(contextDir).filter((f) => f.endsWith('.md'));
    // Also check root-level docs
    const rootMdFiles = ['AGENTS.md', 'ONBOARDING.md', 'CONTRIBUTING.md', 'CLAUDE.md'];

    // Recursively collect .md files from a directory tree
    function collectMdFiles(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectMdFiles(full);
        return entry.name.endsWith('.md') ? [full] : [];
      });
    }

    const filesToCheck = [
      ...mdFiles.map((f) => path.join(contextDir, f)),
      ...rootMdFiles.map((f) => path.join(rootDir, f)).filter((f) => fs.existsSync(f)),
      ...collectMdFiles(path.join(rootDir, 'docs')),
      ...collectMdFiles(path.join(rootDir, '.agent', 'docs')),
    ];

    const brokenLinks: string[] = [];
    // Matches relative markdown links: [text](relative/path) — skip http/https/mailto/file/#anchors
    const linkRegex = /\[([^\]]+)\]\((?!https?:|mailto:|file:|#)([^)]+)\)/g;
    // Placeholder patterns to skip — these are intentional template examples
    const placeholderPatterns = /^\[|^path$|^\.|^\/\[|^https?|^#|^\s*$/;

    filesToCheck.forEach((filePath) => {
      // Strip fenced code blocks before scanning — links inside ``` are examples, not real links
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const content = rawContent.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
      const fileDir = path.dirname(filePath);
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const linkTarget = match[2];
        if (!linkTarget) continue;
        // Skip placeholder-style targets
        if (placeholderPatterns.test(linkTarget.trim())) continue;
        // Strip anchor fragments (#section)
        const cleanTarget = linkTarget.split('#')[0];
        if (!cleanTarget) continue;
        const resolved = path.resolve(fileDir, cleanTarget);
        if (!fs.existsSync(resolved)) {
          brokenLinks.push(`${path.relative(rootDir, filePath)}: [${match[1]}](${linkTarget})`);
        }
      }
    });

    expect(
      brokenLinks,
      `Broken relative links found in context files:\n${brokenLinks.join('\n')}`,
    ).toEqual([]);
  });
});
