# How to Push FleetSync Pro to GitHub

> **Note**: Git is not currently installed or detected in your terminal. You will need to install Git first.

---

## 1. Install Git (If not installed)

- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win)
- **Mac**: Run `git --version` in terminal (prompt to install if missing) or use Homebrew: `brew install git`
- **Linux**: `sudo apt install git`

After installing, close and reopen your terminal to refresh the environment.

---

## 2. Initialize Repository

Open your terminal in the project folder `c:\project\FleetSync Pro` and run:

```bash
# Initialize new git repo
git init

# The .gitignore file is already created for you!
# It will automatically exclude node_modules, .env, and dist folders.
```

---

## 3. Create Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `fleetsync-pro`
3. Description: "Fleet Management System"
4. Visibility: **Private** (Recommended for this project)
5. **Do NOT** initialize with README, .gitignore, or License (we have these locally)
6. Click **Create repository**

---

## 4. Link and Push Code

Copy the commands from the "…or create a new repository on the command line" section on GitHub, or run these:

```bash
# Add all files to staging
git add .

# Commit your changes
git commit -m "Initial commit: FleetSync Pro v1.0"

# Link to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/fleetsync-pro.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## ✅ Success!

Refresh your GitHub repository page. You should see all your code uploaded!

### Next Steps (Optional)

- **Invite Collaborators**: Settings → Collaborators → Add people
- **Connect to Railway**: Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub → Select `fleetsync-pro`
