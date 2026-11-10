# Personal GitHub Account Setup (`mangezi64`)

Because your machine's global Git configuration is set to your work account (`smangezi` / `stewart@odysseyenergysolutions.com`), we have configured **repository-local Git settings** inside `utare-zisedu-mvp` so your commits and remote URL strictly use your personal GitHub account: **[https://github.com/mangezi64](https://github.com/mangezi64)**.

---

## 1. What Has Already Been Configured in This Repo

Inside `/Users/mangezi64/Documents/projects/utare-zisedu-mvp/.git/config`, the following local overrides are active:
- **`user.name`**: `Stewart Mangezi`
- **`user.email`**: `44666836+mangezi64@users.noreply.github.com` *(Your official GitHub noreply email for `mangezi64`, which links every commit directly to `https://github.com/mangezi64` and never exposes your Odyssey email).*
- **`remote.origin.url`**: `https://github.com/mangezi64/utare-zisedu-mvp.git`

You can verify this anytime by running:
```bash
git config --local --list
```

---

## 2. How to Create & Push the Repo to `github.com/mangezi64`

Currently, your GitHub CLI (`gh`) is only logged into `smangezi`. To add your `mangezi64` personal account and push this repository:

### Step 1: Log in to `mangezi64` via GitHub CLI
Run this in your terminal:
```bash
~/.local/bin/gh auth login
```
Select:
1. `GitHub.com`
2. `HTTPS`
3. `Yes` (Authenticate Git with your GitHub credentials)
4. `Login with a web browser` (Ensure you are signed into **mangezi64** in your browser when entering the one-time code).

### Step 2: Switch Active `gh` Account to `mangezi64`
Whenever you are working on personal projects, switch `gh` to `mangezi64`:
```bash
~/.local/bin/gh auth switch -u mangezi64
```

### Step 3: Create the Repository on `mangezi64` and Push
Run this single command from `/Users/mangezi64/Documents/projects/utare-zisedu-mvp` to create the repository under `https://github.com/mangezi64/utare-zisedu-mvp` and push `main`:
```bash
~/.local/bin/gh repo create mangezi64/utare-zisedu-mvp --public --source=. --remote=origin --push
```
*(Or choose `--private` if you want the repository private while inviting Munashe, Amanda, and Kudakwashe as collaborators).*
