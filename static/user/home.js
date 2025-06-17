const socket = io();

const localVideo = document.getElementById('localVideo')
const newMeetingBtn = document.querySelector('.new-meeting')
const joinInput = document.querySelector('.join-input')
const joinBtn = document.querySelector('.join')
const meetingIdDisplay = document.getElementById('meeting-id')
const form = document.getElementById('chatForm')
const input = document.querySelector('.cust-input')
const messageArea = document.getElementById('message')
// const username = '<%=user%>'

let peerConnections = {}
let localStream
let roomId

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

async function startCamera() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
}

function stopCamera() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null
    }
    navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices after stop:', videoInputs);
    })
}

newMeetingBtn.onclick = async () => {
    try {
        roomId = Math.random().toString(36).substring(2, 8)
        await startCamera()
        meetingIdDisplay.textContent = `Meeting ID: ${roomId}`
        joinRoom(roomId, true)
        document.getElementById('hangupBtn').style.display = 'block'
        document.querySelector('.meeting-container').style.display = 'flex'
        document.querySelector('.logout').style.display = 'none'
        return
    } catch (error) {
        console.log(error, 'error in newMeeting')
        return
    }
};

joinBtn.onclick = async (e) => {
    document.getElementById('hangupBtn').style.display = 'block'
    document.querySelector('.meeting-container').style.display = 'flex'
    e.preventDefault();
    roomId = joinInput.value.trim();
    if (!roomId) return alert('Please enter a valid meeting ID')
    await startCamera();
    joinRoom(roomId, false);
};

function joinRoom(room, isCaller) {
    socket.emit('join', room);
    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        const trackToAdd = isScreenSharing && track.kind === 'video' ? screenStream.getVideoTracks()[0] : track
        peerConnection.addTrack(track, localStream);
    })

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { room, candidate: event.candidate });
        }
    };

    socket.on('all-users', async (users) => {
        for (let userId of users) {
            const pc = createPeerConnection(userId);
            peerConnections[userId] = pc;

            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('offer', { to: userId, from: socket.id, offer });
        }
    })

    socket.on('offer', async ({ from, offer }) => {
        const pc = createPeerConnection(from);
        peerConnections[from] = pc;

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', { to: from, from: socket.id, answer });
    })

    socket.on('answer', async ({ from, answer }) => {
        await peerConnections[from].setRemoteDescription(new RTCSessionDescription(answer));
    })

    socket.on('ice-candidate', async ({ from, candidate }) => {
        try {
            await peerConnections[from].addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ICE candidate', e);
        }
    })

    socket.on('user-left', (id) => {
        if (peerConnections[id]) {
            peerConnections[id].close();
            delete peerConnections[id];
        }
        const video = document.getElementById(id);
        if (video) {
            video.remove();
        }
    })
}

function createPeerConnection(userId) {
    const pc = new RTCPeerConnection(servers);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                to: userId,
                from: socket.id,
                candidate: event.candidate
            });
        }
    };

    pc.ontrack = (event) => {
        let video = document.getElementById(userId);
        if (!video) {
            video = document.createElement('video');
            video.id = userId;
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = event.streams[0];
            document.getElementById('participantGrid').appendChild(video);
        }
    };

    return pc;
}

const hangupBtn = document.getElementById('hangupBtn');

hangupBtn.onclick = () => {
    for (let id in peerConnections) {
        peerConnections[id].close();
        delete peerConnections[id];
        const video = document.getElementById(id);
        if (video) video.remove();
    }
    stopCamera()

    socket.emit('leave', { room: roomId, id: socket.id });
    meetingIdDisplay.textContent = '';
    hangupBtn.style.display = 'none';
    document.querySelector('.meeting-container').style.display = 'none'
    document.querySelector('.logout').style.display = 'block'
};

const videoClose = document.getElementById('videoClose')
let cameraOn = true

videoClose.onclick = async () => {
    if (cameraOn) {
        stopCamera();
        videoClose.innerHTML = '<i class="bi bi-camera-video-off"></i>';
    } else {
        await startCamera();
        videoClose.innerHTML = '<i class="bi bi-camera-video"></i>';
    }
    cameraOn = !cameraOn;
}


const micMute = document.getElementById('mute')

micMute.onclick = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        micMute.innerHTML = audioTrack.enabled
            ? '<i class="bi bi-mic"></i>'
            : '<i class="bi bi-mic-mute"></i>'
    }
}

const screenShareBtn = document.getElementById('screenShareBtn');
let isScreenSharing = false;
let screenStream;

screenShareBtn.onclick = async () => {
    if (!isScreenSharing) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            // Replace video track in each peer connection
            for (let id in peerConnections) {
                const sender = peerConnections[id]
                    .getSenders()
                    .find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            }
            // Replace local video feed
            localVideo.srcObject = screenStream;

            // When user stops screen share manually
            screenTrack.onended = () => {
                stopScreenSharing();
            };

            isScreenSharing = true;
            screenShareBtn.innerHTML = '<i class="bi bi-cast">';

            function getCurrentVideoTrack() {
                if (isScreenSharing && screenStream) {
                    return screenStream.getVideoTracks()[0];
                } else if (localStream) {
                    return localStream.getVideoTracks()[0];
                }
                return null;
            }

        } catch (err) {
            console.error('Error sharing screen:', err);
        }
    } else {
        stopScreenSharing();
    }
};

function stopScreenSharing() {
    if (!screenStream) return;

    const videoTrack = localStream.getVideoTracks()[0];

    for (let id in peerConnections) {
        const sender = peerConnections[id]
            .getSenders()
            .find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
    }

    function getCurrentVideoTrack() {
        if (isScreenSharing && screenStream) {
            return screenStream.getVideoTracks()[0];
        } else if (localStream) {
            return localStream.getVideoTracks()[0];
        }
        return null;
    }


    localVideo.srcObject = localStream;
    screenStream.getTracks().forEach(track => track.stop());
    isScreenSharing = false;
    screenShareBtn.innerHTML = '<i class="bi bi-cast">';
}

const toggleChatBtn = document.getElementById('toggleChatBtn');

toggleChatBtn.onclick = () => {
    const chatBox = document.querySelector('.chat-box')
    const isHidden = chatBox.classList.contains('d-none');
    chatBox.classList.toggle('d-none');
    toggleChatBtn.innerHTML = isHidden ? '<i class="bi bi-chat-left"></i>' : '<i class="bi bi-chat-left-text"></i>';
};


form.addEventListener('submit', (i) => {
    i.preventDefault()
    const message = input.value.trim()
    if (message) {
        socket.emit('chat', {
            user: username,
            text: message
        })
        input.value = ''
    }
})

socket.on('chat', (msg) => {
    const p = document.createElement('p')
    p.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`
    messageArea.appendChild(p)
    messageArea.scrollTop = messageArea.scrollHeight
})

