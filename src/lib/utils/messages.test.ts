import { expect, it } from 'vitest'

import { mergeMessages } from './messages.ts'

it('Should show a live message once when history contains the same ID', () => {
  const history = [
    { id: '1', chatId: '123', text: 'старый текст', timestamp: 1, direction: 'incoming' as const }
  ]
  const updated = { ...history[0], text: 'новый текст' }
  expect(mergeMessages(history, [updated])).toEqual([updated])
})

it('Should preserve a delivery failure when combining history with the local sent message', () => {
  const sent = {
    id: '1',
    chatId: '123',
    text: 'Привет',
    timestamp: 1,
    direction: 'outgoing' as const
  }
  const failed = { ...sent, deliveryError: 'Не удалось доставить сообщение' }
  expect(mergeMessages([failed], [sent])).toEqual([failed])
})
