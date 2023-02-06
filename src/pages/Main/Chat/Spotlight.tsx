import { Close } from "@mui/icons-material";
import usePrevious from "hooks/usePrevious";
import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

export interface SpotlightProps {
    media: Media,
    resetMedia: () => void
    onReset?: () => void
    isInput?: boolean
}

export default function Spotlight({ media, resetMedia, onReset, isInput = false }: SpotlightProps) {
    const previousMedia = usePrevious(media)
    const [fading, setFading] = useState<'in' | 'out'>('in')

    const handleAnimationEnd = () => {
        resetMedia()
        onReset?.()
    }

    return <div id="spotlight" data-input-media={isInput}>
        <Close className="close-btn" onClick={() => setFading('out')} />
        <TransformWrapper>
            <TransformComponent>

                <img src={fading === 'out' ? previousMedia!.data : media.data}
                    className={`slide-${fading}-blurred-bottom`}
                    onAnimationEnd={() => fading === 'out' && handleAnimationEnd()}
                    alt="Spotlight"
                />
            </TransformComponent>
        </TransformWrapper>
    </div >
}