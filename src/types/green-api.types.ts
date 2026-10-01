export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
}

export interface GreenApiSettings {
  incomingWebhook: 'yes' | 'no'
  outgoingMessageWebhook: 'yes' | 'no'
  webhookUrl: string
}
