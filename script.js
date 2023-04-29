
const video = document.getElementById("video");
const loginBox=document.getElementById("loginBox");
const message=document.getElementById("result");
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}
let nameOfUser;
function getLabeledFaceDescriptions() {
  const labels = ["irfan", "Thor", "Captain America"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`/labeled-image/${label}/${i}.jpg`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
    
     nameOfUser =drawBox.options.label._label
    setTimeout(() => {
      try{  
        if(nameOfUser=="unknown")
        {
          loginBox.style.display = 'none';
          message.innerHTML=` <p> Sorry You are known for me </p> <h1>Login Failed </h1>`
        }
        else{
          loginBox.style.display = 'none';
          message.innerHTML=`<p> Welcome ${nameOfUser} , you are </p> <h1>Successfully Logined </h1>`;
        }
      }catch(err){
        
        let s = document.createElement('div');
        s.style.color = 'red';
        s.innerText="can't recognized try one more time";
        loginBox.append(s);
      }
    }, 2000);
    });
  }, 100);
});


