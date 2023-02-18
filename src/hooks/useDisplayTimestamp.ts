import { timestampState as timestampAtom } from "atoms/timestamp";
import { useRecoilState } from "recoil";
import { isMessageSent } from "util/isMessageSent";

export default function useDisplayTimestamp(message: SentMessage | ReceivedMessage, index: number) {
    const [timestampState, setTimestampState] = useRecoilState(timestampAtom)

    const handleDisplayTimeStamp = () => {
        if (timestampState?.timeout) clearTimeout(timestampState.timeout)

        setTimestampState({
            timeout: setTimeout(() => {
                setTimestampState(null)
            }, 4000),
            index
        })
    }

    const time = new Date(message.timestamp)

    const displayedTimestamp = (time.toLocaleDateString() === new Date().toLocaleDateString() // message sent today
        ? 'Today, ' + time.toLocaleTimeString()
        : time.toString().split('GMT')[0])

    const show = timestampState?.index === index


    return { handleDisplayTimeStamp, show, displayedTimestamp }


}