import { AES, enc } from "crypto-js";
import { atom } from "recoil";
import { getRecoil } from "recoil-nexus";
import { recoilPersist } from 'recoil-persist';
import { userState } from "./user";

const encrypt = (message: string) => {
    try {
        const value = AES.encrypt(message, getRecoil(userState)?.id ?? '').toString()
        console.table({ value, id: getRecoil(userState)?.id, message })
        return value
    } catch {
        return null
    }
}
const decrypt = (cypher: string) => {
    try {
        const value = AES.decrypt(cypher, getRecoil(userState)?.id ?? '').toString(enc.Utf8)
        console.table({ value })
        return value
    } catch {
        return null
    }
}

const encryptedStorage = () => {
    return {
        setItem: (key: string, value: string) => {
            console.table({ key, value })
            localStorage.setItem(key, encrypt(value) as string)
        },
        getItem: (key: string) => {
            const a = localStorage.getItem(key)
            console.table({ decrypted: a && decrypt(a) })
            return a && decrypt(a)
        },
        clear: () => {
            localStorage.clear()
        },
    }
}

const { persistAtom } = recoilPersist({ key: '_', storage: encryptedStorage() })

export const storeState = atom<Store | null>({
    key: "store",
    default: null,
    effects_UNSTABLE: [persistAtom],
})