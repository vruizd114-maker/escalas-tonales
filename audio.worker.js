onmessage = function(e) {
    const { buffer, sampleRate } = e.data;
    
    const frecuencia = autoconrelacionPitch(buffer, sampleRate);
    let nota = "Silencio / Indefinida";
    let escala = "Ninguna";

    if (frecuencia !== -1) {
        nota = frecuenciaANota(frecuencia);
        escala = determinarEscala(nota);
    }

    postMessage({ nota, frecuencia: frecuencia !== -1 ? frecuencia : 0, escala });
};

function autoconrelacionPitch(buffer, sampleRate) {
    const SIZE = buffer.length;
    let sumSqr = 0;
    for (let i = 0; i < SIZE; i++) {
        sumSqr += buffer[i] * buffer[i];
    }
    let rootMeanSquare = Math.sqrt(sumSqr / SIZE);
    if (rootMeanSquare < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < 0.2) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
    }

    buffer = buffer.slice(r1, r2);
    const c = new Array(buffer.length).fill(0);
    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < buffer.length - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buffer.length; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;
    return sampleRate / T0;
}

function frecuenciaANota(freq) {
    const noteNum = Math.round(12 * (Math.log2(freq / 440))) + 69;
    const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return notas[noteNum % 12];
}

function determinarEscala(notaBase) {
    return `Escala Mayor de ${notaBase} (${notaBase}, ${notaBase}M, etc.)`;
}