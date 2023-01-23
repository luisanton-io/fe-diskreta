interface LoginResponse {
    user: User
    token: string
    refreshToken: string
}

type RefreshResponse = Omit<LoginResponse, "user">

interface User {
    _id: string
    nick: string
    publicKey: string
}

type MessageStatus = 'outgoing' | 'sent' | 'delivered' | 'read' | 'error'

interface MessageStatusUpdate {
    chatId: string,
    hash: string,
    recipientId: string,
    status: MessageStatus
}
interface Message {
    sender: User
    to: User[]
    chatId: string
    content: {
        text: string;
        media?: string
    }
    timestamp: number
    hash: string
    status: Record<User["_id"], MessageStatus>
}

interface OutgoingMessage extends Omit<Message, "sender" | "status"> {
    for: string
    sender?: Message["sender"]
}

interface Chat {
    id: string
    messages: Message[];
    members: User[]
}