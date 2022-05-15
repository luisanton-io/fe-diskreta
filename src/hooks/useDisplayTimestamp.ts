import { timestampState as timestampAtom } from "atoms/timestamp";
import { useRef } from "react";
import { useRecoilState } from "recoil";

export default function useDisplayTimestamp(index: number) {
    const [timestampState, setTimestampState] = useRecoilState(timestampAtom)

    const displayTimestamp = () => {
        if (timestampState?.timeout) clearTimeout(timestampState.timeout)

        setTimestampState({
            timeout: setTimeout(() => {
                setTimestampState(null)
            }, 4000),
            index
        })

    }

    return displayTimestamp


}