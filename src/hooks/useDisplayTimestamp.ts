import { timestampState as timestampAtom } from "atoms/timestamp";
import { useRecoilState } from "recoil";
import { isMessageSent } from "util/isMessageSent";

export default function useDisplayTimestamp(message: SentMessage | ReceivedMessage, index: number) {

    const [timestampState, setTimestampState] = useRecoilState(timestampAtom)

    if (!isMessageSent(message)) return ({
        handleDisplayTimeStamp: () => { },
        show: false,
        displayedTimestamp: ''
    })

    const handleDisplayTimeStamp = () => {
        if (timestampState?.timeout) clearTimeout(timestampState.timeout)

        setTimestampState({
            timeout: setTimeout(() => {
                setTimestampState(null)
            }, 4000),
            index
        })
    }

    const [status, timestamp] = message.status?.[Object.keys(message.status)[0]].split(' ')
    const time = new Date(parseInt(timestamp))

    const displayedTimestamp = status.charAt(0).toUpperCase() + status.slice(1) + ' ' + (
        !!timestamp
            ? (
                time.toLocaleDateString() === new Date().toLocaleDateString() // message sent today
                    ? 'today, ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : time.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
            )
            : ''
    )

    const show = timestampState?.index === index

    return { handleDisplayTimeStamp, show, displayedTimestamp }


}