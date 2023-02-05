import { Close } from "@mui/icons-material";
import usePrevious from "hooks/usePrevious";
import { useState } from "react";

export default function Spotlight({ media, resetMedia }: { media: Media, resetMedia: () => void }) {
    const previousMedia = usePrevious(media)
    const [fading, setFading] = useState<'in' | 'out'>('in')

    return <div id="spotlight">
        <Close className="close-btn" onClick={() => setFading('out')} />
        <img src={fading === 'out' ? previousMedia!.data : media.data}
            className={`slide-${fading}-blurred-bottom`}
            onAnimationEnd={() => fading === 'out' && resetMedia()}
            alt="Spotlight"
        />
    </div>
}