import { atom } from "recoil";
import persist from "./effects/persist";

const { persistAtom } = persist("_")

export const defaultChats: Record<string, Chat> = {}

export const chatsState = atom<Record<string, Chat> | null>({
    key: "chats",
    default: null,
    effects: [persistAtom],
})