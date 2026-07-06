const canvas = document.querySelector("#inkCanvas");
const input = document.querySelector("#promptInput");
const replyText = document.querySelector("#replyText");
const statusText = document.querySelector("#status");
const sendBtn = document.querySelector("#sendBtn");
const clearBtn = document.querySelector("#clearBtn");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastPoint = null;
let writingTimer = null;

function setStatus(text) {
  statusText.textContent = text;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3d1713";
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure || 0.45
  };
}

function startDrawing(event) {
  if (event.pointerType === "mouse") return;
  drawing = true;
  lastPoint = pointFromEvent(event);
  canvas.setPointerCapture(event.pointerId);
}

function draw(event) {
  if (!drawing || !lastPoint) return;
  event.preventDefault();

  const nextPoint = pointFromEvent(event);
  const width = Math.max(1.7, Math.min(5.8, nextPoint.pressure * 7));

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.quadraticCurveTo(
    (lastPoint.x + nextPoint.x) / 2,
    (lastPoint.y + nextPoint.y) / 2,
    nextPoint.x,
    nextPoint.y
  );
  ctx.stroke();
  lastPoint = nextPoint;
}

function stopDrawing(event) {
  drawing = false;
  lastPoint = null;
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {}
}

function clearAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  input.value = "";
  replyText.textContent = "";
  replyText.classList.remove("writing");
  window.clearInterval(writingTimer);
  setStatus("Ready");
  input.focus();
}

function animateReply(text) {
  window.clearInterval(writingTimer);
  replyText.textContent = "";
  replyText.classList.add("writing");

  const chars = [...text];
  let index = 0;
  writingTimer = window.setInterval(() => {
    replyText.textContent += chars[index] || "";
    index += 1;
    if (index >= chars.length) {
      window.clearInterval(writingTimer);
      replyText.classList.remove("writing");
      setStatus("Answered");
    }
  }, 26);
}

async function askDiary() {
  const message = input.value.trim();
  if (!message) {
    setStatus("Write in the text area first");
    input.focus();
    return;
  }

  sendBtn.disabled = true;
  setStatus("Listening...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    setStatus("Writing...");
    animateReply(data.reply);
  } catch (error) {
    replyText.textContent = error instanceof Error ? error.message : "Something went wrong.";
    replyText.classList.remove("writing");
    setStatus("Error");
  } finally {
    sendBtn.disabled = false;
  }
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
sendBtn.addEventListener("click", askDiary);
clearBtn.addEventListener("click", clearAll);
input.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    askDiary();
  }
});

resizeCanvas();
input.focus();
