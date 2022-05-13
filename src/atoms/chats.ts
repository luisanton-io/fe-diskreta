import { atom } from "recoil";
import { getRecoil } from "recoil-nexus";
import { CHATS } from "../constants";
import persist from "./effects/persist";

const { persistAtom } = persist(CHATS)

export const defaultChats: Record<string, Chat> = {}

export const chatsState = atom<Record<string, Chat> | null>({
    key: CHATS,
    default: null,
    effects: [persistAtom],
});

(window as any).chats = () => getRecoil(chatsState)