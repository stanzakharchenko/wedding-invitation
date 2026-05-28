const WAVE_CONFIG = {
  phrase: "запрошення на весілля",
  separator: "   ",
  height: 86,
  topOffset: 18,
  phraseWidth: 220,
  repeatExtra: 5
};

function setupTopWaveText() {
  const svg = document.getElementById("topWaveSvg");
  const path = document.getElementById("topWavePath");
  const textPath = document.getElementById("topWaveTextPath");

  if (!svg || !path || !textPath) return;

  function createIrregularWavePath(width) {
    const { topOffset } = WAVE_CONFIG;

    const points = [
      { x: 0, y: topOffset + 28 },
      { x: width * 0.22, y: topOffset + 10 },
      { x: width * 0.47, y: topOffset + 34 },
      { x: width * 0.72, y: topOffset + 14 },
      { x: width, y: topOffset + 30 }
    ];

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const distance = next.x - current.x;

      const cp1x = current.x + distance * 0.5;
      const cp1y = current.y;
      const cp2x = next.x - distance * 0.5;
      const cp2y = next.y;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return d;
  }

  function renderWave() {
    const width = svg.clientWidth || Math.min(window.innerWidth, 480);
    const height = WAVE_CONFIG.height;

    const repeatCount =
      Math.ceil(width / WAVE_CONFIG.phraseWidth) + WAVE_CONFIG.repeatExtra;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    path.setAttribute("d", createIrregularWavePath(width));

    textPath.textContent = Array(repeatCount)
      .fill(WAVE_CONFIG.phrase)
      .join(WAVE_CONFIG.separator);
  }

  renderWave();

  window.addEventListener("resize", renderWave);
}

function setupRsvpFlow() {
  const mainPage = document.getElementById("mobilePage");
  const rsvpSection = document.querySelector(".rsvp-section");
  const wishesSection = document.getElementById("wishesSection");

  const yesButton = document.getElementById("rsvpYesButton");
  const backButton = document.getElementById("wishesBackButton");
  const wishesForm = document.getElementById("wishesForm");

  if (!mainPage || !rsvpSection || !wishesSection || !yesButton || !backButton || !wishesForm) return;

  function openWishesScreen() {
    wishesSection.hidden = false;
    mainPage.classList.add("page--wishes-open");

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  }

  function closeWishesScreen() {
    mainPage.classList.remove("page--wishes-open");
    wishesSection.hidden = true;

    rsvpSection.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  }

  yesButton.addEventListener("click", openWishesScreen);
  backButton.addEventListener("click", closeWishesScreen);

  wishesForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(wishesForm);

    const responseData = {
      guestCount: formData.get("guestCount"),
      guestNames: formData.get("guestNames"),
      drinks: formData.getAll("drinks")
    };

    console.log("RSVP response:", responseData);
    localStorage.setItem("weddingRsvpResponse", JSON.stringify(responseData));

    alert("Дякуємо! Вашу відповідь збережено.");
    wishesForm.reset();
  });
}

document.addEventListener("DOMContentLoaded", setupRsvpFlow);

document.addEventListener("DOMContentLoaded", setupTopWaveText);