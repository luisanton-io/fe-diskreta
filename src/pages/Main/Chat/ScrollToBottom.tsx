import { useEffect, useState } from "react";
import { ChevronDown } from "react-bootstrap-icons";

interface Props {
    scrollerRef: React.RefObject<HTMLDivElement>
}

export default function ScrollToBottom({ scrollerRef }: Props) {

    const scrollToBottom = () => {
        scrollerRef.current?.scrollTo({
            top: scrollerRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }

    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

    useEffect(() => {
        const handleScrolledToBottom = () => {
            setIsScrolledToBottom(Math.abs(scrollerRef.current!.scrollTop) < 3)
        }

        scrollerRef.current?.addEventListener('scroll', handleScrolledToBottom)

        return () => {
            scrollerRef.current?.removeEventListener('scroll', handleScrolledToBottom)
        }
    }, [scrollerRef.current])

    return (
        <div id="scroll-to-bottom" className="text-white rounded-pill" onClick={scrollToBottom} data-visible={!isScrolledToBottom}>
            <ChevronDown />
        </div>
    )
}