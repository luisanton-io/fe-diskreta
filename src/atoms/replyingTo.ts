import { atom } from "recoil";

export const replyingToState = atom<Message | undefined>({
    key: 'replyTo',
    default: undefined
})