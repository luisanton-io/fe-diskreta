interface LoginResponse {
    user: User
    token: string
    refreshToken: string
}

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

interface Chat {
    id: string
    messages: Message[];
    members: User[]
}