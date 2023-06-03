
interface IRecordAudio {
    start: () => void;
    stop: () => Promise<string>;
    isRecording: () => boolean;
}

export const useRecordAudio = () => () => {
    return new Promise<IRecordAudio>(resolve => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks: Blob[] = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                const start = () => {
                    mediaRecorder.start();
                };

                const stop = () => {
                    return new Promise<string>(resolve => {
                        mediaRecorder.addEventListener("stop", () => {
                            const audioBlob = new Blob(audioChunks);
                            const audioUrl = URL.createObjectURL(audioBlob);

                            resolve(audioUrl);
                        });

                        mediaRecorder.stop();
                    });
                };

                const isRecording = () => mediaRecorder.state === 'recording'

                resolve({ start, stop, isRecording });
            });
    });
};