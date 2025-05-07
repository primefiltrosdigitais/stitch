document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("camera");
  const captureBtn = document.getElementById("capture-btn");
  const flipCameraBtn = document.getElementById("flip-camera");

  const photoContainer = document.getElementById("photo-container");
  const capturedPhoto = document.getElementById("captured-photo");
  const overlay = document.getElementById("overlay");
  const frontOverlay = document.getElementById("front-overlay");

  let currentStream = null;
  let usingFrontCamera = true;
  let lastUsedCamera = "user";

  async function startCamera(facingMode = "user") {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      video.srcObject = currentStream;
      video.style.transform = facingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
      frontOverlay.style.display = "none";
      overlay.style.display = "block";
    } catch (error) {
      console.error("Erro ao acessar a câmera: ", error);
    }
  }

  flipCameraBtn.addEventListener("click", () => {
    usingFrontCamera = !usingFrontCamera;
    lastUsedCamera = usingFrontCamera ? "user" : "environment";
    startCamera(lastUsedCamera);
  });

  captureBtn.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const scale = Math.max(canvas.width / videoWidth, canvas.height / videoHeight);
    const offsetX = (canvas.width - videoWidth * scale) / 2;
    const offsetY = (canvas.height - videoHeight * scale) / 2;

    if (usingFrontCamera) {
      context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    } else {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }

    context.drawImage(video, 0, 0, videoWidth, videoHeight, offsetX, offsetY, videoWidth * scale, videoHeight * scale);

    if (usingFrontCamera) {
      context.drawImage(frontOverlay, 0, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(overlay, 0, 0, canvas.width, canvas.height);
    }

    capturedPhoto.src = canvas.toDataURL("image/png");
    photoContainer.style.display = "flex";
  });

  document.getElementById("retake-btn").addEventListener("click", () => {
    photoContainer.style.display = "none";
    startCamera(lastUsedCamera);
  });

  document.getElementById("save-btn").addEventListener("click", () => {
    // Verifica se a imagem foi capturada antes de tentar salvar
    if (capturedPhoto.src) {
      showSaveAlert(capturedPhoto.src);
    } else {
      console.log("Nenhuma imagem capturada.");
    }
  });

function showSaveAlert(imageSrc) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    // Exibe o alerta apenas no iOS
    if (localStorage.getItem('dontShowSaveAlert') === 'true') {
      return; // Não mostra o alerta se o usuário marcou "Não lembrar novamente"
    }

    const alertDiv = document.createElement('div');
    alertDiv.classList.add('save-alert');
    alertDiv.innerHTML = `
      <div class="alert-content">
        <p>Para salvar a imagem no iOS, segure na imagem.</p>
        <button id="ok-btn">OK</button>
        <button id="dont-remember-btn">Não lembrar novamente</button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    document.getElementById("ok-btn").addEventListener("click", () => {
      alertDiv.remove();
    });

    document.getElementById("dont-remember-btn").addEventListener("click", () => {
      localStorage.setItem('dontShowSaveAlert', 'true');
      alertDiv.remove();
    });

  } else if (isAndroid) {
    // Faz o download automaticamente no Android
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = "captured-image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}


  startCamera(lastUsedCamera);
});
