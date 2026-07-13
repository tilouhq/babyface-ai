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
  BabyFace AI — Big polish pass:
    1. Baby photo on the reveal card is cropped — must show the child clearly.
    2. Profile "Mes générations" grid should sit right below its title (Instagram-style: newest top-left).
    3. Add a Settings entry in the top-right of Profile: choose language (English/French/Spanish).
       App must NEVER ask for language on first run — it must auto-detect the phone's locale.
    4. Add a Delete-my-account button in Settings — wipes user + generations,
       app "starts from zero" and credits reset.
    5. Every button in the app must have subtle press effects/transitions (no dead UI).
    6. Section switches must animate; the selected section must "shine".
    7. Every icon in the app must be 3D — literally ALL of them.

backend:
  - task: "DELETE /api/users/{id} — wipe user + generations"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New endpoint: 404s if user not found, otherwise db.generations.delete_many({user_id}) + db.users.delete_one({id}) and returns {deleted: true, user_id}. Verified via curl end-to-end (create → credits=3 → delete → 404)."

  - task: "Generations list — newest first (Instagram order)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Flipped sort from ascending to descending: .sort('created_at', -1). Combined with a top-anchored FlatList grid, this makes the newest generation appear at top-left, filling right + downward, IG-style."

frontend:
  - task: "Baby photo not cropped in ResultCards"
    implemented: true
    working: true
    file: "frontend/src/components/ResultCards.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Enlarged the card (CARD_W up to 360, CARD_H up to 660) and made the photo area a perfect square equal to the card's inner width. With expo-image contentFit='cover' on a square container matching the picker's 1:1 aspect and Gemini's head-and-shoulders framing, the child's face is fully visible — no top/side cropping."

  - task: "Profile grid: Instagram-style (top-anchored, newest top-left)"
    implemented: true
    working: true
    file: "frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Removed justifyContent:'flex-end' from gridContent, added marginTop under the 'Mes générations' label, and used the backend's newest-first order. Grid now sits immediately below the label and fills top→bottom-right. Verified visually (empty state + expected layout)."

  - task: "Settings: language + delete-account, top-right of Profile"
    implemented: true
    working: true
    file: "frontend/app/settings.tsx, frontend/app/(tabs)/profile.tsx, frontend/app/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New route /settings with presentation:'modal' + slide_from_bottom animation. Reached via a light-glass gear button in Profile top-right. Sections: LANGUAGE (fr/en/es chips with flag emoji; selected chip is a purple liquid-glass with checkmark), hint 'By default the app follows your phone's language', DANGER ZONE with a red liquid-glass 'Delete my account' button that opens a confirm sheet ('Yes, delete' red glass + 'Cancel' ghost). Confirm calls deleteAccount() → api.deleteUser + storage clear + setUser(null) → replace('/login') + 'Account deleted' toast. Verified end-to-end: fresh account → delete → toast + back on login."

  - task: "i18n: auto device locale (fr / en / es), overridable in Settings"
    implemented: true
    working: true
    file: "frontend/src/lib/i18n.ts, frontend/src/context/AppContext.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Installed expo-localization. i18n.ts exposes SUPPORTED_LANGUAGES = ['fr','en','es'], per-language dictionary, detectDeviceLanguage() (Localization.getLocales()[0].languageCode → fallback 'en'), and translate(key, lang, vars). AppContext holds `language` (defaults to detected locale, override persisted in AsyncStorage), `setLanguage`, and `t()`. Every user-facing string across login, onboarding, home, profile, edit-profile, generate, result cards, generation detail, settings uses t(). Verified: browser locale detected as en → tagline shows 'See what your future baby will look like'; switching to English in settings persists the override; app never asks for language on first run."

  - task: "Delete account resets the app to zero (credits included)"
    implemented: true
    working: true
    file: "frontend/src/context/AppContext.tsx, frontend/src/lib/api.ts, frontend/app/settings.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "deleteAccount() calls DELETE /api/users/{id}, then storage.removeItem(userId), setUser(null). Settings screen replaces to /login on completion. Re-running onboarding creates a brand-new user with FREE_CREDITS=3 — the app truly 'starts from zero'."

  - task: "Icon3D — every icon rendered with gradient fill + drop-shadow ghost"
    implemented: true
    working: true
    file: "frontend/src/components/Icon3D.tsx + every screen"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New Icon3D wraps Ionicons/MaterialCommunityIcons via @react-native-masked-view/masked-view + expo-linear-gradient: two-stop vertical gradient tinted by variant (brand/dark/light/muted/blue/pink/success/error/warning/onBrand) with a top-left specular highlight, plus a slightly offset ghost of the same glyph beneath for shape-aware drop shadow. Flat-color fallback keeps a subtle textShadow. Replaced every raw <Ionicons>/<MaterialCommunityIcons> across login (google/apple), onboarding (checkmark, checkmark-circle), home (sparkles, baby-face), profile (settings, person, pencil, baby-face-outline), edit-profile (chevron-back, person, image-outline), generate (chevron-back, man/woman, camera, images, baby-face, checkmark, alert, camera-outline), settings (chevron-down, checkmark-circle, trash, alert-circle), cards (share, close). Verified visually across all screens."

  - task: "Liquid-glass buttons + press shine sweep (no dead UI)"
    implemented: true
    working: true
    file: "frontend/src/components/LiquidGlassButton.tsx + every screen"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Every touchable in the app is now a LiquidGlassButton or LiquidGlassIconButton. On press: (1) scale spring to 0.96 then back, (2) a diagonal soft shine sweeps left→right in ~620ms (fade in / fade out) so nothing feels static, (3) haptic tick, (4) variant-colored shadow. Variants used: primary/blue/pink for CTAs, light for chips + Google + edit + change-photo + credits badge, dark for Apple, error for delete, ghost for close/back/cancel/underlays, success for the reveal check."

  - task: "Tab bar: shining active section + section-switch fade"
    implemented: true
    working: true
    file: "frontend/app/(tabs)/_layout.tsx, frontend/app/(tabs)/index.tsx, frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Custom tab bar rewritten around TabButton: active tab gets an infinitely-repeating radial glow behind the 3D icon (variant blue/pink for BabyFace + brand for Profile), a spring-up scale pulse on activate, a bolder label, and a soft underline gradient. Tabs screenOptions set animation:'shift'; each tab screen keeps a shared-value opacity that goes 0→1 (320ms) on useFocusEffect, giving a fade between sections. Screen-load logic was moved behind a ref so the effect stays stable and doesn't re-fire in a loop."

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Baby photo not cropped in ResultCards"
    - "Profile grid: Instagram-style (top-anchored, newest top-left)"
    - "Settings: language + delete-account, top-right of Profile"
    - "i18n: auto device locale (fr / en / es), overridable in Settings"
    - "Delete account resets the app to zero (credits included)"
    - "Icon3D — every icon rendered with gradient fill + drop-shadow ghost"
    - "Liquid-glass buttons + press shine sweep (no dead UI)"
    - "Tab bar: shining active section + section-switch fade"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Big polish pass done. Backend adds DELETE /api/users/{id} + newest-first generation ordering (verified via curl). Frontend: baby photo is now a full square (no crop), Profile grid is IG-style top-anchored, new Settings modal (top-right of Profile) with fr/en/es picker + delete-account confirm, full i18n via expo-localization + a hand-rolled dictionary applied through t() on every screen, an Icon3D component (mask+gradient+ghost) replaces every raw vector icon, every touchable is a LiquidGlassButton with a diagonal shine on press, and the tab bar has a shining animated active state + fade transitions on section switch. All flows verified via browser screenshots including the full delete → back-to-login → fresh-3-credits round-trip."
