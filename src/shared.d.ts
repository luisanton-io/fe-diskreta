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

type SentMessageStatus = 'outgoing' | 'sent' | 'delivered' | 'read' | 'error'

type ReceivedMessageStatus = 'new' | 'read'

interface MessageStatusUpdate {
    chatId: string,
    hash: string,
    recipientId: string,
    status: SentMessageStatus | ReceivedMessageStatus
}

interface Media {
    type: 'image' | 'video' | 'audio' | 'file'
    data: string
    encryptionKey: string  // AES-256
}
interface Message {
    sender: User
    to: User[]
    chatId: string
    content: {
        text: string;
        media?: Media
    }
    timestamp: number
    hash: string
}

interface ReceivedMessage extends Message {
    status: ReceivedMessageStatus
}
interface OutgoingMessage extends Omit<Message, "sender"> {
    for: string
    sender?: Message["sender"]
}
interface SentMessage extends Message {
    status: Record<User["_id"], SentMessageStatus>
}
interface Chat {
    id: string
    messages: (SentMessage | ReceivedMessage)[];
    members: User[]
}
interface Queue {
    messages: ReceivedMessage[],
    status: MessageStatusUpdate[]
}