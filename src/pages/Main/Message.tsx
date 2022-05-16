import { timestampState as timestampAtom } from "atoms/timestamp";
import useDisplayTimestamp from "hooks/useDisplayTimestamp";
import { useRecoilState } from "recoil";

interface Props {
    message: Message;
    sent: boolean
    i: number
}

export default function Message({ message, sent, i }: Props) {

    const [timestampState, setTimestampState] = useRecoilState(timestampAtom);

    const time = new Date(message.timestamp)

    const displayedTimestamp =
        time.toLocaleDateString() === new Date().toLocaleDateString() // message sent today
            ? 'Today, ' + time.toLocaleTimeString()
            : time.toString().split('GMT')[0]

    const displayTimestamp = useDisplayTimestamp(i)

    return <div className="d-flex">
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"} py-3 my-2`}
            onClick={displayTimestamp}>
            {
                message.content.text.split("\n").map((line, i) => <span key={i}>{line}</span>)
            }
        </div>
        <span className={`timestamp ${timestampState?.index === i ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
    </div>
}