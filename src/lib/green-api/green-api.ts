import type { GreenApiNotification, Message } from '@/types'

export const parseIncomingMessage = ({ body }: GreenApiNotification): Message | null => {
  if (body.typeWebhook !== 'incomingMessageReceived') return null

  const data = body.messageData
  let text: string | undefined
  if (data?.typeMessage === 'textMessage') text = data.textMessageData?.textMessage
  else if (data?.typeMessage === 'extendedTextMessage') text = data.extendedTextMessageData?.text
  else return null

  if (typeof text !== 'string' || !body.idMessage || !body.senderData?.chatId) {
    throw new Error('GREEN-API вернул неверное текстовое уведомление')
  }

  return {
    id: body.idMessage,
    chatId: body.senderData.chatId,
    text,
    timestamp: body.timestamp,
    direction: 'incoming'
  }
}
