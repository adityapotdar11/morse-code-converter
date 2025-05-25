const morseCodeMap = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    0: "-----",
    1: ".----",
    2: "..---",
    3: "...--",
    4: "....-",
    5: ".....",
    6: "-....",
    7: "--...",
    8: "---..",
    9: "----.",
    " ": "/",
    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "!": "-.-.--",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    _: "..--.-",
    '"': ".-..-.",
    $: "...-..-",
    "@": ".--.-.",
};

const reverseMorseCodeMap = Object.fromEntries(
    Object.entries(morseCodeMap).map(([k, v]) => [v, k])
);

let audioContext;
let oscillator;
let gainNode;
let isPlaying = false;
let currentType = null;
let timeoutId;

function initMorseTable() {
    const table = document.getElementById("morseTable");
    for (const [char, code] of Object.entries(morseCodeMap)) {
        const div = document.createElement("div");
        div.className = "morse-item";
        div.innerHTML = `<strong>${char}</strong><br>${code}`;
        table.appendChild(div);
    }
}

function textToMorse(text) {
    return text
        .toUpperCase()
        .split("")
        .map((char) => morseCodeMap[char] || "")
        .join(" ")
        .replace(/ \/ /g, "/");
}

function morseToText(morse) {
    return morse
        .split("/")
        .map((word) =>
            word
                .trim()
                .split(" ")
                .map((code) => reverseMorseCodeMap[code] || "")
                .join("")
        )
        .join(" ");
}

function handleTextInput(e) {
    const text = e.target.value;
    document.getElementById("morseInput").value = textToMorse(text);
}

function handleMorseInput(e) {
    const morse = e.target.value;
    document.getElementById("textInput").value = morseToText(morse);
}

function copyText(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand("copy");
    alert("Copied to clipboard!");
}

function toggleReference() {
    const ref = document.getElementById("referenceTable");
    const btn = document.querySelector(".toggle-btn");
    ref.classList.toggle("hidden");
    btn.textContent = ref.classList.contains("hidden")
        ? "Show Morse Code Reference"
        : "Hide Morse Code Reference";
}

function stopPlayback() {
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }
    if (timeoutId) clearTimeout(timeoutId);
    isPlaying = false;
    document.querySelectorAll(".play-btn").forEach((btn) => {
        btn.classList.remove("stop");
        btn.innerHTML = `<i data-feather="play"></i>`;
        feather.replace();
    });
}

async function togglePlay(type) {
    if (isPlaying && currentType === type) {
        stopPlayback();
        return;
    }

    if (isPlaying) {
        stopPlayback();
    }

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }

        currentType = type;
        isPlaying = true;
        const button = document.getElementById(
            `play${type.charAt(0).toUpperCase() + type.slice(1)}`
        );
        button.classList.add("stop");
        button.innerHTML = `<i data-feather="square"></i>`;
        feather.replace();

        const morse =
            type === "text"
                ? document.getElementById("textInput").value
                : document.getElementById("morseInput").value;

        const code = type === "text" ? textToMorse(morse) : morse;

        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        let time = audioContext.currentTime;
        const unitTime = 0.1;

        for (const char of code) {
            switch (char) {
                case ".":
                    gainNode.gain.setValueAtTime(1, time);
                    time += unitTime;
                    gainNode.gain.setValueAtTime(0, time);
                    time += unitTime;
                    break;
                case "-":
                    gainNode.gain.setValueAtTime(1, time);
                    time += unitTime * 3;
                    gainNode.gain.setValueAtTime(0, time);
                    time += unitTime;
                    break;
                case " ":
                    time += unitTime * 2;
                    break;
                case "/":
                    time += unitTime * 4;
                    break;
            }
        }

        oscillator.start();
        timeoutId = setTimeout(() => {
            stopPlayback();
        }, (time - audioContext.currentTime) * 1000);
    } catch (error) {
        console.error("Error playing morse code:", error);
        stopPlayback();
    }
}

document.getElementById("textInput").addEventListener("input", handleTextInput);
document
    .getElementById("morseInput")
    .addEventListener("input", handleMorseInput);
window.onload = initMorseTable;

feather.replace();
