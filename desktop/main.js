// Kaskad Desktop — wrapper Electron autour du build React Native Web (PARTIE 1 — Build multi-cible).
// Le process principal sert l'app via le protocole kaskad:// et gère les téléchargements
// (dossier Téléchargements, pause/reprise, SHA-256). Il n'exécute jamais les fichiers téléchargés.
const { app, BrowserWindow, ipcMain, net, protocol, session, shell } = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const DEV_URL = process.env.KASKAD_DEV_URL; // ex. http://localhost:8081 (expo start --web)
const WEB_ROOT = path.join(__dirname, "web-build");
const APP_URL = "kaskad://app/";

protocol.registerSchemesAsPrivileged([
    { scheme: "kaskad", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

let win = null;

// ---------------------------------------------------------------------------
// Liens profonds : kaskad://app/<id> (page web publique d'une app, e-mails) ouvre la fiche dans Kaskad.
// L'origine interne de l'app est aussi kaskad://app/ : seuls les liens reçus du système passent ici.

const DEEP_LINK_HOSTS = new Set(["app", "developer", "category"]);
let pendingRoute = null; // lien reçu avant que la fenêtre soit prête

/** kaskad://app/<id> → /app/<id> (route expo-router) ; null si le lien n'est pas reconnu. */
function routeFromDeepLink(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== "kaskad:" || !DEEP_LINK_HOSTS.has(u.host)) return null;
        const id = u.pathname.split("/").filter(Boolean)[0];
        return id && /^[\w-]{1,64}$/.test(id) ? `/${u.host}/${id}` : null;
    } catch {
        return null;
    }
}

function openDeepLink(url) {
    const route = routeFromDeepLink(url);
    if (!route) return;
    if (!win) {
        pendingRoute = route;
        return;
    }
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    // Fenêtre chargée : navigation dans l'app sans rechargement ; sinon chargement direct de la route
    if (win.webContents.isLoading()) win.webContents.once("did-finish-load", () => send("kaskad:open-route", route));
    else send("kaskad:open-route", route);
}

const deepLinkFromArgv = (argv) => argv.find((a) => typeof a === "string" && a.startsWith("kaskad://"));

// Kaskad devient l'application qui ouvre les liens kaskad:// (Windows / Linux : registre et .desktop ;
// macOS : Info.plist généré par electron-builder). En développement, electron doit recevoir le chemin du script.
if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("kaskad", process.execPath, [path.resolve(process.argv[1])]);
} else {
    app.setAsDefaultProtocolClient("kaskad");
}

// macOS : le lien arrive par l'événement open-url (y compris au lancement, avant ready)
app.on("open-url", (event, url) => {
    event.preventDefault();
    openDeepLink(url);
});

// ---------------------------------------------------------------------------
// Fenêtre

function serveWebBuild() {
    protocol.handle("kaskad", (req) => {
        const { pathname } = new URL(req.url);
        let file = path.normalize(path.join(WEB_ROOT, decodeURIComponent(pathname)));
        const inside = file.startsWith(WEB_ROOT + path.sep);
        // Routage côté client (expo-router) : toute route inconnue renvoie index.html
        if (!inside || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB_ROOT, "index.html");
        return net.fetch(pathToFileURL(file).toString());
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 380,
        minHeight: 600,
        title: "Kaskad",
        backgroundColor: "#0F172A",
        icon: path.join(__dirname, "build", "icon.png"),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    // Les liens externes s'ouvrent dans le navigateur par défaut, jamais dans l'app
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:/.test(url)) shell.openExternal(url);
        return { action: "deny" };
    });
    win.webContents.on("will-navigate", (event, url) => {
        const allowed = url.startsWith(APP_URL) || (DEV_URL && url.startsWith(DEV_URL));
        if (!allowed) {
            event.preventDefault();
            if (/^https?:/.test(url)) shell.openExternal(url);
        }
    });

    // Lancement par un lien profond (Windows / Linux : argument de la ligne de commande) : ouvre directement la fiche
    const initial = pendingRoute ?? routeFromDeepLink(deepLinkFromArgv(process.argv) ?? "");
    pendingRoute = null;
    const base = DEV_URL ? DEV_URL.replace(/\/$/, "") + "/" : APP_URL;
    win.loadURL(initial ? base + initial.slice(1) : base);
    win.on("closed", () => (win = null));
}

// ---------------------------------------------------------------------------
// Téléchargements

const active = new Map(); // id -> { item, resolve }
const pending = []; // téléchargements demandés en attente de l'événement will-download

const send = (channel, ...args) => win?.webContents.send(channel, ...args);

function uniquePath(dir, fileName) {
    const { name, ext } = path.parse(fileName);
    let candidate = path.join(dir, fileName);
    for (let i = 1; fs.existsSync(candidate); i++) candidate = path.join(dir, `${name} (${i})${ext}`);
    return candidate;
}

function resumeState(item) {
    return {
        path: item.getSavePath(),
        urlChain: item.getURLChain(),
        mimeType: item.getMimeType(),
        offset: item.getReceivedBytes(),
        length: item.getTotalBytes(),
        lastModified: item.getLastModifiedTime(),
        eTag: item.getETag(),
        startTime: item.getStartTime(),
    };
}

function settle(rec, result) {
    const resolve = rec.resolve;
    rec.resolve = null;
    resolve?.(result);
}

function updateTaskbarProgress() {
    if (!win) return;
    let received = 0;
    let total = 0;
    for (const { item } of active.values()) {
        if (item.getState() !== "progressing" || item.isPaused()) continue;
        received += item.getReceivedBytes();
        total += item.getTotalBytes();
    }
    win.setProgressBar(total > 0 ? received / total : -1);
}

function attach(entry, item) {
    const rec = { item, resolve: entry.resolve };
    active.set(entry.id, rec);

    item.on("updated", (_e, state) => {
        if (state === "interrupted") {
            // Coupure réseau : le renderer pourra reprendre (item.resume) ou recommencer
            settle(rec, { status: "failed", error: "Connexion interrompue", resumeData: resumeState(item) });
        } else if (!item.isPaused()) {
            send("kaskad:download-progress", entry.id, item.getReceivedBytes(), item.getTotalBytes());
        }
        updateTaskbarProgress();
    });

    item.once("done", (_e, state) => {
        active.delete(entry.id);
        updateTaskbarProgress();
        if (state === "completed") {
            send("kaskad:download-progress", entry.id, item.getReceivedBytes(), item.getTotalBytes());
            settle(rec, { status: "completed", path: item.getSavePath(), bytes: item.getReceivedBytes() });
        } else if (state === "cancelled") {
            settle(rec, { status: "canceled" });
        } else {
            settle(rec, { status: "failed", error: "Téléchargement interrompu", resumeData: resumeState(item) });
        }
    });

    if (entry.resume) item.resume();
}

function onWillDownload(_event, item) {
    const url = item.getURLChain()[0] ?? item.getURL();
    const index = pending.findIndex((p) => p.url === url);
    if (index === -1) return; // téléchargement non initié par Kaskad : comportement par défaut
    const [entry] = pending.splice(index, 1);
    if (!entry.resume) item.setSavePath(uniquePath(app.getPath("downloads"), entry.fileName));
    attach(entry, item);
}

ipcMain.handle("kaskad:download", (_e, { id, url, fileName, resumeData }) => {
    return new Promise((resolve) => {
        const rec = active.get(id);
        if (rec) {
            // Reprise d'un téléchargement en pause / interrompu pendant cette session
            rec.resolve = resolve;
            if (rec.item.canResume()) rec.item.resume();
            else {
                rec.item.cancel();
                resolve({ status: "failed", error: "Reprise impossible, veuillez recommencer." });
            }
            return;
        }
        if (resumeData?.path && fs.existsSync(resumeData.path)) {
            // Reprise après un redémarrage de l'app
            pending.push({ id, url: resumeData.urlChain?.[0] ?? url, resolve, resume: true });
            session.defaultSession.createInterruptedDownload({
                ...resumeData,
                offset: fs.statSync(resumeData.path).size,
            });
            return;
        }
        pending.push({ id, url, fileName, resolve });
        win.webContents.downloadURL(url);
    });
});

ipcMain.handle("kaskad:pause", (_e, id) => {
    const rec = active.get(id);
    if (!rec) return null;
    rec.item.pause();
    const state = resumeState(rec.item);
    settle(rec, { status: "paused", resumeData: state });
    updateTaskbarProgress();
    return state;
});

ipcMain.handle("kaskad:cancel", (_e, id) => {
    active.get(id)?.item.cancel();
    const index = pending.findIndex((p) => p.id === id);
    if (index !== -1) pending.splice(index, 1)[0].resolve({ status: "canceled" });
});

// Seuls les fichiers du dossier Téléchargements peuvent être manipulés depuis le renderer
function safePath(p) {
    const resolved = path.resolve(String(p || ""));
    const downloads = path.resolve(app.getPath("downloads"));
    if (!resolved.startsWith(downloads + path.sep)) throw new Error("Chemin non autorisé");
    return resolved;
}

ipcMain.handle("kaskad:show-in-folder", (_e, p) => shell.showItemInFolder(safePath(p)));

ipcMain.handle("kaskad:file-exists", (_e, p) => {
    try {
        return fs.existsSync(safePath(p));
    } catch {
        return false;
    }
});

ipcMain.handle("kaskad:remove-file", async (_e, p) => {
    await fs.promises.rm(safePath(p), { force: true });
});

ipcMain.handle(
    "kaskad:sha256",
    (_e, p) =>
        new Promise((resolve, reject) => {
            const hash = crypto.createHash("sha256");
            fs.createReadStream(safePath(p))
                .on("data", (chunk) => hash.update(chunk))
                .on("end", () => resolve(hash.digest("hex")))
                .on("error", reject);
        }),
);

ipcMain.handle("kaskad:set-badge", (_e, count) => {
    app.setBadgeCount(Math.max(0, Number(count) || 0));
});

// ---------------------------------------------------------------------------

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    // Windows / Linux : un lien kaskad:// ouvert alors que Kaskad tourne relance l'exécutable avec le lien en argument
    app.on("second-instance", (_event, argv) => {
        const link = deepLinkFromArgv(argv);
        if (link) return openDeepLink(link);
        if (!win) return;
        if (win.isMinimized()) win.restore();
        win.focus();
    });

    app.whenReady().then(() => {
        if (process.platform === "win32") app.setAppUserModelId("com.kaskad.store");
        serveWebBuild();
        session.defaultSession.on("will-download", onWillDownload);
        createWindow();
        app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") app.quit();
    });
}
