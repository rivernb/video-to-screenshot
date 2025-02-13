// 获取 HTML 元素  
const videoUpload = document.getElementById('videoUpload');  
const videoPlayer = document.getElementById('videoPlayer');  
const startCapture = document.getElementById('startCapture');  
const frequencyInput = document.getElementById('frequency');  
const screenshots = document.getElementById('screenshots');  
const downloadAll = document.getElementById('downloadAll');  

let screenshotsData = []; // 存放截图的 Base64 数据  
let pixelDataList = [];  // 存放截图的像素数据（用于精确比较）  

// 上传视频并播放  
videoUpload.addEventListener('change', (event) => {  
  const file = event.target.files[0];  
  if (file) {  
    const videoURL = URL.createObjectURL(file);  
    videoPlayer.src = videoURL;  
    startCapture.disabled = false; // 激活截图按钮  
  }  
});  

// 开始批量截图  
startCapture.addEventListener('click', () => {  
  const frequency = parseFloat(frequencyInput.value); // 每隔几秒截图  
  if (isNaN(frequency) || frequency <= 0) {  
    alert('请输入有效的截图频率！');  
    return;  
  }  

  screenshotsData = []; // 清空之前的截图数据  
  pixelDataList = []; // 清空之前的像素数据  
  screenshots.innerHTML = ''; // 清空之前的截图展示  

  const duration = videoPlayer.duration; // 视频总时长  
  let currentTime = 0;  

  videoPlayer.pause(); // 暂停视频播放  
  const interval = setInterval(() => {  
    if (currentTime >= duration) {  
      clearInterval(interval); // 停止截图  
      alert('截图完成！');  
      downloadAll.disabled = false; // 激活批量下载按钮  
      return;  
    }  

    videoPlayer.currentTime = currentTime; // 设置视频时间点  
    videoPlayer.addEventListener(  
      'seeked',  
      () => {  
        captureFrame(); // 截取当前帧  
      },  
      { once: true }  
    );  

    currentTime += frequency; // 增加时间点  
  }, 500); // 每隔 500ms 处理一次  
});  

// 截取当前帧  
function captureFrame() {  
  const canvas = document.createElement('canvas');  
  const context = canvas.getContext('2d');  

  canvas.width = videoPlayer.videoWidth;  
  canvas.height = videoPlayer.videoHeight;  

  context.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);  

  const imgData = canvas.toDataURL('image/png');  
  const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;  

  if (!isDuplicate(pixelData)) {  
    screenshotsData.push(imgData);  
    pixelDataList.push(pixelData);  

    const img = document.createElement('img');  
    img.src = imgData;  
    screenshots.appendChild(img);  
  }  
}  

// 检测重复图片  
function isDuplicate(newPixelData) {  
  for (let i = 0; i < pixelDataList.length; i++) {  
    if (comparePixelData(pixelDataList[i], newPixelData)) {  
      return true; // 找到相似的截图  
    }  
  }  
  return false;  
}  

// 比较像素数据是否相似（降低精度）  
function comparePixelData(data1, data2, tolerance = 10, samplingRate = 4) {  
  if (data1.length !== data2.length) return false;  
  for (let i = 0; i < data1.length; i += samplingRate) {  
    if (Math.abs(data1[i] - data2[i]) > tolerance) {  
      return false; // 如果像素差异超过容差范围，则认为不相似  
    }  
  }  
  return true;  
}  

// 批量下载截图  
downloadAll.addEventListener('click', () => {  
  const zip = new JSZip();  
  const folder = zip.folder('screenshots'); // 创建文件夹  

  screenshotsData.forEach((imgData, index) => {  
    const base64Data = imgData.split(',')[1]; // 去掉前缀  
    folder.file(`screenshot-${index + 1}.png`, base64Data, { base64: true });  
  });  

  zip.generateAsync({ type: 'blob' }).then((content) => {  
    saveAs(content, 'screenshots.zip'); // 触发下载  
  });  
});