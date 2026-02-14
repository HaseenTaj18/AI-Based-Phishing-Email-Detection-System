const subjectInput = document.getElementById("subject");
const bodyInput = document.getElementById("body");
const loader = document.getElementById("loader");
const result = document.getElementById("result");
const status = document.getElementById("status");

const socStatus = document.getElementById("soc-status");
const socRisk = document.getElementById("soc-risk");
const socConfidence = document.getElementById("soc-confidence");

const confidenceBar = document.getElementById("confidence-bar");
const phishingOnly = document.getElementById("phishing-only");
const highlightedText = document.getElementById("highlighted-text");

const riskChartCanvas = document.getElementById("riskChart");
const heatmapChartCanvas = document.getElementById("heatmapChart");
const autoActions = document.getElementById("auto-actions");

let riskChart = null;
let heatmapChart = null;

function analyze() {
    const subject = subjectInput.value.trim();
    const body = bodyInput.value.trim();

    if (!subject || !body) {
        alert("Subject and body are required");
        return;
    }

    loader.style.display = "block";
    result.classList.add("hidden");

    fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body })
    })
    .then(res => res.json())
    .then(data => {
        loader.style.display = "none";

        result.className = "result " + data.prediction;
        result.classList.remove("hidden");

        status.textContent =
            data.prediction === "phishing"
                ? "Phishing Email Detected"
                : "Email Classified as Safe";

        socStatus.textContent = data.prediction.toUpperCase();
        socRisk.textContent = data.prediction === "phishing" ? "HIGH" : "LOW";
        socConfidence.textContent = data.confidence + "%";

        confidenceBar.style.width = data.confidence + "%";
        confidenceBar.style.background =
            data.prediction === "phishing" ? "#e53e3e" : "#38b2ac";

        phishingOnly.classList.toggle("hidden", data.prediction !== "phishing");

        autoActions.innerHTML = "";
        data.actions.forEach(a => {
            const card = document.createElement("div");
            card.className = `action-card ${data.prediction}`;
            card.innerHTML = `
                <div class="action-icon">${a.icon}</div>
                <strong>${a.title}</strong>
                <p style="font-size:12px;color:#555">${a.desc}</p>
            `;
            autoActions.appendChild(card);
        });

        if (data.prediction !== "phishing") return;

        let highlighted = body;
        data.keywords.forEach(k => {
            const regex = new RegExp(`\\b${k.word}\\b`, "gi");
            highlighted = highlighted.replace(regex, `<mark>${k.word}</mark>`);
        });
        highlightedText.innerHTML = highlighted;

        const labels = data.keywords.map(k => k.word);
        const scores = data.keywords.map(k => k.score);

        if (riskChart) riskChart.destroy();
        riskChart = new Chart(riskChartCanvas, {
            type: "bar",
            data: { labels, datasets: [{ data: scores }] }
        });

        if (heatmapChart) heatmapChart.destroy();
        heatmapChart = new Chart(heatmapChartCanvas, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    data: scores,
                    backgroundColor: scores.map(s =>
                        `rgba(229,62,62,${Math.min(s * 6, 1)})`
                    )
                }]
            },
            options: { indexAxis: "y" }
        });
    })
    .catch(err => {
        loader.style.display = "none";
        console.error(err);
        alert("Prediction failed");
    });
}
