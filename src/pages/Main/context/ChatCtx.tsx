import { Socket } from "socket.io-client";
import { createContext } from "react";

interface ChatContext {
    socket: Socket,
    activeChat: Chat,
    recipients: User[]
}

export const ChatContext = createContext<ChatContext>({} as ChatContext)