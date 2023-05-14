import { toast } from "react-toastify"

function clipboardFallback(text: string) {
    const isIos = navigator.userAgent.match(/ipad|iphone/i);
    const textarea = document.createElement('textarea');

    // create textarea
    textarea.value = text;

    // ios will zoom in on the input if the font-size is < 16px
    textarea.style.fontSize = '0px'; // looks like it doesnt after all
    document.body.appendChild(textarea);

    // select text
    if (isIos) {
        const range = document.createRange();
        range.selectNodeContents(textarea);

        const selection = window.getSelection();
        selection!.removeAllRanges();
        selection!.addRange(range);
        textarea.setSelectionRange(0, 999999);
    } else {
        textarea.select();
    }

    // copy selection
    document.execCommand('copy');

    // cleanup
    document.body.removeChild(textarea);

}

export default function useClipboard() {
    return {
        copy: (data: string) => {
            navigator.clipboard
                ? navigator.clipboard.writeText(data)
                : clipboardFallback(data)
        }
    }
}