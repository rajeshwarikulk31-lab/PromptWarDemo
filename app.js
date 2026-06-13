// CulinarySync AI - Core Application Script

// Application State
let state = {
    apiKey: '',
    dayDescription: '',
    dietaryPreference: 'any',
    budgetLimit: 25,
    calorieGoal: 2000,
    useDemoMode: true,
    currency: 'usd',
    
    // Active Data
    currentPlan: null,
    
    // User progress trackers (persisted in localStorage alongside currentPlan)
    progress: {
        completedSteps: {}, // mealId -> Set/Array of completed step indices
        completedMeals: {}, // mealId -> boolean
        completedGroceries: {} // itemName -> boolean
    }
};

const currencyConfig = {
    usd: { symbol: '$', rate: 1.0, name: 'USD' },
    inr: { symbol: '₹', rate: 83.0, name: 'INR' },
    jpy: { symbol: '¥', rate: 155.0, name: 'JPY' }
};

function formatCost(usdCost) {
    const config = currencyConfig[state.currency];
    const converted = usdCost * config.rate;
    if (state.currency === 'jpy') {
        return `${config.symbol}${Math.round(converted)}`;
    }
    return `${config.symbol}${converted.toFixed(2)}`;
}

function updateCurrencyDisplays() {
    const symbol = currencyConfig[state.currency].symbol;
    document.getElementById("budget-currency-label").innerText = symbol;
    document.getElementById("budget-currency-symbol").innerText = symbol;
}

// Loading Screen Tip Rotator
const loadingTips = [
    { title: "Stirring the pots...", text: "AI is curating your personalized cooking schedule." },
    { title: "Chop, chop, chop...", text: "Structuring your step-by-step cooking to-do checklist." },
    { title: "Browsing the pantry...", text: "Finding the best ingredient substitutions for your diet." },
    { title: "Balancing the ledger...", text: "Evaluating grocery costs to keep you under budget." },
    { title: "Counting the fire...", text: "Adding up meal calories to match your daily target." }
];
let tipInterval = null;

// Mock Demo Data for Frictionless Initial Experience
const demoPlan = {
    "meals": [
        {
            "id": "breakfast",
            "name": "Protein-Packed Berry & Yogurt Bowl",
            "calories": 420,
            "prepTime": "5 mins",
            "cookTime": "0 mins",
            "costEstimate": 2.50,
            "steps": [
                "Measure out 1 cup of Greek yogurt and place in a serving bowl.",
                "Wash a handful of fresh blueberries and strawberries, then slice the strawberries.",
                "Arrange sliced fruit over yogurt, and sprinkle with 2 tablespoons of granola and a teaspoon of chia seeds.",
                "Drizzle 1 teaspoon of honey or maple syrup over the top and enjoy."
            ]
        },
        {
            "id": "lunch",
            "name": "Avocado Turkey & Hummus Wrap",
            "calories": 580,
            "prepTime": "10 mins",
            "cookTime": "0 mins",
            "costEstimate": 3.50,
            "steps": [
                "Lay one large whole wheat tortilla flat on a clean plate or cutting board.",
                "Spread 2 tablespoons of hummus evenly over the wrap, leaving a small border around the edges.",
                "Layer 3-4 slices of lean deli turkey breast on top of the hummus.",
                "Slice half an avocado and place it in the center. Top with a handful of mixed salad greens.",
                "Roll the tortilla tightly, folding in the sides, then cut diagonally in half."
            ]
        },
        {
            "id": "dinner",
            "name": "Garlic Herb Salmon & Asparagus Sheet Pan",
            "calories": 650,
            "prepTime": "10 mins",
            "cookTime": "15 mins",
            "costEstimate": 7.50,
            "steps": [
                "Preheat oven to 400°F (200°C) and line a rimmed baking sheet with aluminum foil.",
                "Trim the woody ends off the asparagus spears and place them on one side of the sheet pan.",
                "Place the salmon fillet on the other side of the pan. Drizzle both salmon and asparagus with 1 tablespoon of olive oil.",
                "Season with 2 cloves of minced garlic, a squeeze of fresh lemon juice, dried dill, salt, and pepper.",
                "Bake in the preheated oven for 12-15 minutes until the salmon flakes easily with a fork and asparagus is tender-crisp."
            ]
        }
    ],
    "groceryList": [
        { "item": "Greek Yogurt", "category": "Dairy", "estimatedCost": 2.20 },
        { "item": "Mixed Berries (Blueberries & Strawberries)", "category": "Produce", "estimatedCost": 3.50 },
        { "item": "Granola", "category": "Pantry", "estimatedCost": 2.00 },
        { "item": "Chia Seeds", "category": "Pantry", "estimatedCost": 1.00 },
        { "item": "Honey or Maple Syrup", "category": "Pantry", "estimatedCost": 1.50 },
        { "item": "Whole Wheat Tortillas", "category": "Pantry", "estimatedCost": 1.80 },
        { "item": "Hummus", "category": "Pantry", "estimatedCost": 2.00 },
        { "item": "Deli Turkey Breast", "category": "Protein", "estimatedCost": 3.50 },
        { "item": "Avocado", "category": "Produce", "estimatedCost": 1.20 },
        { "item": "Mixed Salad Greens", "category": "Produce", "estimatedCost": 1.50 },
        { "item": "Salmon Fillet (1 portion)", "category": "Protein", "estimatedCost": 6.50 },
        { "item": "Fresh Asparagus", "category": "Produce", "estimatedCost": 2.50 },
        { "item": "Lemon & Garlic", "category": "Produce", "estimatedCost": 0.80 }
    ],
    "substitutions": [
        {
            "original": "Deli Turkey Breast",
            "substitute": "Smoked Tofu or Chickpeas",
            "reason": "Vegetarian option, reduces cost by ~$1.50, and adds fiber."
        },
        {
            "original": "Salmon Fillet",
            "substitute": "Boneless Chicken Breast",
            "reason": "Saves ~$3.50, slightly lower in calories while keeping protein high."
        },
        {
            "original": "Chia Seeds",
            "substitute": "Flax Seeds or Hemp Hearts",
            "reason": "Similar nutritional profile (Omega-3s), often cheaper or easier to find."
        },
        {
            "original": "Greek Yogurt",
            "substitute": "Coconut Yogurt",
            "reason": "Excellent dairy-free / vegan substitution."
        }
    ],
    "budgetAnalysis": {
        "totalEstimatedCost": 29.50,
        "feasibility": "Under Budget",
        "notes": "Buying ingredients like hummus, tortillas, and granola provides multiple servings for the week. The cost per day is roughly $13.50, which is well below your $25.00 limit."
    }
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    loadCachedData();
    initUI();
    lucide.createIcons();
});

// Load saved data from LocalStorage
function loadCachedData() {
    const savedApiKey = localStorage.getItem("culinary_sync_api_key");
    if (savedApiKey) {
        state.apiKey = savedApiKey;
        document.getElementById("api-key").value = savedApiKey;
        state.useDemoMode = false;
        document.getElementById("use-demo-mode").checked = false;
    }

    const savedCurrency = localStorage.getItem("culinary_sync_currency");
    if (savedCurrency) {
        state.currency = savedCurrency;
        document.getElementById("currency-select").value = savedCurrency;
    } else {
        state.currency = 'usd';
    }
    updateCurrencyDisplays();

    const savedTheme = localStorage.getItem("culinary_sync_theme");
    const themeToggleIcon = document.querySelector("#theme-toggle i");
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        if (themeToggleIcon) themeToggleIcon.setAttribute("data-lucide", "moon");
    } else {
        document.body.classList.remove("light-theme");
        if (themeToggleIcon) themeToggleIcon.setAttribute("data-lucide", "sun");
    }

    const savedPlan = localStorage.getItem("culinary_sync_plan");
    const savedProgress = localStorage.getItem("culinary_sync_progress");
    const savedDayDesc = localStorage.getItem("culinary_sync_day_desc");
    const savedDiet = localStorage.getItem("culinary_sync_diet");
    const savedBudget = localStorage.getItem("culinary_sync_budget");
    const savedCalories = localStorage.getItem("culinary_sync_calories");

    if (savedPlan) {
        state.currentPlan = JSON.parse(savedPlan);
        if (savedProgress) {
            state.progress = JSON.parse(savedProgress);
        } else {
            resetProgressState();
        }
        
        // Restore input states
        if (savedDayDesc) state.dayDescription = savedDayDesc;
        if (savedDiet) state.dietaryPreference = savedDiet;
        if (savedBudget) state.budgetLimit = parseFloat(savedBudget);
        if (savedCalories) state.calorieGoal = parseInt(savedCalories);

        applyInputsToUI();
        renderDashboard();
    }
}

// Reset the interactive checklist states
function resetProgressState() {
    state.progress = {
        completedSteps: { breakfast: [], lunch: [], dinner: [] },
        completedMeals: { breakfast: false, lunch: false, dinner: false },
        completedGroceries: {}
    };
}

// Synchronize UI values with State
function applyInputsToUI() {
    document.getElementById("day-desc").value = state.dayDescription;
    document.getElementById("diet-pref").value = state.dietaryPreference;
    document.getElementById("budget-limit").value = state.budgetLimit;
    document.getElementById("calorie-goal").value = state.calorieGoal;
}

// Initialize Event Listeners
function initUI() {
    const form = document.getElementById("generator-form");
    const demoBtn = document.getElementById("quick-demo-btn");
    const resetLink = document.getElementById("reset-data");
    const apiKeyInput = document.getElementById("api-key");
    const useDemoCheckbox = document.getElementById("use-demo-mode");
    const findSubBtn = document.getElementById("find-sub-btn");
    const currencySelect = document.getElementById("currency-select");
    const themeToggle = document.getElementById("theme-toggle");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleGeneratePlan();
    });

    demoBtn.addEventListener("click", () => {
        loadDemoMode();
    });

    resetLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearCache();
    });

    apiKeyInput.addEventListener("input", (e) => {
        state.apiKey = e.target.value.trim();
        if (state.apiKey) {
            localStorage.setItem("culinary_sync_api_key", state.apiKey);
            state.useDemoMode = false;
            useDemoCheckbox.checked = false;
        } else {
            localStorage.removeItem("culinary_sync_api_key");
        }
    });

    useDemoCheckbox.addEventListener("change", (e) => {
        state.useDemoMode = e.target.checked;
    });

    findSubBtn.addEventListener("click", () => {
        handleCustomSubstitution();
    });

    // Handle enter key on custom substitution input
    document.getElementById("sub-input-ingredient").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCustomSubstitution();
        }
    });

    currencySelect.addEventListener("change", (e) => {
        const oldCurrency = state.currency;
        const newCurrency = e.target.value;
        const oldRate = currencyConfig[oldCurrency].rate;
        const newRate = currencyConfig[newCurrency].rate;
        
        const currentBudgetVal = parseFloat(document.getElementById("budget-limit").value);
        if (currentBudgetVal) {
            const budgetInUSD = currentBudgetVal / oldRate;
            const convertedBudget = Math.round(budgetInUSD * newRate);
            document.getElementById("budget-limit").value = convertedBudget;
            state.budgetLimit = convertedBudget;
        }
        
        state.currency = newCurrency;
        localStorage.setItem("culinary_sync_currency", state.currency);
        updateCurrencyDisplays();
        
        if (state.currentPlan) {
            renderDashboard();
        }
    });

    themeToggle.addEventListener("click", () => {
        const body = document.body;
        const isLight = body.classList.toggle("light-theme");
        localStorage.setItem("culinary_sync_theme", isLight ? "light" : "dark");
        
        // Update theme toggle icon
        const icon = document.querySelector("#theme-toggle i");
        if (icon) {
            icon.setAttribute("data-lucide", isLight ? "moon" : "sun");
            lucide.createIcons();
        }
    });
}

// Clear all LocalStorage data and reset UI
function clearCache() {
    if (confirm("Are you sure you want to clear your current cooking plan and cache?")) {
        localStorage.removeItem("culinary_sync_plan");
        localStorage.removeItem("culinary_sync_progress");
        localStorage.removeItem("culinary_sync_day_desc");
        localStorage.removeItem("culinary_sync_diet");
        localStorage.removeItem("culinary_sync_budget");
        localStorage.removeItem("culinary_sync_calories");
        
        state.currentPlan = null;
        state.dayDescription = '';
        state.dietaryPreference = 'any';
        state.budgetLimit = 25;
        state.calorieGoal = 2000;
        resetProgressState();
        applyInputsToUI();

        document.getElementById("dashboard-content").classList.add("hidden");
        document.getElementById("empty-state").classList.remove("hidden");
    }
}

// Load pre-configured Demo mode
function loadDemoMode() {
    state.currentPlan = demoPlan;
    state.dayDescription = "A typical active workday, gym workout in evening.";
    state.dietaryPreference = "any";
    state.budgetLimit = 25;
    state.calorieGoal = 2000;
    resetProgressState();
    
    // Save to local storage
    localStorage.setItem("culinary_sync_plan", JSON.stringify(state.currentPlan));
    localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));
    localStorage.setItem("culinary_sync_day_desc", state.dayDescription);
    localStorage.setItem("culinary_sync_diet", state.dietaryPreference);
    localStorage.setItem("culinary_sync_budget", state.budgetLimit);
    localStorage.setItem("culinary_sync_calories", state.calorieGoal);

    applyInputsToUI();
    renderDashboard();
}

// Show/Hide Loading Overlay
function toggleLoading(show) {
    const loading = document.getElementById("loading-state");
    if (show) {
        loading.classList.remove("hidden");
        // Start tip rotation
        let tipIdx = 0;
        const rotateTip = () => {
            const tip = loadingTips[tipIdx];
            document.getElementById("loading-tip-title").innerText = tip.title;
            document.getElementById("loading-tip-text").innerText = tip.text;
            tipIdx = (tipIdx + 1) % loadingTips.length;
        };
        rotateTip();
        tipInterval = setInterval(rotateTip, 3000);
    } else {
        loading.classList.add("hidden");
        if (tipInterval) {
            clearInterval(tipInterval);
            tipInterval = null;
        }
    }
}

// Generate the cooking plan via Gemini API (or Demo Mode)
async function handleGeneratePlan() {
    // Read input fields
    state.dayDescription = document.getElementById("day-desc").value.trim();
    state.dietaryPreference = document.getElementById("diet-pref").value;
    state.budgetLimit = parseFloat(document.getElementById("budget-limit").value) || 25;
    state.calorieGoal = parseInt(document.getElementById("calorie-goal").value) || 2000;
    state.useDemoMode = document.getElementById("use-demo-mode").checked;

    if (!state.dayDescription) {
        alert("Please describe your day so the AI can craft a custom plan.");
        return;
    }

    if (state.useDemoMode) {
        toggleLoading(true);
        setTimeout(() => {
            loadDemoMode();
            toggleLoading(false);
        }, 1500);
        return;
    }

    if (!state.apiKey) {
        alert("Please enter a Gemini API Key or check 'Run in Demo Mode' to use pre-configured details.");
        return;
    }

    toggleLoading(true);

    try {
        const prompt = `You are a professional chef and nutritionist AI. Your task is to generate a highly customized daily cooking plan, grocery list, substitutions, budget analysis, and calorie tracker data based on the user's day description and preferences.

User's Day: "${state.dayDescription}"
Dietary Constraints/Preference: "${state.dietaryPreference}"
Daily Budget Limit: $${state.budgetLimit}
Daily Calorie Goal: ${state.calorieGoal} kcal

You MUST respond with a single JSON object. Do not include any markdown styling (such as \`\`\`json) in your raw response. Ensure it matches this exact JSON schema:
{
  "meals": [
    {
      "id": "breakfast" | "lunch" | "dinner",
      "name": "Meal Name",
      "calories": number,
      "prepTime": "e.g. 10 mins",
      "cookTime": "e.g. 15 mins",
      "costEstimate": number (portion cost),
      "steps": ["Step 1 description", "Step 2 description", ...]
    }
  ],
  "groceryList": [
    {
      "item": "Item Name",
      "category": "Produce" | "Protein" | "Dairy" | "Pantry" | "Other",
      "estimatedCost": number
    }
  ],
  "substitutions": [
    {
      "original": "Item to substitute",
      "substitute": "Alternative item",
      "reason": "Explain culinary or cost reason"
    }
  ],
  "budgetAnalysis": {
    "totalEstimatedCost": number (total cost of buying all groceries),
    "feasibility": "Under Budget" | "On Budget" | "Over Budget",
    "notes": "Brief feedback on why it fits the budget limit"
  }
}

Provide realistic and delicious recipes. The steps must be styled as cooking checklist to-dos. Budget costs must represent realistic averages. Calories and budget totals must align correctly.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Failed to contact Gemini API");
        }

        const resData = await response.json();
        let jsonText = resData.candidates[0].content.parts[0].text;
        
        // Sanitize LLM JSON response (just in case they output markdown block wrappers)
        jsonText = jsonText.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/, '').trim();
        
        const parsedPlan = JSON.parse(jsonText);
        
        // Update State
        state.currentPlan = parsedPlan;
        resetProgressState();

        // Save states to local storage
        localStorage.setItem("culinary_sync_plan", JSON.stringify(state.currentPlan));
        localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));
        localStorage.setItem("culinary_sync_day_desc", state.dayDescription);
        localStorage.setItem("culinary_sync_diet", state.dietaryPreference);
        localStorage.setItem("culinary_sync_budget", state.budgetLimit);
        localStorage.setItem("culinary_sync_calories", state.calorieGoal);

        renderDashboard();
    } catch (err) {
        console.error(err);
        alert(`AI Generation failed: ${err.message}. Please check your API key and try again.`);
    } finally {
        toggleLoading(false);
    }
}

// Render the Entire Dashboard from State
function renderDashboard() {
    if (!state.currentPlan) return;

    // Toggle Visibility
    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("dashboard-content").classList.remove("hidden");

    // Headings and Badges
    document.getElementById("plan-subheading").innerText = `Optimized schedule based on: "${state.dayDescription.substring(0, 75)}${state.dayDescription.length > 75 ? '...' : ''}"`;
    
    const dietBadge = document.getElementById("diet-badge");
    dietBadge.innerText = state.dietaryPreference === 'any' ? 'Standard Diet' : state.dietaryPreference;
    dietBadge.className = `badge ${state.dietaryPreference === 'any' ? '' : 'badge-accent'}`;

    const typeBadge = document.getElementById("day-type-badge");
    typeBadge.innerText = state.useDemoMode ? "Demo Sandbox" : "Custom AI Plan";

    // Update Limits
    document.getElementById("calories-target").innerText = state.calorieGoal;
    document.getElementById("budget-limit-display").innerText = formatCost(state.budgetLimit / currencyConfig[state.currency].rate);

    // Render Components
    renderMeals();
    renderGroceryList();
    renderSubstitutions();
    updateProgressMetrics();

    // Re-initialize dynamic icons
    lucide.createIcons();
}

// Render Meal Cards (Breakfast, Lunch, Dinner)
function renderMeals() {
    const container = document.getElementById("meals-container");
    container.innerHTML = "";

    state.currentPlan.meals.forEach((meal) => {
        const mealId = meal.id;
        const isCompleted = state.progress.completedMeals[mealId] || false;
        
        // Count step progress
        const mealSteps = meal.steps || [];
        const completedMealSteps = state.progress.completedSteps[mealId] || [];
        const checkedCount = completedMealSteps.length;
        const totalSteps = mealSteps.length;
        const stepPercent = totalSteps > 0 ? Math.round((checkedCount / totalSteps) * 100) : 0;

        // Determine Icon based on meal type
        let mealIcon = "utensils";
        if (mealId === "breakfast") mealIcon = "coffee";
        if (mealId === "lunch") mealIcon = "sandwich";
        if (mealId === "dinner") mealIcon = "soup";

        const card = document.createElement("div");
        card.className = `meal-card ${isCompleted ? 'completed' : ''}`;
        card.id = `meal-card-${mealId}`;

        // Header section html
        card.innerHTML = `
            <div class="meal-card-header" onclick="toggleMealExpand('${mealId}')">
                <div class="meal-header-left">
                    <div class="meal-type-icon">
                        <i data-lucide="${mealIcon}"></i>
                    </div>
                    <div class="meal-header-text">
                        <h4>${mealId.toUpperCase()}</h4>
                        <p class="meal-name">${meal.name}</p>
                    </div>
                </div>
                <div class="meal-header-right">
                    <div class="meal-info-pills">
                        <span class="info-pill"><i data-lucide="flame"></i> ${meal.calories} kcal</span>
                        <span class="info-pill"><i data-lucide="clock"></i> Prep: ${meal.prepTime}</span>
                        <span class="info-pill"><i data-lucide="dollar-sign"></i> Est: ${formatCost(meal.costEstimate)}</span>
                    </div>
                    <div class="toggle-arrow">
                        <i data-lucide="chevron-down"></i>
                    </div>
                </div>
            </div>
            <div class="meal-card-body">
                <div class="cooking-todo-title-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <span class="cooking-todo-title">Cooking Checklist Steps</span>
                    <span style="font-size:0.78rem; color:var(--text-secondary);">${checkedCount}/${totalSteps} Done</span>
                </div>
                
                <div class="progress-bar-container" style="height: 6px; margin-bottom: 1rem;">
                    <div class="progress-bar bg-green" style="width: ${stepPercent}%"></div>
                </div>

                <div class="cooking-todo-list">
                    ${mealSteps.map((step, idx) => {
                        const isChecked = completedMealSteps.includes(idx);
                        return `
                            <label class="todo-item ${isChecked ? 'checked' : ''}" onclick="toggleStepCheckbox(event, '${mealId}', ${idx})">
                                <div class="todo-checkbox-wrapper">
                                    <input type="checkbox" class="todo-checkbox" ${isChecked ? 'checked' : ''}>
                                    <div class="todo-checkbox-custom"></div>
                                </div>
                                <span class="todo-text">${step}</span>
                            </label>
                        `;
                    }).join('')}
                </div>

                <hr class="card-divider">
                
                <div class="meal-card-actions">
                    <label class="checkbox-container">
                        <input type="checkbox" id="complete-checkbox-${mealId}" ${isCompleted ? 'checked' : ''} onchange="toggleMealComplete('${mealId}', this.checked)">
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Mark Meal Prepared & Eaten</span>
                    </label>
                    <button class="regenerate-btn" onclick="regenerateMeal('${mealId}')">
                        <i data-lucide="refresh-cw"></i> Swap Meal
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Expand the first meal card by default if none are expanded yet
    const expandedCard = document.querySelector(".meal-card.expanded");
    if (!expandedCard && container.firstChild) {
        container.firstChild.classList.add("expanded");
    }
}

// Expand/Collapse Meal card body
window.toggleMealExpand = function(mealId) {
    const card = document.getElementById(`meal-card-${mealId}`);
    if (card) {
        card.classList.toggle("expanded");
    }
};

// Checkbox item toggling for cooking checklist steps
window.toggleStepCheckbox = function(event, mealId, stepIndex) {
    // Avoid double trigger from labels
    if (event.target.tagName === 'INPUT') return;
    
    event.preventDefault();
    event.stopPropagation();

    if (!state.progress.completedSteps[mealId]) {
        state.progress.completedSteps[mealId] = [];
    }

    const completed = state.progress.completedSteps[mealId];
    const indexInArray = completed.indexOf(stepIndex);

    if (indexInArray > -1) {
        completed.splice(indexInArray, 1);
    } else {
        completed.push(stepIndex);
    }

    localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));
    
    // Rerender meals to reflect change immediately
    renderMeals();
    updateProgressMetrics();
    lucide.createIcons();
};

// Checkbox complete for entire meal
window.toggleMealComplete = function(mealId, isChecked) {
    state.progress.completedMeals[mealId] = isChecked;
    
    // Auto-check all recipe steps if meal is completed
    const meal = state.currentPlan.meals.find(m => m.id === mealId);
    if (meal) {
        if (isChecked) {
            state.progress.completedSteps[mealId] = meal.steps.map((_, idx) => idx);
        } else {
            state.progress.completedSteps[mealId] = [];
        }
    }

    localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));

    // Rerender meals to show completion
    renderMeals();
    updateProgressMetrics();
    lucide.createIcons();
};

// Render Grocery List Checklist
function renderGroceryList() {
    const container = document.getElementById("grocery-categories");
    container.innerHTML = "";

    const groceries = state.currentPlan.groceryList || [];
    
    // Calculate total cost
    const totalCost = groceries.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    document.getElementById("grocery-total-cost").innerText = `Est: ${formatCost(totalCost)}`;

    // Group groceries by Category
    const groups = {};
    groceries.forEach(item => {
        const cat = item.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    for (const [category, items] of Object.entries(groups)) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";
        
        groupDiv.innerHTML = `
            <h4>${category}</h4>
            <div class="grocery-list">
                ${items.map(item => {
                    const isChecked = state.progress.completedGroceries[item.item] || false;
                    return `
                        <div class="grocery-item ${isChecked ? 'checked' : ''}" onclick="toggleGroceryItem('${item.item}')">
                            <div class="grocery-item-left">
                                <label class="checkbox-container" style="padding-left:1.5rem; margin-bottom:0;">
                                    <input type="checkbox" ${isChecked ? 'checked' : ''} style="position:absolute; opacity:0;">
                                    <span class="checkmark" style="height:0.95rem; width:0.95rem; top:2px;"></span>
                                </label>
                                <span class="grocery-name">${item.item}</span>
                            </div>
                            <span class="grocery-cost">${formatCost(item.estimatedCost)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(groupDiv);
    }
}

// Toggle grocery checklist items
window.toggleGroceryItem = function(itemName) {
    state.progress.completedGroceries[itemName] = !state.progress.completedGroceries[itemName];
    localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));
    
    renderGroceryList();
    updateProgressMetrics();
};

// Render Substitutions
function renderSubstitutions() {
    const container = document.getElementById("substitutions-list");
    container.innerHTML = "";

    const substitutions = state.currentPlan.substitutions || [];
    if (substitutions.length === 0) {
        container.innerHTML = "<p style='font-size:0.8rem; color:var(--text-muted);'>No standard substitutions generated.</p>";
        return;
    }

    substitutions.forEach(sub => {
        const card = document.createElement("div");
        card.className = "substitution-card";
        card.innerHTML = `
            <div class="sub-header">
                <span class="text-muted">${sub.original}</span>
                <i data-lucide="arrow-right" class="sub-arrow" style="width:12px; height:12px;"></i>
                <span class="text-green">${sub.substitute}</span>
            </div>
            <div class="sub-reason">${sub.reason}</div>
        `;
        container.appendChild(card);
    });
}

// Calculate and Update Dashboard Metric Gauges
function updateProgressMetrics() {
    if (!state.currentPlan) return;

    // 1. Calories Gauge Update
    let consumed = 0;
    state.currentPlan.meals.forEach(meal => {
        if (state.progress.completedMeals[meal.id]) {
            consumed += meal.calories;
        }
    });

    document.getElementById("calories-consumed").innerText = consumed;
    const calorieTarget = state.calorieGoal;
    
    // SVG DashOffset math
    const radius = 50;
    const perimeter = 2 * Math.PI * radius; // 314.16
    const calorieProgressCircle = document.getElementById("calorie-progress-circle");
    
    const caloriePercent = Math.min((consumed / calorieTarget), 1);
    const calorieOffset = perimeter - (caloriePercent * perimeter);
    calorieProgressCircle.style.strokeDasharray = perimeter;
    calorieProgressCircle.style.strokeDashoffset = calorieOffset;

    // Calorie Status text
    const calorieText = document.getElementById("calorie-status-text");
    if (consumed === 0) {
        calorieText.innerText = "Check prepared meals below";
    } else if (consumed <= calorieTarget) {
        calorieText.innerText = `${calorieTarget - consumed} kcal remaining to hit target`;
    } else {
        calorieText.innerText = `Exceeded daily target by ${consumed - calorieTarget} kcal`;
    }

    // 2. Budget Gauge Update
    // Portions estimated cost vs user budget
    let dailyMealsCost = state.currentPlan.meals.reduce((sum, meal) => sum + meal.costEstimate, 0);
    
    // In grocery list, estimate buying costs
    const groceries = state.currentPlan.groceryList || [];
    const groceryLimitUSD = state.budgetLimit / currencyConfig[state.currency].rate;
    const totalGroceriesCost = groceries.reduce((sum, item) => sum + item.estimatedCost, 0);

    document.getElementById("budget-spent").innerText = formatCost(dailyMealsCost);
    
    const budgetPercent = Math.min((dailyMealsCost / groceryLimitUSD) * 100, 100);
    const budgetProgressBar = document.getElementById("budget-progress-bar");
    budgetProgressBar.style.width = `${budgetPercent}%`;

    const budgetStatusBadge = document.getElementById("budget-status-badge");
    const budgetAnalysis = state.currentPlan.budgetAnalysis || {};
    
    if (dailyMealsCost <= groceryLimitUSD) {
        budgetStatusBadge.innerText = "Under Budget";
        budgetStatusBadge.className = "badge badge-success";
        budgetProgressBar.className = "progress-bar bg-green";
    } else {
        budgetStatusBadge.innerText = "Over Budget";
        budgetStatusBadge.className = "badge badge-error";
        budgetProgressBar.className = "progress-bar bg-error";
    }
    
    // Show AI Notes
    const notesElement = document.getElementById("budget-notes-text");
    notesElement.innerText = budgetAnalysis.notes || `Portions average out to ${formatCost(dailyMealsCost)}. Total ingredients cost is ${formatCost(totalGroceriesCost)}.`;

    // Update display limit
    document.getElementById("budget-limit-display").innerText = formatCost(groceryLimitUSD);

    // 3. To-Do progress indicators
    let totalStepsCount = 0;
    let completedStepsCount = 0;
    let completedMealsCount = 0;

    state.currentPlan.meals.forEach(meal => {
        totalStepsCount += meal.steps.length;
        completedStepsCount += (state.progress.completedSteps[meal.id] || []).length;
        if (state.progress.completedMeals[meal.id]) {
            completedMealsCount++;
        }
    });

    document.getElementById("tasks-ratio").innerText = `${completedStepsCount} / ${totalStepsCount}`;
    document.getElementById("meals-completed-ratio").innerText = `${completedMealsCount} / 3`;

    const tasksPercent = totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0;
    document.getElementById("tasks-progress-bar").style.width = `${tasksPercent}%`;

    const tasksText = document.getElementById("tasks-status-text");
    if (completedStepsCount === 0) {
        tasksText.innerText = "Let's start cooking!";
    } else if (completedStepsCount === totalStepsCount) {
        tasksText.innerText = "Outstanding! All recipes prepared.";
    } else {
        tasksText.innerText = `${Math.round(tasksPercent)}% of cooking steps completed.`;
    }
}

// Regenerate single meal card via AI
async function regenerateMeal(mealId) {
    const meal = state.currentPlan.meals.find(m => m.id === mealId);
    if (!meal) return;

    if (state.useDemoMode) {
        // Swap with a predefined mock alternative in sandbox mode
        let alternative = {};
        if (mealId === "breakfast") {
            alternative = {
                id: "breakfast",
                name: "Scrambled Eggs & Avocado Toast",
                calories: 450,
                prepTime: "5 mins",
                cookTime: "5 mins",
                costEstimate: 2.10,
                steps: [
                    "Toast 1 slice of whole wheat bread.",
                    "Whisk 2 large eggs with 1 tbsp of milk and pinch of salt.",
                    "Sauté eggs in skillet with light butter until fluffy.",
                    "Mash avocado onto toast, top with scrambled eggs and chili flakes."
                ]
            };
        } else if (mealId === "lunch") {
            alternative = {
                id: "lunch",
                name: "Quinoa Salad with Chickpeas & Feta",
                calories: 520,
                prepTime: "10 mins",
                cookTime: "0 mins",
                costEstimate: 2.90,
                steps: [
                    "In a bowl, combine 1 cup cooked quinoa and 1/2 cup rinsed canned chickpeas.",
                    "Chop cucumber, cherry tomatoes, and kalamata olives, then toss into quinoa.",
                    "Crumble 2 tablespoons of feta cheese over the mixture.",
                    "Drizzle olive oil, lemon juice, salt, and oregano. Mix gently and serve."
                ]
            };
        } else {
            alternative = {
                id: "dinner",
                name: "Garlic Butter Grilled Chicken & Rice",
                calories: 680,
                prepTime: "10 mins",
                cookTime: "20 mins",
                costEstimate: 4.80,
                steps: [
                    "Cook 1/2 cup of white or brown rice in a saucepan.",
                    "Season 1 chicken breast with salt, pepper, garlic powder, and paprika.",
                    "Heat 1 tsp olive oil in a skillet and cook chicken 6-7 mins per side.",
                    "Add 1 tbsp butter and garlic to skillet in final minutes to glaze chicken, then serve with rice and steamed broccoli."
                ]
            };
        }

        // Replace meal
        const idx = state.currentPlan.meals.findIndex(m => m.id === mealId);
        state.currentPlan.meals[idx] = alternative;
        
        // Reset progress for this specific card
        state.progress.completedMeals[mealId] = false;
        state.progress.completedSteps[mealId] = [];
        
        localStorage.setItem("culinary_sync_plan", JSON.stringify(state.currentPlan));
        localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));

        renderDashboard();
        return;
    }

    if (!state.apiKey) {
        alert("Enter your Gemini API key to swap meals dynamically.");
        return;
    }

    // Set UI to loading state for that specific meal card
    const cardEl = document.getElementById(`meal-card-${mealId}`);
    cardEl.style.opacity = "0.5";
    cardEl.style.pointerEvents = "none";

    try {
        const prompt = `You are a culinary planner AI. Swap the current "${mealId}" meal.
User's Day: "${state.dayDescription}"
Dietary Constraints: "${state.dietaryPreference}"
Old Meal Name: "${meal.name}"

Generate a delicious and completely different alternative meal for "${mealId}" matching the user's needs.
Respond ONLY with a JSON object matching this exact schema:
{
  "id": "${mealId}",
  "name": "Alternative Meal Name",
  "calories": number,
  "prepTime": "string",
  "cookTime": "string",
  "costEstimate": number,
  "steps": ["Step 1", "Step 2", ...]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error("Failed to swap meal from AI");

        const data = await response.json();
        let jsonText = data.candidates[0].content.parts[0].text;
        jsonText = jsonText.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/, '').trim();

        const replacementMeal = JSON.parse(jsonText);

        // Update state
        const idx = state.currentPlan.meals.findIndex(m => m.id === mealId);
        state.currentPlan.meals[idx] = replacementMeal;
        state.progress.completedMeals[mealId] = false;
        state.progress.completedSteps[mealId] = [];

        // Save
        localStorage.setItem("culinary_sync_plan", JSON.stringify(state.currentPlan));
        localStorage.setItem("culinary_sync_progress", JSON.stringify(state.progress));

        renderDashboard();
    } catch (err) {
        console.error(err);
        alert(`Swap Meal failed: ${err.message}`);
        cardEl.style.opacity = "1";
        cardEl.style.pointerEvents = "all";
    }
}

// Custom interactive substitutions finder
async function handleCustomSubstitution() {
    const inputField = document.getElementById("sub-input-ingredient");
    const ingredient = inputField.value.trim();
    const resultBox = document.getElementById("sub-finder-result");

    if (!ingredient) {
        alert("Please enter an ingredient name first.");
        return;
    }

    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `
        <div class="loading-text">
            <i data-lucide="loader"></i> Looking up alternatives for "${ingredient}"...
        </div>
    `;
    lucide.createIcons();

    if (state.useDemoMode) {
        setTimeout(() => {
            // Serve a simple fallback substitution
            resultBox.innerHTML = `
                <strong>Alternatives for ${ingredient}:</strong><br>
                • <strong>Culinary Swap:</strong> Plain Greek yogurt or applesauce (depending on the recipe).<br>
                • <strong>Nutritional Benefit:</strong> Lower fat content, high protein/moisture.<br>
                • <strong>Cost Impact:</strong> Generally cost-neutral or cheaper if using pantry stables.
            `;
        }, 800);
        return;
    }

    try {
        const prompt = `You are a kitchen advisor. Provide quick substitutions for the ingredient: "${ingredient}".
Provide details on:
1. Culinary replacement (what to use)
2. Nutritional benefit or reason
3. Budget impact (is it cheaper or more expensive?)

Keep your response brief (maximum 3 bullet points, under 60 words).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) throw new Error("Could not fetch substitution advice");
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        // Convert markdown bullets to readable HTML
        const htmlText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        resultBox.innerHTML = `
            <strong>AI Recommendations:</strong><br>
            ${htmlText}
        `;
    } catch (err) {
        console.error(err);
        resultBox.innerHTML = `<span class="text-error">Lookup failed: ${err.message}</span>`;
    }
}
