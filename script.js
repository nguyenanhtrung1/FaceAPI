const video = document.getElementById('video')

Promise.all([
  faceapi.nets.ageGenderNet.loadFromUri("https://nguyenanhtrung1.github.io/CheckFace/models/age_gender_model-weights_manifest.json"),
		faceapi.nets.ssdMobilenetv1.loadFromUri("https://nguyenanhtrung1.github.io/CheckFace/models/ssd_mobilenetv1_model-weights_manifest.json"),
		faceapi.nets.tinyFaceDetector.loadFromUri('https://nguyenanhtrung1.github.io/CheckFace/models/tiny_face_detector_model-weights_manifest.json'),
		faceapi.nets.faceLandmark68Net.loadFromUri('https://nguyenanhtrung1.github.io/CheckFace/models/face_landmark_68_model-weights_manifest.json'),
		faceapi.nets.faceRecognitionNet.loadFromUri('https://nguyenanhtrung1.github.io/CheckFace/models/face_recognition_model-weights_manifest.json'),
		faceapi.nets.faceExpressionNet.loadFromUri('https://nguyenanhtrung1.github.io/CheckFace/models/face_expression_model-weights_manifest.json')
]).then(startWebcam)

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
function getLabeledFaceDescriptions() {
  const labels = ["dat", "trung","sếp"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/nguyenanhtrung1/FACEAPI/main/labels/${label}/${i}.jpg`);
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
const faceDetections = {};

video.addEventListener('play',async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  const canvas = faceapi.createCanvasFromMedia(video, {
    willReadFrequently: true,
  });
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions()
    .withFaceDescriptors()
    .withAgeAndGender()

    // let isFaceDetected = true;

    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d',{ willReadFrequently: true }).clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    // console.log(resizedDetections); 
    
    resizedDetections.forEach(result => {
      const {age, gender} = result;
      const genderText = gender === "male" ? "giới tính Nam" : "giới tính Nữ";
      new faceapi.draw.DrawTextField ([
          `${Math.round(age,0)} Tuổi`,
          `${genderText}`
      ],
      result.detection.box.bottomRight
      ).draw(canvas);
    })
    
    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    for (const detection of resizedDetections) {
      const faceID = detection.detection.faceId;
      if (!faceDetections[faceID]) {
        faceDetections[faceID] = {
          entryTime: new Date().getTime(),
          label: results[resizedDetections.indexOf(detection)],
        };
        console.log(`Khuôn mặt ${faceDetections[faceID].label} được nhận diện vào ${new Date().toLocaleString()}`);
        console.log(new Date().getTime())
        console.log(resizedDetections.indexOf(detection))
      }
    }
    // for(const detection of resizedDetections){
    //   const faceID = detection.faceId;
    //   if(!faceDetections[faceID]){
    //     faceDetections[faceID]={
    //       entryTime : new Date().getTime(),
    //       label: results[resizedDetections.indexOf(detection)]
    //     }
    //   }
    // }
    // if (resizedDetections.length === 0) {
    //   // Nếu không phát hiện được khuôn mặt nào, thì trạng thái nhận diện khuôn mặt là không được nhận diện
    //   isFaceDetected = false;
    // }
    // // Nếu trạng thái nhận diện khuôn mặt là không được nhận diện, thì in ra thông báo
    // if (!isFaceDetected) {
    //   console.log(`Khuôn mặt rời khỏi khung hình `);
      
    // }
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
      drawBox.draw(canvas);
    });
  }, 1000)
})

// video.addEventListener("play", async () => {
//   const labeledFaceDescriptors = await getLabeledFaceDescriptions();
//   const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

//   const canvas = faceapi.createCanvasFromMedia(video);
//   canvas.willReadFrequently = "true";
//   document.body.append(canvas);

//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     const resizedDetections = faceapi.resizeResults(detections, displaySize);

//     canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // const results = resizedDetections.map((d) => {
    //   return faceMatcher.findBestMatch(d.descriptor);
    // });

//     results.forEach((result, i) => {
//       const box = resizedDetections[i].detection.box;
//       const drawBox = new faceapi.draw.DrawBox(box, {
//         label: result,
//       });
//       drawBox.draw(canvas);
//     });
//   }, 1000);
// });
// for (const detection of resizedDetections) {
    //   const faceID = detection.detection.faceId;
    //   if (!faceDetections[faceID]) {
    //     faceDetections[faceID] = {
    //       entryTime: new Date().getTime(),
    //       label: results[resizedDetections.indexOf(detection)],
    //     };
    //     console.log(`Face ${faceDetections[faceID].label} detected at ${new Date().toLocaleString()}`);
    //   }
      
    // }
// if (faceDetections[faceID]) {
      //   const exitTime = new Date().getTime();
      //   const entryTime = faceDetections[faceID].entryTime;
      //   const timeSpent = exitTime - entryTime;
      //   console.log(`Face ${faceDetections[faceID].label} exited frame at ${new Date().toLocaleString()}`); 
      //   console.log(`Time spent in frame: ${timeSpent} milliseconds`);
        
      // }
      