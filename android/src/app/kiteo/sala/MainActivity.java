package app.kiteo.sala;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Sala de Kiteo para Android: el juego web a pantalla completa dentro de un WebView.
 *
 * El juego va dentro del APK (assets/www). Al abrirse, la app mira una carpeta pública de kDrive: si hay una versión del
 * juego más nueva, la descarga, comprueba su huella, la guarda en el almacenamiento interno y a partir de entonces la sirve
 * desde ahí. No hace falta reinstalar nada. Solo cuando cambia la propia app (este archivo) avisa de que hay un APK nuevo.
 */
public class MainActivity extends Activity {
    static final int SHELL = 1;                               // versión de esta app; súbela cuando cambie el APK
    static final String HOST = "kiteo.app";                   // origen ficticio: todo lo que pida el juego se sirve en local
    static final String SHARE = "https://kdrive.infomaniak.com/%d/app/4481105/share/4d01df71-eb45-4e5b-bd47-b86d1e8d395a";
    static final int DIR = 1060;

    WebView web;
    SharedPreferences prefs;
    File www;
    long started;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        started = System.currentTimeMillis();
        prefs = getSharedPreferences("kiteo", MODE_PRIVATE);
        www = new File(getFilesDir(), "www");
        // Si el APK trae un juego más nuevo que el descargado (se instaló una app nueva), manda el del APK
        if (prefs.getInt("v", 0) <= bundled() && www.exists()) { wipe(www); prefs.edit().putInt("v", 0).apply(); }

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B080D);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false); s.setAllowContentAccess(false); s.setSupportZoom(false); s.setTextZoom(100);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new Client(this));
        setContentView(web);
        web.setFocusable(true); web.setFocusableInTouchMode(true); web.requestFocus();   // con el foco puesto le llegan el mando y el teclado
        immersive();
        web.loadUrl("https://" + HOST + "/index.html");
        new Thread(this::checkUpdate, "kiteo-update").start();
    }

    // ── Pantalla completa de verdad, y que vuelva al tocar o al recuperar el foco ──
    void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }
    @Override protected void onPause() { super.onPause(); js("window.__kiteo&&window.__kiteo.hush(true)"); web.onPause(); }      // al salir de la app, el juego se calla
    @Override protected void onResume() { super.onResume(); web.onResume(); js("window.__kiteo&&window.__kiteo.hush(false)"); immersive(); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }

    // ── Mando: Android convierte el botón B en «atrás» si nadie lo recoge. Aquí todo lo del mando va al juego y no sale de él ──
    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        int src = e.getSource();
        boolean pad = (src & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD || (src & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
        if (pad && e.getKeyCode() != KeyEvent.KEYCODE_HOME) { web.dispatchKeyEvent(e); return true; }
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK) {      // el gesto de atrás del móvil hace de Esc: pausa o vuelve, pero no cierra el juego
            if (e.getAction() == KeyEvent.ACTION_UP) js("for(const t of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(t,{code:'Escape',key:'Escape'}))");
            return true;
        }
        return super.dispatchKeyEvent(e);
    }
    void js(String code) { if (web != null) web.evaluateJavascript(code, null); }

    // ── Actualización del juego desde la carpeta pública de kDrive ──
    int bundled() { try (BufferedReader r = new BufferedReader(new InputStreamReader(getAssets().open("www/version.txt")))) { return Integer.parseInt(r.readLine().trim()); } catch (Exception e) { return 0; } }
    int current() { return Math.max(prefs.getInt("v", 0), bundled()); }

    void checkUpdate() {
        try {
            JSONArray files = new JSONObject(new String(get(String.format(SHARE, 3) + "/files/" + DIR + "/files?limit=200"), "UTF-8")).getJSONArray("data");
            Map<String, Integer> ids = new HashMap<>();
            for (int i = 0; i < files.length(); i++) ids.put(files.getJSONObject(i).getString("name"), files.getJSONObject(i).getInt("id"));
            if (!ids.containsKey("version.json")) return;
            JSONObject ver = new JSONObject(new String(get(dl(ids.get("version.json"))), "UTF-8"));
            int v = ver.optInt("v", 0);
            final JSONObject apk = ver.optJSONObject("apk");
            if (apk != null && apk.optInt("v", 0) > SHELL && ids.containsKey(apk.optString("file"))) {
                final String url = dl(ids.get(apk.optString("file")));
                runOnUiThread(() -> new AlertDialog.Builder(this).setTitle("Hay una app nueva").setMessage("Esta versión de la app se ha quedado antigua. Descarga la nueva e instálala encima: no pierdes la partida.")
                    .setPositiveButton("Descargar", (d, w) -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { /* sin navegador */ } })
                    .setNegativeButton("Ahora no", null).show());
            }
            if (v <= current() || !ids.containsKey(ver.optString("zip"))) return;
            byte[] zip = get(dl(ids.get(ver.getString("zip"))));
            if (!hex(MessageDigest.getInstance("SHA-256").digest(zip)).equalsIgnoreCase(ver.optString("sha256"))) return;   // descarga rota o manipulada: se ignora
            File tmp = new File(getFilesDir(), "www-new"); wipe(tmp); tmp.mkdirs();
            try (ZipInputStream z = new ZipInputStream(new java.io.ByteArrayInputStream(zip))) {
                ZipEntry en; byte[] buf = new byte[65536];
                while ((en = z.getNextEntry()) != null) {
                    File out = new File(tmp, en.getName());
                    if (!out.getCanonicalPath().startsWith(tmp.getCanonicalPath() + File.separator)) throw new SecurityException("ruta fuera de sitio");
                    if (en.isDirectory()) { out.mkdirs(); continue; }
                    out.getParentFile().mkdirs();
                    try (FileOutputStream fo = new FileOutputStream(out)) { int n; while ((n = z.read(buf)) > 0) fo.write(buf, 0, n); }
                }
            }
            if (!new File(tmp, "index.html").isFile() || !new File(tmp, "game.js").isFile()) { wipe(tmp); return; }
            wipe(www);
            if (!tmp.renameTo(www)) { wipe(tmp); return; }
            prefs.edit().putInt("v", v).apply();
            final int nv = v;
            runOnUiThread(() -> web.evaluateJavascript("(function(){try{return window.__kiteo.state.mode}catch(e){return ''}})()", mode -> {
                if (mode != null && mode.contains("title")) { web.reload(); Toast.makeText(this, "Juego actualizado a la versión " + nv, Toast.LENGTH_SHORT).show(); }
                else Toast.makeText(this, "Versión " + nv + " descargada: se aplicará la próxima vez que abras el juego", Toast.LENGTH_LONG).show();
            }));
        } catch (Exception e) { /* sin red o kDrive caído: se juega con lo que hay */ }
    }
    static String dl(int id) { return String.format(SHARE, 2) + "/files/" + id + "/download"; }
    static byte[] get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(8000); c.setReadTimeout(30000); c.setInstanceFollowRedirects(true);
        try (InputStream in = c.getInputStream()) {
            if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
            ByteArrayOutputStream o = new ByteArrayOutputStream(); byte[] buf = new byte[65536]; int n;
            while ((n = in.read(buf)) > 0) { o.write(buf, 0, n); if (o.size() > 80 * 1024 * 1024) throw new Exception("demasiado grande"); }
            return o.toByteArray();
        } finally { c.disconnect(); }
    }
    static String hex(byte[] b) { StringBuilder s = new StringBuilder(); for (byte x : b) s.append(String.format("%02x", x)); return s.toString(); }
    static void wipe(File f) { if (f == null || !f.exists()) return; File[] k = f.listFiles(); if (k != null) for (File c : k) wipe(c); f.delete(); }
    static String mime(String p) {
        if (p.endsWith(".html")) return "text/html"; if (p.endsWith(".js")) return "text/javascript"; if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".png")) return "image/png"; if (p.endsWith(".mp3")) return "audio/mpeg"; if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }
    static WebResourceResponse notFound() { return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), new java.io.ByteArrayInputStream(new byte[0])); }

    // Sirve el juego desde el almacenamiento interno (si hay una versión descargada) o desde dentro del APK
    // (estática y con el dueño pasado a mano: el compilador de Java 21 anota de otro modo las clases internas y la herramienta de Android no lo traga)
    static class Client extends WebViewClient {
        final MainActivity act;
        Client(MainActivity act) { this.act = act; }
        @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String p = u.getPath() == null || u.getPath().equals("/") ? "index.html" : u.getPath().substring(1);
            if (p.contains("..")) return notFound();
            try {
                File f = new File(act.www, p);
                InputStream in = f.isFile() ? new FileInputStream(f) : act.getAssets().open("www/" + p);
                WebResourceResponse res = new WebResourceResponse(mime(p), p.endsWith(".png") || p.endsWith(".mp3") ? null : "utf-8", in);
                Map<String, String> h = new HashMap<>(); h.put("Cache-Control", "no-store"); res.setResponseHeaders(h);
                return res;
            } catch (Exception e) { return notFound(); }
        }
        @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            if (HOST.equals(r.getUrl().getHost())) return false;
            try { act.startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception e) { /* sin navegador */ }
            return true;
        }
    }
}
