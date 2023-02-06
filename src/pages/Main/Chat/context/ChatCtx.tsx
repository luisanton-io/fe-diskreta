import { createContext } from "react";
import { Socket } from "socket.io-client";
import { SpotlightProps } from "../Spotlight";

interface IChatContext {
    socket: Socket,
    activeChat: Chat,
    recipients: User[],
    setSpotlight: React.Dispatch<React.SetStateAction<SpotlightProps>>
}

export const ChatContext = createContext<IChatContext>({} as IChatContext)