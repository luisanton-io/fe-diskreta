import { createContext } from "react";
import { Socket } from "socket.io-client";

interface IChatContext {
    socket: Socket,
    activeChat: Chat,
    recipients: User[]
}

export const ChatContext = createContext<IChatContext>({} as IChatContext)