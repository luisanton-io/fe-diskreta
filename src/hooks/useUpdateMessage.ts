import { chatsState } from "atoms/chats";
import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
interface UpdateMessage {
    chatId: string,
    hash: string,
    updater: (message: SentMessage | ReceivedMessage) => SentMessage | ReceivedMessage
}

export default function useUpdateMessage() {
    const setChats = useSetRecoilState(chatsState)

    return useCallback(({ chatId, hash, updater }: UpdateMessage) => {
        setChats(chats => !chats?.[chatId] ? chats : ({
            ...chats,
            [chatId]: {
                ...chats[chatId],
                messages: chats[chatId].messages.map(msg =>
                    msg.hash !== hash ? msg : updater(msg)
                )
            }
        }))
    }, [setChats])
}