// js/recorder.js - 录音模块
const Recorder = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    isRecording: false,

    // 检查是否支持录音
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    // 开始录音
    async start() {
        if (!this.isSupported()) {
            alert('您的浏览器不支持录音功能');
            return false;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            return true;
        } catch (error) {
            console.error('录音失败:', error);
            alert('无法访问麦克风，请检查权限');
            return false;
        }
    },

    // 停止录音
    stop() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || !this.isRecording) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.isRecording = false;
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    },

    // 录音转为Base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    // Base64转Blob
    base64ToBlob(base64, mimeType = 'audio/webm') {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    },

    // 播放录音
    play(blobOrBase64) {
        const blob = typeof blobOrBase64 === 'string' && blobOrBase64.startsWith('data:')
            ? this.base64ToBlob(blobOrBase64)
            : blobOrBase64;

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        return audio;
    }
};
