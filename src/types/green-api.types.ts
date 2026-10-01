export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
}

export interface GreenApiSettings {
  incomingWebhook: 'yes' | 'no'
  webhookUrl: string
}
