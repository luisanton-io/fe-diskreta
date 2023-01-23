import outgoing from '@mui/icons-material/AccessTime';
import sent from '@mui/icons-material/Done';
import delivered from '@mui/icons-material/DoneAll';
import useDisplayTimestamp from "hooks/useDisplayTimestamp";

const read = () => delivered({ color: 'secondary' })

const Icons = {
    outgoing, sent, delivered, read, error: () => null
}

interface Props {
    message: Message;
    sent: boolean
    i: number
}


export default function Message({ message, sent, i }: Props) {

    const { handleDisplayTimeStamp, displayedTimestamp, show } = useDisplayTimestamp(message, i)
    const status = message.status?.[message.to[0]._id]
    const Icon = Icons[status]

    return <div className="d-flex">
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"} py-3 my-2`}
            onClick={handleDisplayTimeStamp}>
            <span>{
                message.content.text.split("\n").map((line, i) => <span key={i}>{line}</span>)
            }
                {sent && <Icon className="ms-1" style={{ fontSize: '1em' }} />}
            </span>
        </div>
        <span className={`timestamp ${show ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
    </div>
}