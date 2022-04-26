interface Store {
    chats: Record<string, Chat>
    active: null | string
}

interface Dialog {
    Content: () => JSX.Element
    submitLabel: string | null
    onClose: () => void
}