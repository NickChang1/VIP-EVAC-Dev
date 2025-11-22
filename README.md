# EVAC+ 
### Emergency Evacuation & Care Access Platform

A health-based emergency care navigation system for Midtown Atlanta, helping users make informed decisions during health emergencies based on their socioeconomic status, mobility, and real-time facility data.

### Core Features
- **Three Decision Modes**: Stay (Static), Move (Active), Hybrid (Adaptive)
- **Real-time Facility Matching**: Like a "dating app" for emergency care - matching users with facilities based on capacity, insurance, proximity
- **Congestion Awareness**: Traffic and facility capacity visualization
- **Interactive Mapping**: Leaflet.js + OpenStreetMap for route planning and facility visualization

## Architecture Ideology

```
EVAC+
├── backend/          # Node.js/Express API
│   ├── routes/       # API endpoints
│   ├── services/     # Backend/Service logic
│   └── models/       # Data models (User profiles, facilities, plans)
├── frontend/         # React web application
│   ├── components/   # UI components
│   ├── services/     # API client
│   └── pages/        # Main app views
└── shared/           # Shared types and utilities
```

### System Components (from architecture draft)
- **DecisionEngine**: Analyzes user profile + facility data → recommends Stay/Move/Hybrid
- **RoutingService**: OpenStreetMap integration for routes + ETA (free alternative)
- **ShelterService**: Urgent care & ER facility directory
- **NotificationService**: Real-time alerts (future)


### Prerequisites/Installations
- Node.js 18+ 
- npm or yarn
- Git installed
- GitHub Enterprise (gatech.edu) account with Personal Access Token (PAT)
- **NO API KEYS REQUIRED** - Using free OpenStreetMap!

---

## Setup Instructions

### Step 1: Clone or Set Up Repository

**If you already have this code locally** (from ZIP or other source):
```bash
cd "/Users/nickchang/Desktop/VIP/EVAC+"

# Initialize git repository
git init

# Add remote repository (GitHub Enterprise)
git remote add origin https://github.gatech.edu/nchang41/EVAC-Dev.git
```

**If you're cloning from GitHub:**
```bash
git clone https://github.gatech.edu/nchang41/EVAC-Dev.git
cd EVAC-Dev
```

### Step 2: GitHub Authentication Setup

Since this uses GitHub Enterprise (gatech.edu), you'll authenticate with your Personal Access Token (PAT).

**Configure Git credentials** (do this once):
```bash
# Tell Git to use macOS Keychain to store credentials
git config --global credential.helper osxkeychain

# Set your GitHub Enterprise username
git config --global user.name "Your Name"
git config --global user.email "nchang41@gatech.edu"
```

**When you push for the first time**, Git will prompt for:
- **Username**: `nchang41` (your GT username)
- **Password**: `<paste-your-PAT-here>` (NOT your GT password!)

After the first successful push, macOS Keychain will remember your credentials.

> **Generate a PAT Here:** https://github.gatech.edu/settings/tokens  
> Required scopes: `repo` (Full control of private repositories)

**Troubleshooting Authentication:**
```bash
# If authentication fails, clear old credentials
git credential-osxkeychain erase
host=github.gatech.edu
protocol=https
# Press Enter twice, then try pushing again
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Configuration

**Backend Configuration:**

Create a `.env` file in the `backend/` directory
```bash
cd backend
cp .env.example .env
```

The `.env` file should contain:
```env
PORT=3001
NODE_ENV=development
```

**Frontend Configuration:**

Create a `.env` file in the `frontend/` directory (optional):
```bash
cd ../frontend
cp .env.example .env
```

The `.env` file should contain:
```env
REACT_APP_API_URL=http://localhost:3001
```

> **Note**: We're using Leaflet.js with OpenStreetMap (completely free, and open sourced) instead of Google Maps. This means you can start building immediately without any setup hassle or cost concerns.

### Step 5: Running the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
You should see: `EVAC+ Backend API running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The app will automatically open at `http://localhost:3000`

---

## Git Workflow Guide (For Beginners)

This section explains how to use Git and GitHub for team collaboration. If you're new to Git, read this carefully!

### Understanding Git Basics

**Git** = Version control system (tracks changes to your code)  
**GitHub** = Website that hosts your Git repositories online  
**Repository (Repo)** = A project folder tracked by Git  
**Commit** = A saved snapshot of your changes  
**Branch** = A separate version of your code (like a parallel universe)  
**Pull Request (PR)** = A request to merge your changes into the main code

**Helpful Git Resources:**
- [Git Tutorial](https://www.w3schools.com/git/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

### Initial Setup (First Time Only)

**1. Configure your Git identity:**
```bash
git config --global user.name "Your Full Name"
git config --global user.email "youremail@gatech.edu"
```

**2. Set up credential storage (so you don't enter PAT every time):**
```bash
git config --global credential.helper osxkeychain
```

**3. Clone the repository to your computer:**
```bash
# Navigate to where you want the project
cd ~/Desktop

# Clone the repo (you'll be asked for username and PAT)
git clone https://github.gatech.edu/nchang41/EVAC-Dev.git # Modify this part of the README in the future as this is my last semester of VIP

# Enter the project folder
cd EVAC-Dev
```

When prompted:
- **Username:** Your GT username (e.g., `nchang41`)
- **Password:** Paste your Personal Access Token (NOT your GT password)

---

### Making Changes

#### Step 1: Create a New Branch

**ALWAYS work on a separate branch, never directly on `main`!**

```bash
# Make sure you're on main branch and it's up to date
git checkout main
git pull origin main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/add-user-form` - for new features
- `fix/login-bug` - for bug fixes
- `docs/update-readme` - for documentation

#### Step 2: Make Your Changes

Edit files, add code, test your changes...

#### Step 3: Check What Changed

```bash
# See which files you modified
git status

# See the actual changes in detail
git diff
```

#### Step 4: Stage Your Changes

```bash
# Add specific files
git add filename.js

# OR add all changed files
git add .
```

**Tip:** Use `git add .` carefully - make sure you're not adding files you don't want (like `.env`)

#### Step 5: Commit Your Changes

```bash
# Commit with a descriptive message
git commit -m "Add user profile form component"
```

**Good commit messages:**
- "Add Google Maps integration to frontend"
- "Fix decision engine logic for Stay recommendation"
- "Update README with setup instructions"

**Bad commit messages:**
- "update"
- "fixed stuff"
- "asdf"

#### Step 6: Push Your Branch to GitHub

```bash
# First time pushing this branch
git push -u origin feature/your-feature-name

# Subsequent pushes on same branch
git push
```

---

### Creating a Pull Request (PR)

After pushing your branch, you need to create a Pull Request to merge your changes into `main`.

**1. Go to GitHub:**
(make sure to modify this if changed in the future)
- Navigate to: `https://github.gatech.edu/nchang41/EVAC-Dev`

**2. You'll see a yellow banner saying:**
> "feature/your-feature-name had recent pushes"

**3. Click the green "Compare & pull request" button**

**4. Fill out the PR form:**
- **Title:** Brief description (e.g., "Add user profile form")
- **Description:** Explain what you changed and why
  ```
  ## What changed
  - Added user profile form component
  - Integrated form with backend API
  - Added form validation
  
  ## Why
  - Needed for MVP Week 2 milestone
  - Users can now input their health info
  
  ## How to test
  1. Run frontend: npm start
  2. Fill out the form
  3. Check console for API call
  ```

**5. Request reviewers:**
- Select team members to review your code

**6. Click "Create pull request"**

---

### Reviewing & Merging Pull Requests

**If you're reviewing someone else's PR:**

1. Click on the PR in GitHub
2. Go to "Files changed" tab
3. Review the code - look for:
   - Does it work?
   - Is it well-organized?
   - Any security issues (like exposed API keys)?
4. Leave comments or approve
5. If approved, click "Merge pull request"
6. Click "Confirm merge"
7. Delete the branch (GitHub will prompt you)

**After your PR is merged:**
```bash
# Switch back to main branch
git checkout main

# Pull the latest changes (including your merged PR)
git pull origin main

# Delete your local feature branch (it's merged now)
git branch -d feature/your-feature-name
```

---

### Common Git Commands Reference

```bash
# Check current branch and status
git status

# See all branches
git branch -a

# Switch to a different branch
git checkout branch-name

# Pull latest changes from GitHub
git pull origin main

# See commit history
git log --oneline

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard HEAD

# See what changed in a file
git diff filename
```

---

### Handling Merge Conflicts

Sometimes Git can't automatically merge changes. You'll see:

```
CONFLICT (content): Merge conflict in filename.js
```

**To resolve:**

1. Open the conflicting file - you'll see:
```javascript
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> feature-branch
```

2. Manually edit to keep what you want:
```javascript
// Keep the correct version, remove the markers
the correct code
```

3. Stage and commit the resolution:
```bash
git add filename.js
git commit -m "Resolve merge conflict in filename.js"
git push
```

---

### Team Workflow Best Practices

1. **Always pull before starting work:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch for each feature:**
   - Don't work on multiple features in one branch

3. **Commit often:**
   - Small, focused commits are better than huge ones

4. **Write clear commit messages:**
   - Future you will thank you

5. **Never commit sensitive data:**
   - Check `.gitignore` includes `.env`, `node_modules/`, etc.

6. **Test before creating a PR:**
   - Make sure your code actually works

7. **Review PRs promptly:**
   - Don't let teammates wait days for reviews

8. **Communicate:**
   - Use PR comments to discuss changes
   - Tag people with @username if you need their input

---

### Troubleshooting Common Issues

**Problem: "Permission denied" when pushing**
```bash
# Your PAT might be wrong or expired
# Clear credentials and try again
git credential-osxkeychain erase
host=github.gatech.edu
protocol=https
# Press Enter twice, then git push again
```

**Problem: "Your branch is behind 'origin/main'"**
```bash
# Pull the latest changes
git pull origin main
```

**Problem: "fatal: not a git repository"**
```bash
# You're not in the project folder
cd /path/to/EVAC+
```

**Problem: Accidentally committed to `main` instead of a branch**
```bash
# Create a new branch from current state
git checkout -b feature/my-feature

# Go back to main
git checkout main

# Reset main to match origin
git reset --hard origin/main

# Go back to your feature branch
git checkout feature/my-feature
```

---


## Midtown Atlanta Health Emergency

**User Profile Example:**
- Age: 67
- Health: Moderate (diabetes management)
- Mobility: Limited (uses walker)
- Location: 10th Street & Peachtree
- Insurance: Medicare

**System Response:**
1. Analyzes nearby facilities (Piedmont, Emory Midtown, Grady)
2. Checks real-time capacity & wait times
3. Factors in traffic conditions
4. **Recommends**: "STAY - Ambulance dispatched. Estimated arrival: 8 mins. Destination: Grady Memorial ER (accepting patients, Medicare covered)"

## Key Concepts

### The Three Core Decisions

| Decision | Description | Real-World Parallel | App Analogy |
|----------|-------------|---------------------|-------------|
| **Stay (Static)** | Remain in place, call ambulance or telemedicine | Shelter in place | DoorDash model - confirms service readiness before dispatch |
| **Move (Active)** | Travel independently to hospital or urgent care | Self-evacuate | Airbnb model - user selects care site based on proximity, cost, capacity |
| **Hybrid (Adaptive)** | Combine modes (walk + meet ambulance) | Phased evacuation | Integrated map logic - dynamic based on constraints |

### Environmental Variables
- **Traffic Congestion**: Affects travel time
- **Facility Congestion**: Affects service time  
- **Ambulance Response Delay**: Affects "stay" option
- **Service Availability**: Urgent cares may close/reach capacity

## Design Philosophy

> "This model simulates how EVAC+ could use live user and facility data to forecast bottlenecks—traffic jams, overwhelmed ERs, or closed urgent cares—and guide users toward viable options."

### Equity Focus
The system is designed to ensure equitable access across:
- Income levels (insurance coverage matching)
- Mobility constraints (accessibility considerations)
- Health conditions (specialist availability)
- Language barriers (future: multilingual support)

## Research Questions

1. How does the fight-or-flight model translate to urban mobility decisions during crises?
2. What parallels exist between seeking care and seeking shelter in larger evacuations?
3. How might integrating real-time data (traffic, hospital load) reshape preparedness systems?
4. How does trust in infrastructure influence human choice?
5. Which design principles make this system equitable across income, mobility, and access levels?

## Technology Stack

- **Frontend**: React, Leaflet.js, React-Leaflet
- **Mapping**: OpenStreetMap (free, open-source alternative to Google Maps)
- **Backend**: Node.js, Express
- **Database**: JSON files (MVP), PostgreSQL (future)
- **Deployment**: TBD (Vercel/Netlify for frontend, Heroku/Railway for backend)

### Why OpenStreetMap Instead of Google Maps?

For this MVP, we're using **Leaflet.js** with **OpenStreetMap** because:
- **Zero cost** - No credit card or API keys required
- **Perfect for demos** - Professional-looking interactive maps
- **Open source** - Community-driven, always free
- **Full features** - Markers, popups, custom overlays, routing
- **Easy to upgrade** - Can switch to Google Maps later if needed

This choice allows us to focus on building core functionality without budget constraints or API setup hassle.
