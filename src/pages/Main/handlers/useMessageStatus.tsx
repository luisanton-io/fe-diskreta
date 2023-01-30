import { chatsState } from "atoms/chats";
import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { isMessageSent } from "util/isMessageSent";

export const SentMessageStatusValues: SentMessageStatus[] = [
    'outgoing', 'error', 'sent', 'delivered', 'read'
]

export const ReceivedMessageStatusValues: ReceivedMessageStatus[] = [
    'new', 'read'
]

export default function useMessageStatus() {
    const setChats = useSetRecoilState(chatsState)

    return useCallback(({ chatId, hash, recipientId, status }: MessageStatusUpdate) => {

        const withUpdatedStatus = (message: SentMessage | ReceivedMessage) => {

            if (isMessageSent(message)) {
                if (SentMessageStatusValues.indexOf(message.status[recipientId]) < SentMessageStatusValues.indexOf(status as SentMessageStatus)) {
                    return {
                        ...message,
                        status: {
                            ...message.status,
                            [recipientId]: status as SentMessageStatus
                        }
                    }
                }
            } else {
                if (ReceivedMessageStatusValues.indexOf(message.status) < ReceivedMessageStatusValues.indexOf(status as ReceivedMessageStatus)) {
                    return {
                        ...message,
                        status: status as ReceivedMessageStatus
                    }
                }
            }

            return message

        }

        console.log(hash, status)

        setChats(chats => ({
            ...chats,
            [chatId]: {
                ...chats![chatId],
                messages: chats![chatId].messages.map(m =>
                    m.hash === hash
                        ? withUpdatedStatus(m)
                        : m
                )
            }
        }))
    }, [setChats])
}