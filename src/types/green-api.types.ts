export interface GreenApiChat {
  chatId: string
  name: string
  type: 'user' | 'group' | 'channel' | 'bot'
  phoneNumber: number
}

export interface GreenApiAccount {
  exist: boolean
  chatId: string
  fromCache: boolean
}

export interface GreenApiHistoryMessage {
  type: 'incoming' | 'outgoing'
  idMessage: string
  timestamp: number
  chatId: string
  typeMessage: string
  textMessage?: string
}

export interface GreenApiNotification {
  receiptId: number
  body: {
    typeWebhook: string
    idMessage?: string
    timestamp: number
    senderData?: { chatId: string }
    messageData?: {
      typeMessage: string
      textMessageData?: { textMessage: string }
      extendedTextMessageData?: { text: string }
    }
  }
}

export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
}

export interface GreenApiSettings {
  incomingWebhook: 'yes' | 'no'
  webhookUrl: string
}
