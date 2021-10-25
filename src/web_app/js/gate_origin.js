let rtcPeerConnection2 = null;
let localVideo = document.getElementById("local-video")



function onAddStream(event) {
  console.log("RTC::ontrack called", event)
  //mobileVideo.srcObject = event.streams[0]
  //mobileStream = event.streams[0]

  var mixer = new MultiStreamsMixer([event.streams[0], localStream]);
  //console.log(mixer.getMixedStream());
  localStream = mixer.getMixedStream();
  mixer.startDrawingFrames();
  console.log(localStream)
  localVideo.srcObject = localStream;
}

function onIceCandidate(event) {
  if (event.candidate) { //이벤트가 실제로 candidate인지?
      console.log("RTC::socket emit icecandidate", event.candidate)

      socket.emit('candidate', {
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
        room: window.gateRoomNumber
    })
      
  } else {
      console.log("RTC::end of candidate")
  }
}

/*socket.on('created', room => {
  console.log("RTC::room has been created");
  console.log(window)
  console.log(window.gateRoomNumber)
  console.log(room);
})*/

var globalResolveForGetUserMedia;
var get_stream = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

// console.log("navigator : ", navigator.mediaDevices.getUserMedia);
// console.log("get_stream : ", get_stream);
function doSomething(constraints) {
  // do something else;

  var fullCanvasStream = new MediaStream();
  var clonedCamera2 = new MediaStream();
  var mixer;

  get_stream(constraints).
  catch(function(error) {
    console.log("!!smh failure");
  }).
  then(function(stream1){
    stream1.getTracks().forEach(function(track) {
      //fullCanvasStream.addTrack(track);
      localStream = stream1;
      let iceServers = {
        'iceServers': [
          {'urls': 'stun:stun.services.mozilla.com'}, //개발용 free server
          {'urls': 'stun:stun.l.google.com:19302'},
          // TURN 먼저 STUN 나중
          /*{
            urls: 'turn:css1.yonsei.ac.kr:9110',
            credential: 'cumulus',
            username: 'cumulus'
          },
          {
            urls: 'turn:css1.yonsei.ac.kr:9111',
            credential: 'cumulus',
            username: 'cumulus'
          },
          {
            urls: 'stun:css1.yonsei.ac.kr:9110'
          },
          {
            urls: 'stun:css1.yonsei.ac.kr:9111'
          },
          {
            urls: 'stun:stun.l.google.com:19302'
          }*/
        ]
      };
    
      rtcPeerConnection2 = new RTCPeerConnection(iceServers);
      console.log("STATE::RTCPeerConnection created", rtcPeerConnection2.signalingState)
      rtcPeerConnection2.addTrack(localStream.getTracks()[0], localStream); //비디오 트랙
      window.gateRoomNumber = '11';
      socket.emit('create or join', window.gateRoomNumber);
        //var url = "http://localhost:3000/g/";
        var url = "https://css4.yonsei.ac.kr:7777/g/";
        alert(url + "1" + "/" + "1" + " 로 접속하세요.");
    });

    fullCanvasStream.fullcanvas = true;
    fullCanvasStream.width = screen.width; // or 3840
    fullCanvasStream.height = screen.height; // or 2160 

    fullCanvasRenderHandler(fullCanvasStream, 'stream1');
    console.log("!!!first stream finish");
    console.log("!!smh success");

    /*get_stream(constraints)
    .catch(function(error) {
      console.log("!!smh failure");
    })
    .then(function(stream2)
    {
      // phone
      stream2.getTracks().forEach(function(track) {
        clonedCamera2.addTrack(track);
      });
  
      clonedCamera2.width = parseInt((30 / 100) * fullCanvasStream.width);
      clonedCamera2.height = parseInt((30 / 100) * fullCanvasStream.height);
      clonedCamera2.top = fullCanvasStream.height - clonedCamera2.height;
      clonedCamera2.left = fullCanvasStream.width - (clonedCamera2.width * 2);

      normalVideoRenderHandler(clonedCamera2, 'Someone');
      
      console.log("!!!second stream finish");
      mixer = new MultiStreamsMixer([fullCanvasStream, clonedCamera2]);
      mixer.frameInterval = 1;
      mixer.startDrawingFrames();

      globalResolveForGetUserMedia(mixer.getMixedStream());
    });*/
  });
  //
}

/*
getUserMedia는 promise를 return한다.
이 Promise는 말 그대로 비동기 작업으로써, 진행되어야 할 일더미를 던져주는 것
다 실행될때까지 기다리고 없을 수는 없으니
--- Javascript는 Single Thread이므로 계속해서 기다릴 수 없고 저런 비동기 작업들은
브라우저의 background에서 돌아가게 된다.
우리는 thisPromise만 return해준 것이고, 현재 pending 상태인 채로 기다리고 있을 것이다.

promise의 resolve는 성공이 되었을 때 return할 부분을 지정해준다.
원래 getUserMedia의 경우 resolve(stream)이런식으로 되어 있었을 것이다.
하지만, 여기서는 다른 방식을 사용
먼저 globalResolveForGetUserMedia = resolve를 통해서 global resolve로 만들어 줌 (이게 핵심!)
그 다음, 쭉 원하는 작업을 다 한 후, globalResolveForgetUserMedia(stream)을 해주어
pending -> fulfilled로 만들어주는 것.
*/
navigator.mediaDevices.getUserMedia = function(constraints) 
{
  let thisPromise = new Promise((resolve, reject) => {
    globalResolveForGetUserMedia = resolve;
    // mixer = new MultiStreamsMixer([stream1, stream2]);
    // mixer.frameInterval = 1;
    // mixer.startDrawingFrames();
    // mixer.getMixedStream() = resolve;
  });

  // do something asynchronously
  doSomething(constraints); // do something 안에서 stream을 가져오고, 마지막에 globalResolveForGetUserMedia 실행
  return thisPromise;
}

socket.on('joined', room => {
  console.log("RTC::joined")
  if (room == window.gateRoomNumber) console.log("RTC::remote device has joined the room")

  /*let iceServers = {
    'iceServers': [
      {'urls': 'stun:stun.services.mozilla.com'}, //개발용 free server
      {'urls': 'stun:stun.l.google.com:19302'},
      // TURN 먼저 STUN 나중
      {
        urls: 'turn:css1.yonsei.ac.kr:9110',
        credential: 'cumulus',
        username: 'cumulus'
      },
      {
        urls: 'turn:css1.yonsei.ac.kr:9111',
        credential: 'cumulus',
        username: 'cumulus'
      },
      {
        urls: 'stun:css1.yonsei.ac.kr:9110'
      },
      {
        urls: 'stun:css1.yonsei.ac.kr:9111'
      },
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  };

  rtcPeerConnection2 = new RTCPeerConnection(iceServers);
  console.log("STATE::RTCPeerConnection created", rtcPeerConnection2.signalingState)*/
  rtcPeerConnection2.ontrack = onAddStream;
  rtcPeerConnection2.onicecandidate = onIceCandidate;
  //console.log(localStream)
  //rtcPeerConnection2.addTrack(localStream.getTracks()[0], localStream); //비디오 트랙

  var mediaConstraints = {
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    },
    optional: []
  };
  rtcPeerConnection2.createOffer(mediaConstraints)
    .then(sessionDescription => rtcPeerConnection2.setLocalDescription(sessionDescription))
    .then(() => {
      console.log("STATE::setLocalDescription", rtcPeerConnection2.signalingState)
      console.log(rtcPeerConnection2)

      socket.emit('offer', {
        type: "offer",
        sdp: rtcPeerConnection2.localDescription,
        room: window.gateRoomNumber
      })
      console.log("RTC::sent offer")
    })
    .catch(err => {
      console.log(err)
  })

})

socket.on('answer', event => {
  rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(event))
    .then(()=> {
      console.log("RTC::recieved answer and setRemoteDescription", rtcPeerConnection2.signalingState)
    })
})

socket.on('candidate', event => {
  const candidate = new RTCIceCandidate({
      sdpMLineIndex: event.label,
      candidate: event.candidate
  })
  rtcPeerConnection2.addIceCandidate(candidate)
})

/*socket.on('response', (res) => {
  console.log("RTC::got response", res);
})

socket.on('message', (msg) => {
  console.log("RTC::got message", msg)
  if (msg.from == gateRoomNumber + 'r' && msg.type == 'answer') {
    console.log("RTC::got answer")
    rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(msg.message), function() {
      console.log("STATE::setRemoteDescription", rtcPeerConnection2.signalingState)
    });
  }
  if (msg.type == 'candidate') {
    msg = msg.message;
    console.log("RTC::got candidate")
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: msg.label,
        candidate: msg.candidate
    })
    rtcPeerConnection2.addIceCandidate(candidate)
  }
})*/

//
