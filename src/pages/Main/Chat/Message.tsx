import outgoing from '@mui/icons-material/AccessTime';
import sent from '@mui/icons-material/Done';
import delivered from '@mui/icons-material/DoneAll';
import useDisplayTimestamp from "hooks/useDisplayTimestamp";
import { isMessageSent } from 'util/isMessageSent';

const Icons = {
    outgoing, sent, delivered, read: delivered, error: () => null, new: () => null
}


interface Props {
    message: SentMessage | ReceivedMessage;
    sent: boolean
    i: number
}

export default function Message({ message, sent, i }: Props) {

    const { handleDisplayTimeStamp, displayedTimestamp, show } = useDisplayTimestamp(message, i)

    const status = isMessageSent(message) ? message.status?.[message.to[0]._id] : message.status
    const Icon = Icons[status]

    return <div className="d-flex">
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"} py-3 my-2`}
            onClick={handleDisplayTimeStamp}>
            <span>{
                message.content.text.split("\n").map((line, i) => <span key={i}>{line}</span>)
            }
                {sent && <Icon className="ms-1" style={{ fontSize: '1em', color: status === 'read' ? '#0dcaf0' : undefined }} />}
            </span>
        </div>
        <span className={`timestamp ${show ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
    </div>
}