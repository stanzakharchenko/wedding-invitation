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

function getGuestIdFromUrl() {
  return new URLSearchParams(window.location.search).get("guest");
}

function getGuestPronouns(guestCount) {
  const isPlural = Number(guestCount) > 1;

  return {
    invite: isPlural ? "вас" : "тебе",
    with: isPlural ? "вами" : "тобою",
    confirm: isPlural ? "підтвердіть" : "підтверди"
  };
}

let ACTIVE_GUEST = null;

function applyGuestData(guest) {
  ACTIVE_GUEST = guest;

  const inviteNameElement = document.getElementById("inviteName");
  const invitePronounElement = document.getElementById("invitePronoun");
  const detailsWithPronounElement = document.getElementById("detailsWithPronoun");
  const detailsConfirmVerbElement = document.getElementById("detailsConfirmVerb");

  const guestCountInput = document.getElementById("guestCount");
  const guestNamesInput = document.getElementById("guestNames");

  const invitedGuestCount = Number(guest.invitedGuestCount || 1);
  const invitedGuestNames = String(
    guest.invitedGuestNames ||
    guest.allowedGuestNames ||
    ""
  ).trim();

  const responseGuestCount = Number(guest.responseGuestCount || 0);
  const responseGuestNames = String(guest.responseGuestNames || "").trim();

  const inviteDisplayName = String(
    guest.inviteName ||
    invitedGuestNames ||
    "{name}"
  ).trim();

  const pronouns = getGuestPronouns(invitedGuestCount);

  if (inviteNameElement) {
    inviteNameElement.textContent = inviteDisplayName;
  }

  if (invitePronounElement) {
    invitePronounElement.textContent = pronouns.invite;
  }

  if (detailsWithPronounElement) {
    detailsWithPronounElement.textContent = pronouns.with;
  }

  if (detailsConfirmVerbElement) {
    detailsConfirmVerbElement.textContent = pronouns.confirm;
  }

  if (guestCountInput) {
    const maxGuestCount = String(
      guest.maxGuestCount ||
      guest.invitedGuestCount ||
      invitedGuestCount
    );

    guestCountInput.value = responseGuestCount || invitedGuestCount;
    guestCountInput.placeholder = String(invitedGuestCount);
    guestCountInput.min = "1";
    guestCountInput.max = maxGuestCount;
  }

  if (guestNamesInput) {
    guestNamesInput.value = responseGuestNames || invitedGuestNames;
    guestNamesInput.placeholder = invitedGuestNames || "Імена гостей";
  }
}

function getMaxGuestCount() {
  return Number(ACTIVE_GUEST?.maxGuestCount || ACTIVE_GUEST?.invitedGuestCount || 1);
}

function normalizeName(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseGuestNames(value) {
  const rawValue = String(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!rawValue) return [];

  if (rawValue.includes(",")) {
    return rawValue
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  const allowedNames = getAllowedGuestNames();

  if (!allowedNames.length) {
    return rawValue.split(" ").filter(Boolean);
  }

  const normalizedValue = normalizeName(rawValue);
  const selectedNames = [];

  allowedNames.forEach((name) => {
    const normalizedAllowedName = normalizeName(name);

    const pattern = new RegExp(
      `(^|\\s)${normalizedAllowedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
      "i"
    );

    if (pattern.test(normalizedValue)) {
      selectedNames.push(name);
    }
  });

  return selectedNames;
}

function formatGuestNamesInput(value) {
  return parseGuestNames(value).join(", ");
}

function getAllowedGuestNames() {
  const rawNames = String(
    ACTIVE_GUEST?.allowedGuestNames ||
    ACTIVE_GUEST?.invitedGuestNames ||
    ACTIVE_GUEST?.inviteName ||
    ""
  );

  return rawNames
    .replace(/\s+та\s+/gi, ",")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function sanitizeGuestNamesInput(value) {
  return String(value)
    .replace(/[^А-Яа-яІіЇїЄєҐґ'’ʼ,\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/,+/g, ",");
}

function validateGuestForm(formData) {
  const maxGuestCount = getMaxGuestCount();

  const guestCount = Number(formData.get("guestCount"));
  const guestNames = String(formData.get("guestNames") || "").trim();

  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > maxGuestCount) {
    return `Кількість гостей має бути від 1 до ${maxGuestCount}.`;
  }

  const selectedNames = parseGuestNames(guestNames);
  const allowedNames = getAllowedGuestNames();

  if (selectedNames.length !== guestCount) {
    return "Кількість імен має відповідати кількості гостей.";
  }

  const normalizedAllowedNames = allowedNames.map(normalizeName);

  const hasUnknownName = selectedNames.some((name) => {
    return !normalizedAllowedNames.includes(normalizeName(name));
  });

  if (hasUnknownName) {
    return `Можна вказати тільки гостей із запрошення: ${allowedNames.join(", ")}.`;
  }

  return null;
}

async function loadGuestData() {
  const guestId = getGuestIdFromUrl();

  if (!guestId || !CONFIG.googleScriptUrl) {
    return null;
  }

  try {
    const response = await fetch(
      `${CONFIG.googleScriptUrl}?guestId=${encodeURIComponent(guestId)}`
    );

    const data = await response.json();

    if (!data.ok || !data.guest) {
      console.warn("Guest not found:", data.error);
      return null;
    }

    applyGuestData(data.guest);
    return data.guest;
  } catch (error) {
    console.error("Failed to load guest data:", error);
    return null;
  }
}

async function submitGuestResponse(payload) {
  if (!CONFIG.googleScriptUrl) {
    return;
  }

  const response = await fetch(CONFIG.googleScriptUrl, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!data.ok) {
    const error = new Error(data.error || "Failed to submit RSVP");
    error.responseData = data;
    throw error;
  }
}

function setButtonLoading(button, isLoading, loadingText = "Надсилаємо") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent.trim();
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("is-loading");
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
  button.classList.remove("is-loading");
}

function setupRsvpFlow() {
  const mainPage = document.getElementById("mobilePage");
  const rsvpSection = document.querySelector(".rsvp-section");
  const wishesSection = document.getElementById("wishesSection");
  const countdownSection = document.getElementById("countdownSection");
  const declineCheckSection = document.getElementById("declineCheckSection");
  const declineFinalSection = document.getElementById("declineFinalSection");

  const yesButton = document.getElementById("rsvpYesButton");
  const noButton = document.getElementById("rsvpNoButton");
  const backButton = document.getElementById("wishesBackButton");
  const wishesForm = document.getElementById("wishesForm");

  const declineConfirmButton = document.getElementById("declineConfirmButton");
  const declineChangeButton = document.getElementById("declineChangeButton");

  const guestId = getGuestIdFromUrl() || "default";

  const RSVP_COMPLETED_KEY = `weddingRsvpCompleted:${guestId}`;
  const RSVP_RESPONSE_KEY = `weddingRsvpResponse:${guestId}`;
  const RSVP_DECLINED_KEY = `weddingRsvpDeclined:${guestId}`;

  if (new URLSearchParams(window.location.search).has("resetRsvp")) {
    localStorage.removeItem(RSVP_COMPLETED_KEY);
    localStorage.removeItem(RSVP_RESPONSE_KEY);
    localStorage.removeItem(RSVP_DECLINED_KEY);
  }

  if (
    !mainPage ||
    !rsvpSection ||
    !wishesSection ||
    !countdownSection ||
    !declineCheckSection ||
    !declineFinalSection ||
    !yesButton ||
    !noButton ||
    !backButton ||
    !wishesForm ||
    !declineConfirmButton ||
    !declineChangeButton
  ) {
    return;
  }
  const guestCountInput = document.getElementById("guestCount");
  const guestNamesInput = document.getElementById("guestNames");

  if (guestCountInput) {
    guestCountInput.addEventListener("input", () => {
      const maxGuestCount = getMaxGuestCount();

      guestCountInput.value = guestCountInput.value.replace(/\D/g, "");

      if (Number(guestCountInput.value) > maxGuestCount) {
        guestCountInput.value = String(maxGuestCount);
      }

      if (Number(guestCountInput.value) < 1 && guestCountInput.value !== "") {
        guestCountInput.value = "1";
      }
    });
  }

  if (guestNamesInput) {
    guestNamesInput.addEventListener("input", () => {
      guestNamesInput.value = sanitizeGuestNamesInput(guestNamesInput.value);
    });

    guestNamesInput.addEventListener("blur", () => {
      guestNamesInput.value = formatGuestNamesInput(guestNamesInput.value);
    });
  }

  function resetPageModes() {
    mainPage.classList.remove(
      "page--wishes-open",
      "page--rsvp-completed",
      "page--decline-check-open",
      "page--decline-final-open"
    );

    wishesSection.hidden = true;
    countdownSection.hidden = true;
    declineCheckSection.hidden = true;
    declineFinalSection.hidden = true;
  }

  function showCountdownSection(scrollToCountdown = false) {
    resetPageModes();

    mainPage.classList.add("page--rsvp-completed");
    countdownSection.hidden = false;

    if (scrollToCountdown) {
      requestAnimationFrame(() => {
        countdownSection.scrollIntoView({
          behavior: "auto",
          block: "start"
        });
      });
    }
  }

  function showRsvpSection(scrollToRsvp = false) {
    resetPageModes();

    if (scrollToRsvp) {
      requestAnimationFrame(() => {
        rsvpSection.scrollIntoView({
          behavior: "auto",
          block: "start"
        });
      });
    }
  }

  function openWishesScreen() {
    resetPageModes();

    wishesSection.hidden = false;
    mainPage.classList.add("page--wishes-open");

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  }

  function closeWishesScreen() {
    showRsvpSection(true);
  }

  function openDeclineCheckScreen() {
    resetPageModes();

    declineCheckSection.hidden = false;
    mainPage.classList.add("page--decline-check-open");

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  }

  function showDeclineFinalScreen() {
    resetPageModes();

    declineFinalSection.hidden = false;
    mainPage.classList.add("page--decline-final-open");

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  }

  const serverStatus = String(ACTIVE_GUEST?.status || "")
  .trim()
  .toLowerCase();

  if (serverStatus === "accepted") {
    localStorage.setItem(RSVP_COMPLETED_KEY, "true");
    localStorage.removeItem(RSVP_DECLINED_KEY);
    showCountdownSection(false);
    return;
  }

  if (serverStatus === "declined") {
    localStorage.setItem(RSVP_DECLINED_KEY, "true");
    localStorage.removeItem(RSVP_COMPLETED_KEY);
    showDeclineFinalScreen();
    return;
  }

  const isRsvpCompleted = localStorage.getItem(RSVP_COMPLETED_KEY) === "true";
  const isRsvpDeclined = localStorage.getItem(RSVP_DECLINED_KEY) === "true";

  if (isRsvpDeclined) {
    showDeclineFinalScreen();
  } else if (isRsvpCompleted) {
    showCountdownSection(false);
  } else {
    showRsvpSection();
  }

  yesButton.addEventListener("click", openWishesScreen);
  noButton.addEventListener("click", openDeclineCheckScreen);
  backButton.addEventListener("click", closeWishesScreen);

  declineChangeButton.addEventListener("click", () => {
    showRsvpSection(true);
  });

  declineConfirmButton.addEventListener("click", async () => {
    const declineData = {
      attending: false,
      submittedAt: new Date().toISOString()
    };

    setButtonLoading(declineConfirmButton, true, "Надсилаємо");

    try {
      await submitGuestResponse({
        guestId,
        ...declineData
      });
    } catch (error) {
      console.error(error);

      if (error.responseData?.alreadySubmitted) {
        alert("Відповідь уже була надіслана раніше.");

        if (error.responseData.status === "accepted") {
          showCountdownSection(true);
        } else {
          showDeclineFinalScreen();
        }

        return;
      }

      alert("Не вдалося надіслати відповідь. Спробуйте ще раз.");
      setButtonLoading(declineConfirmButton, false);
      return;
    }

    localStorage.setItem(RSVP_RESPONSE_KEY, JSON.stringify(declineData));
    localStorage.setItem(RSVP_DECLINED_KEY, "true");
    localStorage.removeItem(RSVP_COMPLETED_KEY);

    showDeclineFinalScreen();
  });

  wishesForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = wishesForm.querySelector(".wishes-form__submit");
    const formData = new FormData(wishesForm);

    const validationError = validateGuestForm(formData);

    if (validationError) {
      alert(validationError);
      return;
    }

    const responseData = {
      attending: true,
      guestCount: formData.get("guestCount"),
      guestNames: formatGuestNamesInput(formData.get("guestNames")),
      drinks: formData.getAll("drinks"),
      submittedAt: new Date().toISOString()
    };

    console.log("RSVP response:", responseData);

    setButtonLoading(submitButton, true, "Надсилаємо");

    try {
      await submitGuestResponse({
        guestId,
        ...responseData
      });
    } catch (error) {
      console.error(error);

      if (error.responseData?.alreadySubmitted) {
        alert("Відповідь уже була надіслана раніше.");

        if (error.responseData.status === "accepted") {
          showCountdownSection(true);
        } else {
          showDeclineFinalScreen();
        }

        return;
      }

      alert("Не вдалося надіслати відповідь. Спробуйте ще раз.");
      setButtonLoading(submitButton, false);
      return;
    }

    localStorage.setItem(RSVP_RESPONSE_KEY, JSON.stringify(responseData));
    localStorage.setItem(RSVP_COMPLETED_KEY, "true");
    localStorage.removeItem(RSVP_DECLINED_KEY);

    wishesForm.reset();

    showCountdownSection(true);
  });
}

function setupWeddingCountdown() {
  const daysElement = document.getElementById("countdownDays");
  const hoursElement = document.getElementById("countdownHours");
  const minutesElement = document.getElementById("countdownMinutes");
  const secondsElement = document.getElementById("countdownSeconds");

  if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;

  const weddingDate = new Date(CONFIG.weddingDate).getTime();

  function formatNumber(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const now = Date.now();
    const distance = Math.max(weddingDate - now, 0);

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysElement.textContent = String(days);
    hoursElement.textContent = formatNumber(hours);
    minutesElement.textContent = formatNumber(minutes);
    secondsElement.textContent = formatNumber(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const mainPage = document.getElementById("mobilePage");

  setupTopWaveText();

  try {
    await loadGuestData();
  } finally {
    if (mainPage) {
      mainPage.classList.remove("page--loading");
    }
  }

  setupRsvpFlow();
  setupWeddingCountdown();
});