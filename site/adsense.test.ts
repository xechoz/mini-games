import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adsTxtLine, normalizeAdsenseClient } from './adsense.ts'

test('normalizes publisher ids', () => {
  assert.equal(normalizeAdsenseClient('pub-123'), 'ca-pub-123')
  assert.equal(normalizeAdsenseClient('ca-pub-123'), 'ca-pub-123')
  assert.equal(normalizeAdsenseClient('  '), null)
  assert.equal(normalizeAdsenseClient(undefined), null)
})

test('writes the authorized seller line', () => {
  assert.equal(adsTxtLine('ca-pub-123'), 'google.com, pub-123, DIRECT, f08c47fec0942fa0')
})
