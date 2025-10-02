In a **MERN stack project**, sometimes we have extra files lying around (components, utils, controllers, etc.) that are no longer being used. To check if a specific file is **unused (never imported anywhere)**, you can use a few approaches:

---

### 🔹 1. Manual `grep` or `find` (quick check)

If you want to check for one file, you can simply search its name across the project:

```bash
grep -R "YourFileName" ./src
```

or

```bash
find ./src -type f -exec grep -H "YourFileName" {} \;
```

👉 If nothing shows up (apart from its own file), then it’s unused.

---

### 🔹 2. VS Code Extensions

* **Import Cost** or **TSLint/ESLint plugins** sometimes highlight unused imports/files.
* **"Import Cost Analyzer" / "Unused Files" extensions** can scan your project for files never imported anywhere.

---

### 🔹 3. Using `depcheck` (for dependencies and files)

Install [depcheck](https://www.npmjs.com/package/depcheck):

```bash
npm install -g depcheck
```

Run:

```bash
depcheck
```

It will show:

* Unused npm packages
* Missing dependencies
* Sometimes unused files (but mostly packages)

---

### 🔹 4. `ts-prune` (if you use TypeScript)

If your MERN project is TypeScript-based:

```bash
npx ts-prune
```

It lists all unused exports across the project.
If a file has **all exports unused**, then the file is safe to delete.

---

### 🔹 5. Custom script (for JS projects)

You can write a quick script with [madge](https://www.npmjs.com/package/madge):

```bash
npm install -g madge
```

Run:

```bash
madge --orphans src/
```

👉 This shows “orphan files” (never imported anywhere). Those are safe candidates for deletion.

---

✅ **Recommendation for MERN**: Use **madge** → it’s the most reliable for detecting unused JS/TS files.
Example:

```bash
madge --orphans backend/ controllers/ models/ frontend/src
```

Output will list all unused files.

---
But - 

This is a **common issue with `madge`** → it detects imports based on static analysis. If you see `store.js` being used in your code, but `madge` still flags it as an orphan, it usually means:

1. **It only tracks imports within your specified path (`src/`)**
   If `store.js` is imported in a file *outside* `src/` (for example `index.js` in the root, or `main.jsx` in another folder), madge won’t see that link.

   Example:

   ```js
   import { store } from './store/store.js'
   ```

   from `main.jsx` (outside `src/`) won’t register.

---

2. **Dynamic imports / indirect usage**
   If you import `store.js` dynamically or wrap it in another module, madge sometimes misses it.

---

3. **Alias / path resolution issue**
   If you’re using path aliases like `@/store/store` in `vite.config.js` or `webpack.config.js`, madge may not understand those unless you configure it.

---

### ✅ What to do

* Don’t blindly delete `store.js` — you already confirmed it’s used.
* For each file madge listed, check manually:

  ```bash
  grep -R "useInterviewFlow" src/
  grep -R "useInterviewNavigation" src/
  grep -R "useInterviewPersistence" src/
  grep -R "resumeService" src/
  grep -R "storageMiddleware" src/
  grep -R "store" src/
  ```

  If a file never shows up in results (apart from its own definition), then it’s **truly unused**.

---

### ⚡ TL;DR

* `store.js` → keep (false positive).
* The `hooks/` and `services/resumeService.js` ones → likely unused if grep shows nothing.
* `storageMiddleware.js` → also check with grep before deleting.

---



