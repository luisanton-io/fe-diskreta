import { TouchEvent, useState } from "react";

interface SwipeInput {
    onSwipedLeft?: () => void
    onSwipedRight?: () => void
}

interface SwipeOutput {
    deltaX: number,
    onTouchStart: (e: TouchEvent) => void
    onTouchMove: (e: TouchEvent) => void
    onTouchEnd: () => void
}

export default function useSwipe(input?: SwipeInput): SwipeOutput {
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [deltaX, setDeltaX] = useState(0)

    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(0); // otherwise the swipe is fired even with usual touch events
        setTouchStart(e.targetTouches[0].clientX);
    }

    const onTouchMove = (e: TouchEvent) => {
        setDeltaX(touchStart - e.targetTouches[0].clientX)
        setTouchEnd(e.targetTouches[0].clientX)
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            input?.onSwipedLeft?.();
        }
        if (isRightSwipe) {
            input?.onSwipedRight?.();
        }
        setDeltaX(0)
    }

    return {
        deltaX,
        onTouchStart,
        onTouchMove,
        onTouchEnd
    }
}