import { chatsState } from "atoms/chats"
import { useRecoilState } from "recoil"

export default function useHandleDeleteChat() {
    const [chats, setChats] = useRecoilState(chatsState)

    return (id: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            const _chats = { ...chats }
            delete _chats![id]
            setChats({ ..._chats })
        }
    }
}