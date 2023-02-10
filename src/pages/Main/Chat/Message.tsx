import React from 'react'
import outgoing from '@mui/icons-material/AccessTime';
import sent from '@mui/icons-material/Done';
import delivered from '@mui/icons-material/DoneAll';
import useDisplayTimestamp from "hooks/useDisplayTimestamp";
import { useContext } from 'react';
import { isMessageSent } from 'util/isMessageSent';
import { ChatContext } from './context/ChatCtx';

const Icons = {
    outgoing, sent, delivered, read: delivered, error: () => null, new: () => null
}

interface Props {
    message: SentMessage | ReceivedMessage;
    sent: boolean
    i: number
}

const urlRegexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

export default function Message({ message, sent, i }: Props) {

    const { handleDisplayTimeStamp, displayedTimestamp, show } = useDisplayTimestamp(message, i)

    const status = isMessageSent(message) ? message.status?.[message.to[0]._id] : message.status
    const Icon = Icons[status]

    const { setSpotlight } = useContext(ChatContext)

    return <div className="d-flex">
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"} py-3 my-2`}
            onClick={handleDisplayTimeStamp}>
            {
                message.content.media &&
                <img
                    src={message.content.media.data} alt="..."
                    onClick={() => setSpotlight(s => s && ({ ...s, media: message.content.media! }))}
                />
            }
            <span>
                {
                    message.content.text && message.content.text.split("\n").map((line, i) =>
                        <span key={i}>{
                            line.split(' ').map((word, i) =>
                                <React.Fragment key={`word-${i}`}>
                                    {urlRegexp.test(word)
                                        ? <a style={{ color: 'white' }}
                                            onClick={e => { e.stopPropagation() }}
                                            href={word.startsWith('http') ? word : `https://${word}`}
                                            target="_blank" rel="noopener noreferrer"
                                        >
                                            {word}
                                        </a>
                                        : word}{' '}
                                </React.Fragment>
                            )
                        }</span>
                    )
                }
                {
                    sent &&
                    <Icon className={
                        message.content.text && "ms-1"
                    } style={{ fontSize: '1em', color: status === 'read' ? '#0dcaf0' : undefined }} />
                }
            </span>
        </div >
        <span className={`timestamp ${show ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
    </div >
}