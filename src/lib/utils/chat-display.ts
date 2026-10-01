export const getAvatarInitials = (name: string) => name.replace(/^\+/, '').slice(0, 2).toUpperCase()
