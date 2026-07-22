let clipboardText = "";
let wakeLock = null;
let currentDough = 'sameday'; // Set Same Day as the new default
let currentProofTime = 'standard'; 

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateHydration();
  
  // Set the dynamic copyright year
  document.getElementById('currentYear').textContent = new Date().getFullYear();
});

// --- Memory & Settings Logic ---
function loadSettings() {
  try {
    const savedQty = localStorage.getItem('pizzaQty');
    const savedDough = localStorage.getItem('doughType');
    const savedTheme = localStorage.getItem('theme');
    const savedProofTime = localStorage.getItem('proofTime');

    if (savedProofTime) {
      currentProofTime = savedProofTime;
    }

    if (savedDough) {
      currentDough = savedDough;
    }
      
    // Trigger the setup for whatever dough is active
    setDoughType(currentDough);

    // Load inputs
    if (savedQty) { document.getElementById('numPizzas').value = savedQty; }

    // Load notes specific to the active dough type
    const savedNotes = localStorage.getItem(currentDough + 'Notes') || '';
    document.getElementById('userNotes').value = savedNotes;

    // Load theme
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('darkModeToggle').checked = true;
    }
  } catch (error) {
    console.log("Memory access blocked by browser - loading default state.");
  }
}

function saveSettings() {
  try {
    const qty = document.getElementById('numPizzas').value;
    const hydration = document.getElementById('hydrationSlider').value;
    
    localStorage.setItem('pizzaQty', qty);
    localStorage.setItem(currentDough + '_hydration', hydration); // Save independently per dough
    localStorage.setItem('doughType', currentDough);
    localStorage.setItem('proofTime', currentProofTime);
  } catch (error) {}
}

function saveNotes() {
  try {
    const notes = document.getElementById('userNotes').value;
    localStorage.setItem(currentDough + 'Notes', notes);
  } catch (error) {}
}

function resetSettings() {
  if (confirm("Are you sure you want to reset the calculator back to its default state? Your notes will not be deleted.")) {
    try {
      localStorage.removeItem('pizzaQty');
      localStorage.removeItem('poolish_hydration'); 
      localStorage.removeItem('sameday_hydration'); 
      localStorage.removeItem('biga_hydration'); 
      localStorage.removeItem('pizzaHydration');    
      localStorage.removeItem('doughType');
      localStorage.removeItem('proofTime');
    } catch (error) {}
    
    document.getElementById('numPizzas').value = '';
    currentProofTime = 'standard';
    setDoughType('sameday'); // Reset goes back to beginner default
    
    // Switch to Calculator tab automatically
    switchTab('calculator');
  }
}

// --- Navigation Logic ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

function setDoughType(type) {
  currentDough = type;
  
  // Swap notes
  try {
    const savedNotes = localStorage.getItem(currentDough + 'Notes') || '';
    document.getElementById('userNotes').value = savedNotes;
  } catch (error) {}
  
  // Load hydration memory
  let savedHydration = null;
  try { savedHydration = localStorage.getItem(currentDough + '_hydration'); } catch(e) {}
  
  // Reset UI
  document.querySelectorAll('.dough-btn').forEach(btn => btn.classList.remove('active'));
  
  if (type === 'sameday') {
    document.getElementById('btnSameDay').classList.add('active');
    document.getElementById('poolishMethod').style.display = 'none';
    document.getElementById('bigaMethod').style.display = 'none';
    document.getElementById('proofingTimeGroup').classList.add('visible'); 
    document.getElementById('userNotes').placeholder = "e.g., Kneaded for 18 mins. Room temp 22°C...";
    document.getElementById('doughHelp').innerText = "The best starting point for beginners. Mix and bake today (3-10 hours) for a classic Neapolitan crust.";
    document.getElementById('hydrationSlider').value = savedHydration ? savedHydration : 60; 
    setProofTime(currentProofTime);
    
  } else if (type === 'poolish') {
    document.getElementById('btnPoolish').classList.add('active');
    document.getElementById('poolishMethod').style.display = 'block';
    document.getElementById('sameDayMethodStandard').style.display = 'none';
    document.getElementById('sameDayMethodQuick').style.display = 'none';
    document.getElementById('bigaMethod').style.display = 'none';
    document.getElementById('proofingTimeGroup').classList.remove('visible'); 
    document.getElementById('userNotes').placeholder = "e.g., Let the poolish go 20 hours today. Kitchen was 21°C...";
    document.getElementById('doughHelp').innerText = "An advanced, two-day process (16-24 hours). Builds complex flavor and a distinctly airy, puffy crust.";
    document.getElementById('hydrationSlider').value = savedHydration ? savedHydration : 67; 
    
  } else if (type === 'biga') {
    document.getElementById('btnBiga').classList.add('active');
    document.getElementById('bigaMethod').style.display = 'block';
    document.getElementById('poolishMethod').style.display = 'none';
    document.getElementById('sameDayMethodStandard').style.display = 'none';
    document.getElementById('sameDayMethodQuick').style.display = 'none';
    document.getElementById('proofingTimeGroup').classList.remove('visible'); 
    document.getElementById('userNotes').placeholder = "e.g., Biga rested at 18°C. Dough felt incredibly strong today...";
    document.getElementById('doughHelp').innerText = "A classic Italian stiff preferment (16-24 hours). Delivers an incredibly fragrant, light, and digestible crust with pronounced crunch.";
    document.getElementById('hydrationSlider').value = savedHydration ? savedHydration : 70; 
  }
  
  saveSettings();
  updateHydration();
}

function setProofTime(time) {
  currentProofTime = time;
  
  // Update UI buttons
  document.getElementById('btnProofStandard').classList.remove('active');
  document.getElementById('btnProofQuick').classList.remove('active');
  
  if (currentDough === 'sameday') {
    if (time === 'standard') {
      document.getElementById('btnProofStandard').classList.add('active');
      document.getElementById('sameDayMethodStandard').style.display = 'block';
      document.getElementById('sameDayMethodQuick').style.display = 'none';
    } else {
      document.getElementById('btnProofQuick').classList.add('active');
      document.getElementById('sameDayMethodStandard').style.display = 'none';
      document.getElementById('sameDayMethodQuick').style.display = 'block';
    }
  }
  
  saveSettings();
  calculate();
}

// --- Theme Logic ---
function toggleDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  try {
    if (toggle.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  } catch (error) {
    document.documentElement.setAttribute('data-theme', toggle.checked ? 'dark' : 'light');
  }
}

// --- Calculator Logic ---
function updateHydration() {
  const sliderVal = document.getElementById('hydrationSlider').value;
  document.getElementById('hydrationVal').innerText = sliderVal + '%';
  
  const h = parseInt(sliderVal);
  let helpText = "";
  
  if (currentDough === 'sameday') {
    if (h >= 55 && h <= 58) {
      helpText = "Classic firm Neapolitan. Very easy to handle and launch into the oven.";
    } else if (h >= 59 && h <= 62) {
      helpText = "The authentic Associazione Verace Pizza Napoletana (AVPN) sweet spot. Soft and extensible.";
    } else if (h >= 63 && h <= 75) {
      helpText = "Modern style. Higher hydration requires stronger flour and careful stretching.";
    }
  } else if (currentDough === 'poolish') {
    if (h === 67) {
      helpText = "Vito Iacopelli's original recipe. Sticky dough, but yields a beautifully light, puffy crust.";
    } else if (h >= 55 && h <= 59) {
      helpText = "Easier to handle and stretch. Great for standard home ovens and a crispier base.";
    } else if (h >= 60 && h <= 66) {
      helpText = "The sweet spot. A great balance of workability and an airy crust.";
    } else if (h >= 68 && h <= 75) {
      helpText = "Advanced. Very sticky dough requiring strong flour and excellent technique.";
    }
  } else if (currentDough === 'biga') {
    if (h >= 55 && h <= 64) {
      helpText = "A firmer dough, very traditional. Easy to stretch and launch.";
    } else if (h >= 65 && h <= 69) {
      helpText = "The biga sweet spot. Beautifully open crumb and pronounced crunch.";
    } else if (h >= 70 && h <= 75) {
      helpText = "Modern 'Canotto' style. High hydration, requires strong flour and careful handling.";
    }
  }
  
  document.getElementById('hydrationHelp').innerText = helpText;
  calculate();
}

function adjustQty(change) {
  const input = document.getElementById('numPizzas');
  let current = parseInt(input.value);
  
  if (isNaN(current)) current = 0;
  
  let newVal = current + change;
  if (newVal < 1) newVal = 1;
  
  input.value = newVal;
  calculate();
}

function calculate() {
  let num = parseInt(document.getElementById('numPizzas').value);
  let targetHydration = parseInt(document.getElementById('hydrationSlider').value) / 100;
  
  saveSettings();
  
  if (isNaN(num) || num < 1) {
    document.getElementById('results').innerHTML = '<p class="empty-state">Please enter a number above to see your recipe.</p>';
    clipboardText = "";
    return; 
  }

  const targetBallWeight = 250;
  const saltPerPizza = 4;
  const flourWaterWeightPerPizza = targetBallWeight - saltPerPizza; 
  
  const totalFlourPerPizza = flourWaterWeightPerPizza / (1 + targetHydration);
  const totalWaterPerPizza = flourWaterWeightPerPizza - totalFlourPerPizza;

  const totalFlour = Math.round(totalFlourPerPizza * num);
  const totalWater = Math.round(totalWaterPerPizza * num);
  const dSalt = saltPerPizza * num;
  const displayHydration = ((totalWater / totalFlour) * 100).toFixed(1);

  let html = '';
  let flourTip = '';

  if (currentDough === 'sameday') {
    flourTip = `<div class="flour-tip">💡 <strong>Flour tip:</strong> For this room-temperature proof, a medium-strength "00" flour (like <strong>Caputo Pizzeria / Blue, W260-270</strong>) works perfectly.</div>`;

    const yeastMultiplier = currentProofTime === 'quick' ? 1.5 : 0.5;
    const sdYeast = (num * yeastMultiplier).toFixed(1); 
    const totalWeight = totalWater + totalFlour + dSalt + parseFloat(sdYeast);
    const timeText = currentProofTime === 'quick' ? '3-4 hours' : '8-10 hours';

    clipboardText = `Same day Neapolitan dough (${num}x 250g balls @ ${displayHydration}% hydration, ${timeText})\n\n` +
      `Ingredients:\n- Water: ${totalWater}g\n- Flour: ${totalFlour}g\n- Salt: ${dSalt}g\n- Yeast: ${sdYeast}g\n\n` +
      `Totals:\n- Total dough weight: ${totalWeight}g`;

    html = flourTip + `
      <div class="recipe-section">
        <h2>Ingredients</h2>
        <ul>
          <li><span>Water</span> <span class="weight">${totalWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${totalFlour}g</span></li>
          <li><span>Salt</span> <span class="weight">${dSalt}g</span></li>
          <li><span>Yeast (Instant/Dry)</span> <span class="weight">${sdYeast}g</span></li>
        </ul>
      </div>
      <div class="totals">
        <ul>
          <li><span>Total flour</span> <span>${totalFlour}g</span></li>
          <li><span>Total water</span> <span>${totalWater}g</span></li>
          <li><span>Actual hydration</span> <span>${displayHydration}%</span></li>
          <li><span>Total dough weight</span> <span>${totalWeight}g</span></li>
        </ul>
      </div>
      <button class="copy-btn" onclick="copyRecipe(this)">Copy recipe to clipboard</button>
    `;

  } else if (currentDough === 'poolish') {
    flourTip = `<div class="flour-tip">💡 <strong>Flour tip:</strong> Because this method uses a long 16-24 hour cold fermentation, use a strong "00" flour (like <strong>Caputo Cuoco / Red, W300-320</strong>) with a high protein content.</div>`;

    const poolishFlourRatio = 67 / 150; 
    const pFlour = Math.round((totalFlourPerPizza * poolishFlourRatio) * num);
    const pWater = pFlour; 
    
    const dFlour = totalFlour - pFlour;
    const dWater = totalWater - pWater;

    let pYeast = 5;
    if (num === 1) { pYeast = 2; } 
    else if (num < 10) { pYeast = 5; }
    else if (num < 20) { pYeast = 10; }
    else { pYeast = 15; }
    
    let pHoney = (num === 1) ? 2 : 5;
    const totalWeight = pWater + pFlour + pYeast + pHoney + dWater + dFlour + dSalt;

    clipboardText = `Poolish dough recipe (${num}x 250g balls @ ${displayHydration}% hydration)\n\n` +
      `1. Poolish:\n- Water: ${pWater}g\n- Flour: ${pFlour}g\n- Yeast: ${pYeast}g\n- Honey: ${pHoney}g\n\n` +
      `2. Main dough:\n- Water: ${dWater}g\n- Flour: ${dFlour}g\n- Salt: ${dSalt}g\n\n` +
      `Totals:\n- Total flour: ${totalFlour}g\n- Total water: ${totalWater}g\n- Total weight: ${totalWeight}g`;

    html = flourTip + `
      <div class="recipe-section">
        <h2>1. Poolish</h2>
        <ul>
          <li><span>Water</span> <span class="weight">${pWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${pFlour}g</span></li>
          <li><span>Yeast</span> <span class="weight">${pYeast}g</span></li>
          <li><span>Honey</span> <span class="weight">${pHoney}g</span></li>
        </ul>
      </div>
      <div class="recipe-section">
        <h2>2. Main dough</h2>
        <ul>
          <li><span>Water</span> <span class="weight">${dWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${dFlour}g</span></li>
          <li><span>Salt</span> <span class="weight">${dSalt}g</span></li>
        </ul>
      </div>
      <div class="totals">
        <ul>
          <li><span>Total flour</span> <span>${totalFlour}g</span></li>
          <li><span>Total water</span> <span>${totalWater}g</span></li>
          <li><span>Actual hydration</span> <span>${displayHydration}%</span></li>
          <li><span>Total dough weight</span> <span>${totalWeight}g</span></li>
        </ul>
      </div>
      <button class="copy-btn" onclick="copyRecipe(this)">Copy recipe to clipboard</button>
    `;

  } else if (currentDough === 'biga') {
    flourTip = `<div class="flour-tip">💡 <strong>Flour tip:</strong> Biga requires a strong "00" flour (like <strong>Caputo Cuoco / Red, W300-320</strong>) to withstand the long fermentation. It produces an incredibly fragrant, crisp, and digestible crust.</div>`;

    // 50% Biga formulation
    const bFlour = Math.round(totalFlour * 0.50);
    const bWater = Math.round(bFlour * 0.45); // Stiff 45% hydration preferment
    const bYeast = (num * 0.4).toFixed(1); 
    
    const dFlour = totalFlour - bFlour;
    const dWater = totalWater - bWater;
    const totalWeight = bWater + bFlour + parseFloat(bYeast) + dWater + dFlour + dSalt;

    clipboardText = `Biga dough recipe (${num}x 250g balls @ ${displayHydration}% hydration)\n\n` +
      `1. Biga (50%):\n- Water: ${bWater}g\n- Flour: ${bFlour}g\n- Yeast: ${bYeast}g\n\n` +
      `2. Main dough:\n- Water: ${dWater}g\n- Flour: ${dFlour}g\n- Salt: ${dSalt}g\n\n` +
      `Totals:\n- Total flour: ${totalFlour}g\n- Total water: ${totalWater}g\n- Total weight: ${totalWeight}g`;

    html = flourTip + `
      <div class="recipe-section">
        <h2>1. Biga (50% preferment)</h2>
        <ul>
          <li><span>Water (Cold)</span> <span class="weight">${bWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${bFlour}g</span></li>
          <li><span>Yeast (Instant/Dry)</span> <span class="weight">${bYeast}g</span></li>
        </ul>
      </div>
      <div class="recipe-section">
        <h2>2. Main dough</h2>
        <ul>
          <li><span>Water</span> <span class="weight">${dWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${dFlour}g</span></li>
          <li><span>Salt</span> <span class="weight">${dSalt}g</span></li>
        </ul>
      </div>
      <div class="totals">
        <ul>
          <li><span>Total flour</span> <span>${totalFlour}g</span></li>
          <li><span>Total water</span> <span>${totalWater}g</span></li>
          <li><span>Actual hydration</span> <span>${displayHydration}%</span></li>
          <li><span>Total dough weight</span> <span>${totalWeight}g</span></li>
        </ul>
      </div>
      <button class="copy-btn" onclick="copyRecipe(this)">Copy recipe to clipboard</button>
    `;
  }

  document.getElementById('results').innerHTML = html;
}

// --- Helper Functions ---
function copyRecipe(button) {
  if (!clipboardText) return;
  
  try {
    navigator.clipboard.writeText(clipboardText).then(() => {
      const originalText = button.innerText;
      button.innerText = "✓ Copied!";
      button.style.backgroundColor = "#2a9d8f"; 
      
      setTimeout(() => {
        button.innerText = originalText;
        button.style.backgroundColor = "var(--primary)";
      }, 2000);
    });
  } catch (err) {
    alert("Failed to copy text. Your browser might block this feature.");
  }
}

async function toggleWakeLock() {
  const toggle = document.getElementById('wakeLockToggle');
  if (toggle.checked) {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        alert("Your browser blocked the Wake Lock feature. Make sure you're viewing this on a secure connection (HTTPS).");
        toggle.checked = false;
      }
    } else {
      alert("Your browser doesn't support the Screen Wake Lock API.");
      toggle.checked = false;
    }
  } else {
    if (wakeLock !== null) {
      wakeLock.release().then(() => { wakeLock = null; });
    }
  }
}

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    const toggle = document.getElementById('wakeLockToggle');
    if (toggle.checked) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error("Could not re-acquire wake lock.");
      }
    }
  }
});