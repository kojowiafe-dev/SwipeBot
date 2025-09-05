export async function startConvAI({
  onAudioStream,
  onTranscript,
  model = "eleven_monolingual_v1",
  voiceId,
  getOfferSDP,
  sendAnswerSDP,
}) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  });

  // Speaker audio from remote track
  const remoteAudio = new Audio();
  remoteAudio.autoplay = true;
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    remoteAudio.srcObject = stream;
    onAudioStream?.(stream);
  };

  // Capture mic
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));

  // DataChannel (optional) to receive transcripts/messages
  const dc = pc.createDataChannel("transcript");
  dc.onmessage = (e) => {
    try {
      onTranscript?.(JSON.parse(e.data));
    } catch {
      /* noop */
    }
  };

  // Create offer and let the server talk to ElevenLabs (to attach auth)
  const offer = await pc.createOffer({ offerToReceiveAudio: true });
  await pc.setLocalDescription(offer);

  const answer = await getOfferSDP({ sdp: offer.sdp, model, voiceId });
  await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });

  // Return a handle to stop
  return {
    stop: () => {
      pc.getSenders().forEach((s) => s.track && s.track.stop());
      pc.close();
    },
  };
}
