interface Dialog {
    Content: () => JSX.Element
    submitLabel: string | null
    onClose: () => void
}