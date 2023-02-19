import { Reply } from '@mui/icons-material';
import outgoing from '@mui/icons-material/AccessTime';
import sent from '@mui/icons-material/Done';
import delivered from '@mui/icons-material/DoneAll';
import { replyingToState } from 'atoms/replyingTo';
import useDisplayTimestamp from "hooks/useDisplayTimestamp";
import useSwipe from 'hooks/useSwipe';
import React, { CSSProperties, useContext, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
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

    const { setSpotlight, handleScrollTo } = useContext(ChatContext)

    const { deltaX, ...swipeProps } = useSwipe()

    const triggerReply = deltaX > 50

    const translateX = triggerReply ? 50 : deltaX

    const setReplyingTo = useSetRecoilState(replyingToState)

    useEffect(() => {
        if (triggerReply) {
            navigator.vibrate?.(80)
            setReplyingTo(message)
        }
    }, [triggerReply, setReplyingTo, message])

    const replyIconTransition = deltaX > 10 ? Math.abs(deltaX) / 50 : 0

    return <div id={'_' + message.hash} className="d-flex align-items-center position-relative message-wrapper my-2" {...swipeProps}
        style={{ transform: `translateX(-${translateX}px)` }}
    >
        <div className={`cursor-pointer message d-flex flex-column align-items-start ${sent ? "sent" : "received"}`} onClick={handleDisplayTimeStamp}>
            {
                message.replyingTo && <div className={`reply mb-0 mt-2`} onClick={handleScrollTo(message.replyingTo!.hash)}>
                    <div className="bg-dark px-3 py-3 mx-2" style={{ borderRadius: '1em' }}>
                        <p className="m-0"><strong>{message.replyingTo.sender.nick}</strong></p>
                        <p className="m-0">{message.replyingTo.content.text}</p>
                    </div>
                </div>
            }
            <div className='py-3'>

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
            </div>

        </div>
        <span className={`timestamp ${show ? "show" : ''}`}>{displayedTimestamp.replace(',', '')}</span>
        <div className="reply-icon-wrapper" style={{ '--transition': replyIconTransition } as CSSProperties} onClick={() => setReplyingTo(message)}>
            <Reply />
        </div>
    </div>
}