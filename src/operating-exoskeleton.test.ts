import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadAgent } from './loader.js';
import { validate } from './validate.js';
import { getAdapter, listAdapters } from './adapters/index.js';

test('workspace-agent template validates and declares direct-only posture', () => {
  const result = validate('templates/workspace-agent');
  assert.equal(result.valid, true, result.errors.join('\n'));
  const agent = loadAgent('templates/workspace-agent');
  assert.equal(agent.manifest.communication?.activation?.ambiguous?.posture, 'direct_only');
  assert.deepEqual(agent.manifest.communication?.activation?.ambiguous?.respond_when, [
    'direct_mention',
    'direct_assignment',
    'direct_message',
  ]);
});

test('executive-operator redacted example validates', () => {
  const result = validate('examples/executive-operator-redacted');
  assert.equal(result.valid, true, result.errors.join('\n'));
});

test('new adapters are registered', () => {
  assert.ok(listAdapters().includes('hermes'));
  assert.ok(listAdapters().includes('workspace-markdown'));
});

test('hermes adapter includes operating files and action receipt semantics', () => {
  const adapter = getAdapter('hermes');
  assert.ok(adapter);
  const out = adapter!(loadAgent('templates/workspace-agent'));
  assert.match(out, /Operating Exoskeleton/);
  assert.match(out, /policy\/action-classes\.example\.yml/);
  assert.match(out, /ops\/state\/action-log\.schema\.json/);
  assert.match(out, /seen: discovered, not complete/);
});

test('workspace markdown adapter creates self-onboarding packet', () => {
  const adapter = getAdapter('workspace-markdown');
  assert.ok(adapter);
  const out = adapter!(loadAgent('templates/workspace-agent'));
  assert.match(out, /What to ask the human for/);
  assert.match(out, /Ask for your agent API key/);
  assert.match(out, /direct_only/);
});
