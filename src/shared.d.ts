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

interface Message {
    sender: User
    to: User[]
    chatId: string
    content: {
        text: string;
        media?: string
    }
    timestamp: number
}

interface OutgoingMessage extends Omit<Message, "sender"> {
    for: string
    sender?: Message["sender"]
}

interface Chat {
    id: string
    messages: Message[];
    members: User[]
}