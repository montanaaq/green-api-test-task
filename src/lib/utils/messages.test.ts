import assert from 'node:assert/strict'
import test from 'node:test'

import { mergeMessages } from './messages.ts'

test('history and live messages merge without duplicates in chronological order', () => {
  const first = {
    id: '1',
    chatId: '10000000',
    text: 'Первое',
    timestamp: 1,
    direction: 'incoming'
  } as const
  const second = { ...first, id: '2', text: 'Второе', timestamp: 2 }
  const updated = { ...first, text: 'Первое обновлено' }
  const history = [first, second]
  const updates = [second, updated]
  assert.deepEqual(mergeMessages(history, updates), [updated, second])
  assert.deepEqual(history, [first, second])
  assert.deepEqual(updates, [second, updated])
})
