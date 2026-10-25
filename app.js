let audioContext;
let analyser;
let mediaStreamSource;
let worker;
let isRunning = false;

document.getElementById('btnIniciar').addEventListener('click', async () => {
    if (isRunning) return;

    try {
        // 1. Inicializar Web Worker
        worker = new Worker('audio.worker.js');
        
        worker.onmessage = function(event) {
            const { nota, frecuencia, escala } = event.data;
            document.getElementById('frecuencia').innerText = frecuencia.toFixed(2);
            document.getElementById('nota').innerText = nota;
            document.getElementById('escala').innerText = escala;
        };

        // 2. Configurar Web Audio API
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource.connect(analyser);

        isRunning = true;
        document.getElementById('btnIniciar').innerText = "Sistema Escuchando...";
        document.getElementById('btnIniciar').style.backgroundColor = "#28a745";

        // 3. Bucle de envío de datos al Web Worker
        analizarAudio();

    } catch (error) {
        console.error("Error al acceder al micrófono:", error);
        alert("No se pudo acceder al micrófono. Verifique los permisos.");
    }
});

function analizarAudio() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    function procesar() {
        if (!isRunning) return;
        
        analyser.getFloatTimeDomainData(dataArray);
        worker.postMessage({ buffer: dataArray, sampleRate: audioContext.sampleRate });

        requestAnimationFrame(procesar);
    }
    procesar();
}