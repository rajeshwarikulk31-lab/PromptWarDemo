# CulinarySync AI - Smart Cooking To-Do & Meal Planner

CulinarySync AI is a premium, interactive AI-powered web micro-application that generates custom cooking schedules, grocery lists, ingredient substitutions, budget evaluations, and calorie trackers based on a user's day.

## Key Features

1. **AI Meal Scheduler**: Generates a Breakfast, Lunch, and Dinner plan customized for your daily schedule and dietary choices.
2. **Interactive Cooking To-Do Checklist**: Every meal expands into a step-by-step recipe checklist that you can check off as you cook.
3. **Dynamic Calorie Tracker**: A gorgeous circular SVG visualizer that updates consumed vs. target calories in real-time as you complete meals.
4. **Budget Feasibility logic**: Auto-estimates grocery costs and tracks portion budgets against your target limit, highlighting affordability status.
5. **Categorized Grocery Checklist**: Checks off ingredients categorized by aisle as you shop.
6. **Smart Substitutions Panel**: Provides custom substitutions for allergies, budget, or missing ingredients, with an interactive custom lookup powered by AI.
7. **Direct Gemini API Integration**: Uses Gemini 1.5 Flash directly from the browser with cached configuration.
8. **Sandbox Demo Mode**: Don't have a Gemini API key? You can toggle **Demo Mode** to test the entire application instantly with mock data.

## Running Locally

Because the application is built entirely on standard Web technologies (HTML5, Vanilla CSS3, Vanilla ES6 JavaScript), you do not need to install dependencies or compile the project.

### Method 1: Double-Click File
Simply open the [index.html](file:///c:/Users/Rajeshwari/Desktop/PromptWarDemo/index.html) file directly in any modern web browser (Chrome, Edge, Safari, Firefox).

### Method 2: Local HTTP Server (Recommended)
If you prefer running via a local web server (for standard web behaviors):

**Using Python:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

**Using Node.js (npx):**
```bash
npx http-server -p 8000
```
Then navigate to `http://localhost:8000` in your browser.
