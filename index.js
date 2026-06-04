const display = document.getElementById('display');
const zoomBtn = document.getElementById('zoom-btn');
const circleZoomBtn = document.getElementById('circle-zoom-btn');
const videoFeed = document.getElementById('video-feed');
const cameraViewport = document.getElementById('viewport');
const reticleElem = document.getElementById('reticle-elem');
const reticleZoomLens = document.getElementById('reticle-zoom-lens');
const waveElement = document.getElementById('wave-element');
const hud = document.getElementById('hud');
const recBtn = document.getElementById('rec-btn');
const recordingTag = document.getElementById('recording-tag');
const mainGridButtons = document.querySelectorAll('.main-grid');

let isSystemOnline = true;
let zoomLevels = [1, 2, 4, 8];
let currentZoomIndex = 0;
let isCircleZoomActive = false;
let streamInstance = null;

// Audio + Video Capture Variables
let mediaRecorderInstance = null;
let recordedChunksList = [];
let isRecordingRunning = false;

function handlePointerMove(clientX, clientY) {
    if (!isSystemOnline || !isCircleZoomActive) return;
    const rect = cameraViewport.getBoundingClientRect();
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    reticleElem.style.left = `${x}px`;
    reticleElem.style.top = `${y}px`;

    reticleZoomLens.style.width = `${rect.width}px`;
    reticleZoomLens.style.height = `${rect.height}px`;
    
    // Exact center scaling offsets for the updated 80px target cube bounds
    let offsetX = -x + 40; 
    let offsetY = -y + 40; 
    
    reticleZoomLens.style.left = `${offsetX}px`;
    reticleZoomLens.style.top = `${offsetY}px`;

    if (zoomLevels[currentZoomIndex] !== 1) {
        videoFeed.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
    }
}

cameraViewport.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
cameraViewport.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

function toggleCircleZoom() {
    if (!isSystemOnline) return;
    isCircleZoomActive = !isCircleZoomActive;
    
    if (isCircleZoomActive) {
        reticleElem.style.display = "block";
        circleZoomBtn.innerText = "ZOOM BOX: ON";
        circleZoomBtn.style.background = "#00e5ff";
        circleZoomBtn.style.color = "#05070a";
        display.innerHTML = `
            <div>&gt; TARGET CUBE TRACKING: <span style="color: #00e5ff;">ENABLED</span></div>
            <div style="color: #8b949e;">&gt; DRAG TARGET CUBE WIREFRAME AROUND SCREEN SURFACE.</div>
        `;
    } else {
        reticleElem.style.display = "none";
        circleZoomBtn.innerText = "ZOOM BOX: OFF";
        circleZoomBtn.style.background = "rgba(0, 229, 255, 0.04)";
        circleZoomBtn.style.color = "#00e5ff";
        display.innerHTML = `
            <div>&gt; TARGET CUBE TRACKING: <span style="color: #8b949e;">DISABLED</span></div>
        `;
    }
}

async function startCamera() {
    try {
        // Explicitly requesting environment camera stream and audio system track links
        streamInstance = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, 
            audio: true 
        });
        videoFeed.srcObject = streamInstance;
        reticleZoomLens.srcObject = streamInstance;
    } catch (err) {
        display.innerHTML = `<div style="color: #ff5555;">&gt; OPTIC/AUDIO LINK DENIED: ALLOW SYSTEM PERMISSIONS</div>`;
    }
}

function stopCamera() {
    if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
    }
    videoFeed.srcObject = null;
    reticleZoomLens.srcObject = null;
}

// REALTIME MULTIMEDIA REC ENGINE TRACKING
function toggleRecording() {
    if (!isSystemOnline || !streamInstance) return;

    if (!isRecordingRunning) {
        // Start capture cycle
        recordedChunksList = [];
        
        // Setup Media Recorder interface to capture everything from stream pipeline 
        try {
            mediaRecorderInstance = new MediaRecorder(streamInstance, { mimeType: 'video/webm;codecs=vp8,opus' });
        } catch(e) {
            mediaRecorderInstance = new MediaRecorder(streamInstance); // Fallback configuration 
        }

        mediaRecorderInstance.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunksList.push(event.data);
            }
        };

        mediaRecorderInstance.onstop = () => {
            // Compile binary chunks list into direct device download download package format
            const blobPackage = new Blob(recordedChunksList, { type: 'video/webm' });
            const urlPath = URL.createObjectURL(blobPackage);
            
            // Generate clean automated download click anchor target
            const downloadLinkAnchor = document.createElement('a');
            downloadLinkAnchor.href = urlPath;
            downloadLinkAnchor.download = `3D_MATRIX_SCAN_${Date.now()}.webm`;
            document.body.appendChild(downloadLinkAnchor);
            downloadLinkAnchor.click();
            
            // Complete memory management cleanup cycle
            setTimeout(() => {
                document.body.removeChild(downloadLinkAnchor);
                window.URL.revokeObjectURL(urlPath);
            }, 100);
        };

        mediaRecorderInstance.start(10); // Capture chunk clips arrays securely every 10ms
        isRecordingRunning = true;
        
        // UI Notification changes
        recBtn.style.background = "#ff5555";
        recBtn.style.color = "#05070a";
        recBtn.innerText = "STOP";
        recordingTag.innerHTML = "● REC (AUDIO + VIDEO)";
        recordingTag.style.color = "#ff5555";
        display.innerHTML = `<div>&gt; RECORDING PIPELINE: <span style="color:#ff5555;">LIVE_</span></div><div style="color:#8b949e;">&gt; SAVING INTERFACE METADATA + MIC INPUT IN REALTIME.</div>`;
    } else {
        // Stop recording run and spark download trigger logic execution hook
        mediaRecorderInstance.stop();
        isRecordingRunning = false;
        
        // Return styles securely back to ready dashboard indicators
        recBtn.style.background = "rgba(0, 229, 255, 0.04)";
        recBtn.style.color = "#ff5555";
        recBtn.innerText = "REC";
        recordingTag.innerHTML = "• 3D HYBRID MATRIX";
        recordingTag.style.color = "#00e5ff";
        display.innerHTML = `<div>&gt; RECORDING OVER. <span style="color:#00ffaa;">FILE DOWNLOAD COMPILED successfully.</span></div>`;
    }
}

function triggerZoom() {
    if (!isSystemOnline) return;
    currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
    let targetZoom = zoomLevels[currentZoomIndex];
    videoFeed.style.transform = `scale(${targetZoom})`;
    zoomBtn.innerText = `ZOOM ${targetZoom}X`;
}

function togglePower(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    isSystemOnline = !isSystemOnline;
    const powerBtn = document.getElementById('power-toggle');
    
    if (isRecordingRunning) toggleRecording(); // Terminate capturing routines immediately if system is cut
    
    if (!isSystemOnline) {
        hud.classList.add('offline');
        stopCamera();
        reticleElem.style.display = "none";
        waveElement.style.display = "none";
        mainGridButtons.forEach(btn => btn.disabled = true);
        circleZoomBtn.disabled = true;
        zoomBtn.disabled = true;
        recBtn.disabled = true;
        powerBtn.innerText = "START SYSTEM";
        display.innerHTML = `<div style="color: #ff5555;">&gt; SYSTEM OFFLINE. OPTIC LINK SEVERED.</div>`;
    } else {
        hud.classList.remove('offline');
        startCamera();
        if (isCircleZoomActive) reticleElem.style.display = "block";
        waveElement.style.display = "block";
        mainGridButtons.forEach(btn => btn.disabled = false);
        circleZoomBtn.disabled = false;
        zoomBtn.disabled = false;
        recBtn.disabled = false;
        powerBtn.innerText = "STOP SYSTEM";
        display.innerHTML = `<div>&gt; CORES ACTIVE. OPTICAL STREAM SECURED.</div>`;
    }
}

function tapBtn(name, colorHex) {
    if (!isSystemOnline) return;
    display.innerHTML = `<div>&gt; COMMAND: <span style="color: ${colorHex}">${name}</span></div><div style="color: #00e5ff;">&gt; CODES CONFIRMED.</div>`;
}

startCamera();
