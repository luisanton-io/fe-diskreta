
interface User {
    id: string;
    username: string;
    pubkey: string;
}

interface Message {
    sender: User["id"]
    recipients: User[]
    chatId: string
    content: {
        text: string;
        media?: string
    }
    timestamp: number
}

interface Chat {
    messages: Message[];
    members: User[]
}

interface Store {
    chats: Record<string, Chat>
    active: null | string
}
