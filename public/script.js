const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const formattedResult = document.getElementById('formattedResult');
const saveButton = document.getElementById('saveButton');
const newTranscriptionButton = document.getElementById('newTranscriptionButton');


let mediaRecorder;
let audioChunks = [];
let uniqueId = ''; 

recordButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/ogg' }); // Record in OGG format

    mediaRecorder.start();
    recordButton.disabled = true;
    stopButton.disabled = false;

    mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
    });
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;

    mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
        audioChunks = [];
        // Create a File object with a proper filename and extension
        const audioFile = new File([audioBlob], 'recording.ogg', { type: 'audio/ogg' });

        const formData = new FormData();
        formData.append('audio', audioFile); // Append the File object


        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Display the transcription and formatted transcription
        formattedResult.textContent = result.formatted_transcription;

        // Store the unique ID for saving the corrected transcription
        uniqueId = result.unique_id;

        // Show the buttons for saving or starting a new transcription
        saveButton.style.display = 'block';
        newTranscriptionButton.style.display = 'block';
    });
});

// Save the corrected transcription
saveButton.addEventListener('click', async () => {
    const correctedText = formattedResult.textContent;

    const response = await fetch('/api/save-corrected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            unique_id: uniqueId,
            corrected_text: correctedText,
        }),
    });

    if (response.ok) {
        alert('Corrected transcription saved successfully!');
    } else {
        alert('Failed to save the corrected transcription.');
    }
});

// Start a new transcription
newTranscriptionButton.addEventListener('click', () => {
    location.reload(); // Refresh the page
});
