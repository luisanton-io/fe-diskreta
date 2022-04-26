interface LoginResponse {
    token: string
    user: User
}

interface User {
    _id: string
    nick: string
    publicKey: string
}

interface Message {
    sender: User["_id"]
    to: User["_id"][]
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