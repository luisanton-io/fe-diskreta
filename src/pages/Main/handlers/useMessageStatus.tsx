import useUpdateMessage from "hooks/useUpdateMessage";
import { useCallback } from "react";
import { isMessageSent } from "util/isMessageSent";

export const SentMessageStatusValues: SentMessageStatus[] = [
    'outgoing', 'error', 'sent', 'delivered', 'read'
]

export const ReceivedMessageStatusValues: ReceivedMessageStatus[] = [
    'new', 'read'
]

export default function useMessageStatus() {

    const updateMessage = useUpdateMessage()

    return useCallback(({ chatId, hash, recipientId, status }: MessageStatusUpdate, ack?: Function) => {

        updateMessage({
            chatId, hash, updater: message => {

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
        })

        ack?.()
    }, [updateMessage])
}