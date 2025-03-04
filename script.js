// 获取 HTML 元素  
const videoUpload = document.getElementById('videoUpload');  
const videoPlayer = document.getElementById('videoPlayer');  
const startCapture = document.getElementById('startCapture');  
const frequencyInput = document.getElementById('frequency');  
const screenshots = document.getElementById('screenshots');  
const saveSelected = document.getElementById('saveSelected');  

let screenshotsData = []; // 存放截图的 Base64 数据  
let pixelDataList = [];  // 存放已处理过的图片像素数据  

// 上传视频并播放  
videoUpload.addEventListener('change', (event) => {  
  const file = event.target.files[0];  
  if (file) {  
    const videoURL = URL.createObjectURL(file);  
    videoPlayer.src = videoURL;  
    startCapture.disabled = false; // 激活截图按钮  
  }  
});  

// 截图按钮点击事件  
startCapture.addEventListener('click', () => {  
  const frequency = parseFloat(frequencyInput.value);  
  if (!frequency || frequency <= 0) {  
    alert('请输入有效的截图频率！');  
    return;  
  }  

  screenshotsData = [];  
  pixelDataList = [];  
  screenshots.innerHTML = '';  
  saveSelected.disabled = true; // 禁用保存选中按钮  

  captureFrames(frequency);  
});  

// 截图功能  
function captureFrames(frequency) {  
  const duration = videoPlayer.duration;  
  let currentTime = 0;  

  videoPlayer.pause();  

  const interval = setInterval(() => {  
    if (currentTime >= duration) {  
      clearInterval(interval);  
      alert('截图完成！');  
      return;  
    }  

    videoPlayer.currentTime = currentTime;  
    videoPlayer.addEventListener(  
      'seeked',  
      () => captureFrame(),  
      { once: true }  
    );  

    currentTime += frequency;  
  }, 500); // 每 0.5 秒检查一次  
}  

function captureFrame() {  
  const canvas = document.createElement('canvas');  
  const context = canvas.getContext('2d');  
  canvas.width = videoPlayer.videoWidth;  
  canvas.height = videoPlayer.videoHeight;  

  context.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);  

  const imgData = canvas.toDataURL('image/png');  
  const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;  

  if (!isSignificantChange(pixelData)) {  
    return; // 如果帧差异不大，跳过保存该截图  
  }  

  screenshotsData.push(imgData);  
  pixelDataList.push(pixelData);  

  const screenshotItem = document.createElement('div');  
  screenshotItem.classList.add('screenshot-item');  

  const img = document.createElement('img');  
  img.src = imgData;  

  const checkbox = document.createElement('input');  
  checkbox.type = 'checkbox';  
  checkbox.classList.add('select-checkbox');  

  screenshotItem.appendChild(img);  
  screenshotItem.appendChild(checkbox);  
  screenshots.appendChild(screenshotItem);  

  saveSelected.disabled = false; // 激活保存选中按钮  
}  

// 判断截图是否有显著差异  
function isSignificantChange(newPixelData) {  
  const tolerance = 15; // 容差，单位：像素强度  
  const samplingRate = 4; // 采样率（每隔几个像素计算一次）  

  if (pixelDataList.length === 0) return true;  

  const lastPixelData = pixelDataList[pixelDataList.length - 1];  

  let totalDiff = 0;  
  for (let i = 0; i < newPixelData.length; i += samplingRate) {  
    totalDiff += Math.abs(newPixelData[i] - lastPixelData[i]);  
    if (totalDiff > tolerance) {  
      return true;  
    }  
  }  
  return false; // 如果差异过小，认为是重复的帧  
}  

// 保存选中的截图  
saveSelected.addEventListener('click', () => {  
  const selectedScreenshots = [];  
  document.querySelectorAll('.screenshot-item').forEach((item, index) => {  
    const checkbox = item.querySelector('.select-checkbox');  
    if (checkbox.checked) {  
      selectedScreenshots.push(screenshotsData[index]);  
    }  
  });  

  if (selectedScreenshots.length === 0) {  
    alert('请选择要保存的截图！');  
    return;  
  }  

  const zip = new JSZip();  
  const folder = zip.folder('selected-screenshots'); // 创建文件夹  

  selectedScreenshots.forEach((imgData, index) => {  
    const base64Data = imgData.split(',')[1];  
    folder.file(`screenshot-${index + 1}.png`, base64Data, { base64: true });  
  });  

  zip.generateAsync({ type: 'blob' }).then((content) => {  
    saveAs(content, 'selected-screenshots.zip');  
  });  
});
