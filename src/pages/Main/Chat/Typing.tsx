import { useContext, useEffect, useState } from "react";
import { ChatContext } from "./context/ChatCtx";

export default function Typing() {

    const [dots, setDots] = useState('')

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(dots => dots === '...' ? '' : dots + '.')
        }, 600)

        return () => {
            clearInterval(interval)
        }
    }, [])


    return <div className="position-absolute top-0 start-0 end-0 d-flex justify-content-start">
        <span style={{ opacity: 0.75 }}>Typing{dots}</span>
    </div>
}