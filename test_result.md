#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  BabyFace AI — apply user's branding across the app:
    1. Put the provided icon in the in-app splash screen.
    2. Replace the "babyface ai" text on the login/signup page with the provided wordmark image (transparent bg).
    3. Apply Instrument Serif as the global font family.
    4. Give every button in the app an Apple-style 3D "liquid glass" effect.

frontend:
  - task: "Splash screen — use provided logo icon"
    implemented: true
    working: true
    file: "frontend/app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Replaced MaterialCommunityIcons baby-face with <Image source={require('@/assets/images/logo-icon.png')} /> 180×180 rounded. Also copied the icon to icon.png, adaptive-icon.png and native splash-image.png; updated app.json backgroundColor to #ffffff and Android adaptive background to brand purple #987ad6. Verified via screenshot."

  - task: "Login screen — replace babyface ai text with wordmark image"
    implemented: true
    working: true
    file: "frontend/app/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Downloaded the wordmark asset, converted to transparent-bg PNG (Pillow near-white stripping), cropped to bbox, saved as assets/images/logo-wordmark.png (1200×236). Login screen renders it via <Image resizeMode='contain' /> at 260×60. Verified via screenshot."

  - task: "Global font family: Instrument Serif"
    implemented: true
    working: true
    file: "frontend/app/_layout.tsx, frontend/src/hooks/use-app-fonts.ts, frontend/src/lib/patch-default-font.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Installed @expo-google-fonts/instrument-serif via yarn expo install. Created useAppFonts() that merges the existing icon-fonts map with InstrumentSerif_400Regular + Italic. Patched Text.render and TextInput.render at module-load to prepend { fontFamily: 'InstrumentSerif_400Regular' } to any style, so every string in the app renders in Instrument Serif without touching each screen. Local fontFamily overrides still win. Verified visually across splash, login, onboarding, home, profile, buy-credits sheet."

  - task: "Apple 3D liquid-glass effect for all buttons"
    implemented: true
    working: true
    file: "frontend/src/components/LiquidGlassButton.tsx + every screen"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Built LiquidGlassButton and LiquidGlassIconButton composing BlurView + vertical LinearGradient body + top specular gloss + rim border + shadow + press-in scale spring. Variants: primary/light/dark/blue/pink/success/error/ghost. Refactored ALL pressables across: login (Google + Apple), onboarding (chips + Continuer + done Continuer), edit-profile (back, change photo, save), generate (back, next, photo options, retake, continuer, generer, reveal, retry, cancel, permission-sheet buttons), home (credits badge, Commencer, buy credits, close sheet), profile (pencil badge, Modifier, edit-profile-button), result cards (share, close, exit), generation detail (retour). Tab bar and progress dots intentionally kept native for navigation clarity. Verified via mobile screenshots showing gradient body + gloss on primary, dark gloss on Apple, light glass on Google & chips."

backend:
  - task: "Backend continues to run (no changes in this task)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Recreated missing backend/.env (MONGO_URL, DB_NAME=babyface_ai, EMERGENT_LLM_KEY, FREE_CREDITS=3) and frontend/.env (EXPO_PUBLIC_BACKEND_URL + packager vars) that were absent on cold start. Restarted supervisor. GET /api/ returns {message: 'BabyFace AI API', status: 'ok'}."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Splash screen — use provided logo icon"
    - "Login screen — replace babyface ai text with wordmark image"
    - "Global font family: Instrument Serif"
    - "Apple 3D liquid-glass effect for all buttons"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Frontend branding pass complete: user-supplied logo on splash + wordmark on login + Instrument Serif applied globally via render patch + liquid-glass buttons on every CTA/chip/icon-button across the app. Verified visually. Backend untouched aside from restoring the .env files that were missing on cold start."
