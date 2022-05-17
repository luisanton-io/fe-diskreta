import useDisplayTimestamp from "hooks/useDisplayTimestamp";

interface Props {
    message: Message;
    sent: boolean
    i: number
}

export default function Message({ message, sent, i }: Props) {


    const { handleDisplayTimeStamp, displayedTimestamp, show } = useDisplayTimestamp(message, i)

    return <div className="d-flex">
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"} py-3 my-2`}
            onClick={handleDisplayTimeStamp}>
            {
                message.content.text.split("\n").map((line, i) => <span key={i}>{line}</span>)
            }
        </div>
        <span className={`timestamp ${show ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
    </div>
}