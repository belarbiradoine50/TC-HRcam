// script.js

// المراجع إلى عناصر DOM
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const authMessage = document.getElementById('authMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const videoElement = document.getElementById('videoStream');

let mediaRecorder;
let recordedChunks = [];

// تسجيل المستخدم الجديد
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    authMessage.innerText = 'تم التسجيل بنجاح. يمكنك تسجيل الدخول الآن.';
  } catch (error) {
    authMessage.innerText = `خطأ: ${error.message}`;
  }
});

// تسجيل الدخول
signInBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    authSection.style.display = 'none';
    dashboard.style.display = 'block';
    startVideoStream();
  } catch (error) {
    authMessage.innerText = `خطأ: ${error.message}`;
  }
});

// تشغيل فيديو البث المباشر
async function startVideoStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    // إعداد مسجل الفيديو
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      uploadRecording(blob);
      recordedChunks = [];
    };
  } catch (error) {
    console.error('خطأ في الوصول إلى الكاميرا:', error);
  }
}

// بدء التسجيل
startRecordingBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'inactive') {
    mediaRecorder.start();
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    document.getElementById('notification').innerText = 'التسجيل جارٍ...';
  }
});

// إيقاف التسجيل
stopRecordingBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    document.getElementById('notification').innerText = 'تم إيقاف التسجيل.';
  }
});

// رفع التسجيل إلى Firebase Storage
async function uploadRecording(blob) {
  const storageRef = firebase.storage().ref();
  const videoRef = storageRef.child(`recordings/${Date.now()}.webm`);
  await videoRef.put(blob);
  document.getElementById('notification').innerText = 'تم رفع التسجيل بنجاح.';
}
let lastFrame = null;

// اكتشاف الحركة من خلال مقارنة الإطارات
function detectMotion() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);

  if (lastFrame) {
    const motionDetected = hasMotion(lastFrame, currentFrame);
    if (motionDetected) {
      document.getElementById('notification').innerText = 'تم الكشف عن حركة!';
      sendAlert();  // استدعاء دالة إرسال التنبيه
    }
  }
  lastFrame = currentFrame;
}

// مقارنة بين الإطارات للبحث عن الحركة
function hasMotion(frame1, frame2) {
  let diff = 0;
  for (let i = 0; i < frame1.data.length; i += 4) {
    diff += Math.abs(frame1.data[i] - frame2.data[i]) +
            Math.abs(frame1.data[i + 1] - frame2.data[i + 1]) +
            Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);
  }
  return diff > 100000; // عتبة الحركة
}

// استدعاء دالة اكتشاف الحركة بانتظام
setInterval(detectMotion, 1000);

// إرسال تنبيه عبر البريد الإلكتروني عند اكتشاف الحركة
function sendAlert() {
  // يمكن استخدام خدمة خارجية مثل EmailJS لإرسال الإشعارات عبر البريد الإلكتروني
  console.log('إرسال تنبيه بالبريد الإلكتروني');
}

const recordingsList = document.getElementById('recordingsList');

// استرداد التسجيلات من Firebase Storage
async function loadRecordings() {
  const storageRef = firebase.storage().ref('recordings');
  const recordings = await storageRef.listAll();

  recordingsList.innerHTML = ''; // مسح القائمة الحالية
  recordings.items.forEach(async (itemRef) => {
    const url = await itemRef.getDownloadURL();
    const listItem = document.createElement('li');
    listItem.innerHTML = `<a href="${url}" target="_blank">تسجيل - ${itemRef.name}</a>`;
    recordingsList.appendChild(listItem);
  });
}

// تحميل السجل عند بدء التطبيق
loadRecordings();
function sendEmailAlert() {
  emailjs.init("user_id"); // استبدل بـ `user_id` الخاص بك

  const templateParams = {
    message: 'تم اكتشاف حركة في كاميرا المراقبة الخاصة بك!',
    to_email: 'user@example.com' // استبدل بالبريد الإلكتروني للمستخدم
  };

  emailjs.send("service_id", "template_id", templateParams)
    .then(() => {
      console.log('تم إرسال تنبيه بالبريد الإلكتروني');
    })
    .catch((error) => {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
    });
}
// تفعيل تأثير التحميل عند بدء البث
function startVideoStream() {
  document.getElementById('loading').style.display = 'block'; // إظهار رسالة التحميل
  // أكمل إعداد البث هنا

  videoElement.onloadeddata = function() {
    document.getElementById('loading').style.display = 'none'; // إخفاء رسالة التحميل
  };
}
// دالة لبدء البث التجريبي
function startDemoStream() {
    // إخفاء قسم التسجيل وعرض قسم البث المباشر
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // بدء البث من الكاميرا باستخدام WebRTC
    const videoElement = document.getElementById('videoStream');
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
            videoElement.srcObject = stream;
            videoElement.play();
        })
        .catch((error) => {
            console.error('خطأ في الوصول إلى الكاميرا:', error);
            alert('لا يمكن تشغيل الكاميرا. تأكد من إعطاء الإذن للوصول إلى الكاميرا.');
        });
}