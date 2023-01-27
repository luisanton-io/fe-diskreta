import { chatsState } from "atoms/chats";
import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

export default function useMessageStatus() {
    const setChats = useSetRecoilState(chatsState)

    return useCallback(({ chatId, hash, recipientId, status }: MessageStatusUpdate) => {
        setChats(chats => ({
            ...chats,
            [chatId]: {
                ...chats![chatId],
                messages: chats![chatId].messages.map(m =>
                    m.hash === hash
                        ? ({
                            ...m,
                            status: {
                                ...(m as SentMessage).status,
                                [recipientId]: status
                            }
                        })
                        : m
                )
            }
        }))
    }, [setChats])
}