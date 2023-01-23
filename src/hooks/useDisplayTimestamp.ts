import { timestampState as timestampAtom } from "atoms/timestamp";
import { useRecoilState } from "recoil";

export default function useDisplayTimestamp(message: Message, index: number) {
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
    const sent = !!message.status
    const status = message.status?.[Object.keys(message.status)[0]] || ''

    const displayedTimestamp = status.charAt(0).toUpperCase() + status.slice(1) + ' ' +
        (time.toLocaleDateString() === new Date().toLocaleDateString() // message sent today
            ? (sent ? 'today, ' : 'Today, ') + time.toLocaleTimeString()
            : time.toString().split('GMT')[0])


    const show = timestampState?.index === index


    return { handleDisplayTimeStamp, show, displayedTimestamp }


}