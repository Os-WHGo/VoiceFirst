#!/usr/bin/env python3
"""Puerta de autorización para Claude Code.

Hace verificable el protocolo de `.claude/rules/autorizacion.md`: la autorización
solo nace de un mensaje del usuario (o de un plan aprobado en Plan Mode) y se
guarda fuera del alcance de las herramientas de escritura del modelo.

Un subcomando por evento de hook; cada uno lee el JSON del evento por stdin:

  prompt   UserPromptSubmit  concede o revoca la autorización según el mensaje
  pretool  PreToolUse        bloquea escrituras mientras no haya autorización
  plan     PostToolUse       (ExitPlanMode) un plan aprobado cuenta como autorización
  session  SessionStart      revoca al reanudar o limpiar y borra estados antiguos

Estado: $CLAUDE_AUTHZ_DIR o ~/.claude/authz/<session_id>.json, más log.jsonl
como registro auditable de cada concesión, revocación y bloqueo.
"""
import json
import os
import re
import shlex
import sys
import time
import unicodedata

STATE_DIR = os.environ.get("CLAUDE_AUTHZ_DIR") or os.path.join(os.path.expanduser("~"), ".claude", "authz")
LOG_MAX_BYTES = 1_000_000
STALE_SECONDS = 7 * 24 * 3600

# --- Detección de la aprobación -------------------------------------------------

APPROVAL_WORDS = {
    "comienza", "comiences", "comience", "comiencen", "empieza", "empieces", "empiece",
    "adelante", "procede", "procedas", "proceda", "sigue", "sigas", "continua", "continues",
    "autorizo", "autorizado", "autorizada", "apruebo", "aprobado", "aprobada", "hazlo", "dale",
    "proceed", "approved",
}
APPROVAL_PHRASES = ("go ahead",)
SHORT_YES = {"si", "ok", "okay", "vale", "yes", "claro", "perfecto", "dale", "venga", "por", "favor", "va"}
NEGATIONS = {"no", "nunca", "todavia", "aun", "espera", "esperes", "antes", "jamas", "don't", "dont", "not"}
CONFIG_WORDS = {"config", "configuracion"}
# Tras «que», estas formas son indicativo («lo que sigue»), no una orden («que sigas»).
NOT_AFTER_QUE = {"comienza", "empieza", "sigue", "continua", "procede"}
WINDOW = 8
QUESTION_MARKER = "quieres que comience"

PASTED_RE = re.compile(r"<pasted_content[^>]*>.*?</pasted_content[^>]*>", re.S)


def normalize(text):
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def strip_pasted(prompt):
    return PASTED_RE.sub(" ", prompt or "").strip()


def is_automatic(prompt):
    """Turnos que no escribió el usuario (tareas programadas, avisos de subagentes,
    mensajes entre sesiones) llegan envueltos en etiquetas: ni conceden ni revocan."""
    return strip_pasted(prompt).startswith("<")


def last_assistant_text(transcript_path):
    """Último texto del asistente en el transcript JSONL, o ''."""
    try:
        with open(transcript_path, encoding="utf-8") as f:
            lines = f.readlines()[-400:]
    except (OSError, TypeError):
        return ""
    for line in reversed(lines):
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        if entry.get("type") != "assistant":
            continue
        content = (entry.get("message") or {}).get("content")
        if isinstance(content, str) and content.strip():
            return content
        if isinstance(content, list):
            texts = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
            if any(t.strip() for t in texts):
                return "\n".join(texts)
    return ""


def classify(prompt, last_assistant=""):
    """Devuelve (aprobado, config) para un mensaje del usuario."""
    text = normalize(strip_pasted(prompt))
    words = re.findall(r"[a-z0-9']+", text)
    if not words:
        return False, False
    if text.rstrip().endswith("?") and words[0] not in ("si", "ok"):
        return False, False
    window = words[:WINDOW]
    approved = False
    for i, w in enumerate(window):
        if w in APPROVAL_WORDS and not (w in NOT_AFTER_QUE and i and window[i - 1] == "que"):
            approved = not any(n in NEGATIONS for n in window[:i])
            break
    if not approved and not any(n in NEGATIONS for n in window):
        head = " ".join(window)
        approved = any(p in head for p in APPROVAL_PHRASES)
    if not approved and len(words) <= 4 and all(w in SHORT_YES for w in words):
        # Un «sí» a secas solo vale como respuesta a «¿Quieres que comience?».
        approved = QUESTION_MARKER in normalize(last_assistant)
    config = approved and "autorizo" in window and any(w in CONFIG_WORDS for w in window)
    return approved, config


# --- Estado ---------------------------------------------------------------------

def _session_file(session_id):
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", session_id or "sin-sesion")
    return os.path.join(STATE_DIR, safe + ".json")


def load_grant(session_id):
    try:
        with open(_session_file(session_id), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def save_grant(session_id, source, scope, config=False):
    os.makedirs(STATE_DIR, exist_ok=True)
    grant = {"granted_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "source": source,
             "config": bool(config), "scope": (scope or "")[:4000]}
    tmp = _session_file(session_id) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(grant, f, ensure_ascii=False, indent=2)
    os.replace(tmp, _session_file(session_id))
    log("grant", session_id, source=source, config=bool(config))
    return grant


def revoke(session_id, why):
    try:
        os.remove(_session_file(session_id))
    except FileNotFoundError:
        return
    log("revoke", session_id, reason=why)


def log(event, session_id, **fields):
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        path = os.path.join(STATE_DIR, "log.jsonl")
        if os.path.exists(path) and os.path.getsize(path) > LOG_MAX_BYTES:
            os.replace(path, path + ".1")
        record = {"t": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "event": event, "session": session_id, **fields}
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        pass


# --- Clasificación de herramientas ----------------------------------------------

WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
READ_ARTIFACT_ACTIONS = {"list", "read", "open", "quickstart"}
READ_ARTIFACT_DATA_ACTIONS = {"get", "list", "query"}

READONLY_CMDS = {
    "ls", "cat", "head", "tail", "wc", "grep", "egrep", "fgrep", "rg", "tree", "pwd", "echo", "printf",
    "file", "stat", "du", "df", "which", "type", "whoami", "uname", "date", "sort", "uniq", "cut", "tr",
    "diff", "cmp", "comm", "jq", "basename", "dirname", "realpath", "readlink", "true", "false", "test",
    "cd", "nl", "column", "md5sum", "sha1sum", "sha256sum", "id", "hostname", "rev", "tac", "od", "xxd",
    "hexdump", "strings", "fold",
}
FIND_WRITE_FLAGS = {"-exec", "-execdir", "-ok", "-okdir", "-delete", "-fprint", "-fprint0", "-fprintf", "-fls"}
GIT_READONLY = {
    "status", "log", "diff", "show", "rev-parse", "ls-files", "ls-tree", "blame", "describe", "shortlog",
    "grep", "cat-file", "merge-base", "name-rev", "for-each-ref", "count-objects", "version", "fetch",
}
GIT_BRANCH_WRITE = {"-d", "-D", "-m", "-M", "-c", "-C", "-f", "-u", "--delete", "--move", "--copy", "--force",
                    "--set-upstream-to", "--unset-upstream", "--edit-description", "--track"}
SEPARATORS = {"&&", "||", ";", "|", "&", "(", ")", ";;", "|&"}

MCP_READ_VERBS = {"get", "list", "search", "read", "fetch", "find", "describe", "view", "whoami", "help",
                  "inspect", "count", "aggregate", "discover", "resolve", "scrape"}
MCP_WRITE_VERBS = {"create", "update", "delete", "write", "send", "post", "publish", "merge", "push", "edit",
                   "remove", "add", "set", "upload", "trash", "deploy", "run", "trigger", "fire", "apply",
                   "move", "copy", "rename", "buy", "cancel", "approve", "reply", "share", "fork", "label",
                   "unlabel", "mark", "unmark", "enable", "disable", "import", "generate", "resize", "comment",
                   "put", "patch", "insert", "append", "clear", "stop", "kill", "execute", "invoke", "install",
                   "submit", "restore", "revoke", "assign", "activate", "pause", "unpause", "transfer", "rerequest",
                   "record", "upsert", "stage", "invalidate", "verify", "replace", "test", "untrash",
                   "accept", "complete", "start", "extend", "follow", "unfollow", "save"}


def _split_segments(command):
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    segments, current = [], []
    for tok in lexer:
        if tok in SEPARATORS:
            if current:
                segments.append(current)
            current = []
        else:
            current.append(tok)
    if current:
        segments.append(current)
    return segments


def _has_write_redirect(segment):
    for i, tok in enumerate(segment):
        if set(tok) <= set("<>&") and ">" in tok:
            if tok.endswith("&"):  # 2>&1 y similares: duplica un descriptor, no escribe
                continue
            target = segment[i + 1] if i + 1 < len(segment) else ""
            if target != "/dev/null":
                return True
    return False


def _git_readonly(args):
    i = 0
    while i < len(args) and args[i].startswith("-"):
        if args[i] == "-c":  # config en línea: podría definir pagers o alias que ejecutan
            return False
        i += 2 if args[i] in ("-C", "--git-dir", "--work-tree") else 1
    if i >= len(args):
        return True
    sub, rest = args[i], args[i + 1:]
    if sub in GIT_READONLY:
        return True
    positional = [a for a in rest if not a.startswith("-")]
    if sub == "branch":
        if any(a in GIT_BRANCH_WRITE or a.split("=")[0] in GIT_BRANCH_WRITE for a in rest):
            return False
        return not positional or any(a in ("--list", "-l", "--contains", "--merged", "--no-merged",
                                             "--points-at") for a in rest)
    if sub == "tag":
        return not positional or any(a in ("-l", "--list", "--contains", "--points-at") for a in rest)
    if sub == "remote":
        return not positional or positional[0] in ("show", "get-url")
    if sub == "stash":
        return bool(positional) and positional[0] in ("list", "show")
    if sub == "config":
        return any(a in ("--get", "--get-all", "--get-regexp", "--list", "-l") for a in rest)
    return False


def is_readonly_bash(command):
    if not command or any(s in command for s in ("$(", "`", "<(", ">(")):
        return False
    try:
        segments = _split_segments(command)
    except ValueError:
        return False
    if not segments:
        return False
    for seg in segments:
        if _has_write_redirect(seg):
            return False
        prog, args = os.path.basename(seg[0]), seg[1:]
        if "=" in seg[0]:
            return False
        if prog == "git":
            if not _git_readonly(args):
                return False
        elif prog == "find":
            if any(a in FIND_WRITE_FLAGS for a in args):
                return False
        elif prog == "sed":
            if "-n" not in args or any(a == "-i" or a.startswith(("-i", "--in-place")) for a in args):
                return False
        elif prog not in READONLY_CMDS:
            return False
    return True


def is_readonly_mcp(tool_name):
    """Decide por el verbo inicial (get_label, label_message) y, si no es un verbo conocido,
    por el final (issue_read, firecrawl_search). Lo desconocido cuenta como escritura."""
    parts = tool_name.split("__", 2)
    tokens = [t for t in re.split(r"[_\-]+", (parts[2] if len(parts) == 3 else tool_name).lower()) if t]
    if not tokens:
        return False
    return tokens[0] in MCP_READ_VERBS or (tokens[0] not in MCP_WRITE_VERBS and tokens[-1] in MCP_READ_VERBS)


PROTECTED_MARKERS = ("hooks/authz", ".claude/settings.json", ".claude/settings.local.json",
                     "rules/autorizacion.md")


def _is_protected_path(path):
    if not path:
        return False
    p = os.path.realpath(os.path.expanduser(path)).replace(os.sep, "/")
    state = os.path.realpath(STATE_DIR).replace(os.sep, "/")
    return p == state or p.startswith(state + "/") or any(m in p for m in PROTECTED_MARKERS)


def touches_protected(tool, tool_input):
    if tool in WRITE_TOOLS:
        return _is_protected_path(tool_input.get("file_path") or tool_input.get("notebook_path"))
    if tool in ("Bash", "PowerShell"):
        cmd = tool_input.get("command") or ""
        markers = PROTECTED_MARKERS + (".claude/authz", "CLAUDE_AUTHZ_DIR", STATE_DIR)
        return any(m in cmd for m in markers) and not is_readonly_bash(cmd)
    return False


def needs_grant(tool, tool_input):
    if tool in WRITE_TOOLS or tool == "PowerShell":
        return True
    if tool == "Bash":
        return not is_readonly_bash(tool_input.get("command") or "")
    if tool.startswith("mcp__"):
        return not is_readonly_mcp(tool)
    if tool == "Artifact":
        return (tool_input.get("action") or "publish") not in READ_ARTIFACT_ACTIONS
    if tool == "ArtifactData":
        return (tool_input.get("action") or "") not in READ_ARTIFACT_DATA_ACTIONS
    return False


# --- Salidas ----------------------------------------------------------------------

NO_GRANT_MSG = (
    "Sin autorización del usuario para esta solicitud: esta acción modifica archivos, el proyecto o servicios "
    "externos. Termina de investigar si hace falta, presenta un resumen breve del trabajo propuesto y pregunta "
    "«¿Quieres que comience?». No intentes rodear este bloqueo."
)
PROTECTED_MSG = (
    "Archivo de configuración de autorización protegido (hooks/authz, settings.json o autorizacion.md). "
    "Solo se puede modificar si el usuario escribe «autorizo config» en su mensaje de aprobación."
)
CTX_GRANTED = (
    "[autorización] ACTIVA para esta solicitud (origen: {source}). Ejecuta todo el alcance aprobado sin pedir "
    "permisos repetidos; investiga y corrige errores y haz pruebas de regresión dentro de ese alcance. Pide "
    "nueva autorización solo ante un cambio importante de alcance, gastos, operaciones irreversibles, "
    "publicación en producción o riesgos relevantes. Al terminar, entrega: lo realizado, las pruebas y los "
    "pendientes."
)
CTX_NONE = (
    "[autorización] SIN autorización. Interpreta primero si el usuario conversa, consulta, propone una idea o "
    "solicita una ejecución; una idea no es una orden. Puedes leer, investigar y analizar. Antes de escribir "
    "código, editar archivos, instalar dependencias o modificar el proyecto, presenta un resumen breve y "
    "pregunta «¿Quieres que comience?». Un hook bloquea las escrituras hasta que el usuario lo confirme."
)


def emit(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False))


def context(event, text):
    emit({"hookSpecificOutput": {"hookEventName": event, "additionalContext": text}})


def deny(session_id, tool, reason):
    log("deny", session_id, tool=tool)
    emit({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                 "permissionDecisionReason": reason}})


# --- Eventos ----------------------------------------------------------------------

def on_prompt(data):
    sid, prompt = data.get("session_id"), data.get("prompt") or ""
    if is_automatic(prompt):
        grant = load_grant(sid)
    else:
        last = last_assistant_text(data.get("transcript_path"))
        approved, config = classify(prompt, last)
        if approved:
            grant = save_grant(sid, "mensaje del usuario", last or strip_pasted(prompt), config)
        else:
            revoke(sid, "nuevo mensaje sin aprobación")
            grant = None
    context("UserPromptSubmit", CTX_GRANTED.format(source=grant["source"]) if grant else CTX_NONE)


def on_pretool(data):
    sid, tool = data.get("session_id"), data.get("tool_name") or ""
    tool_input = data.get("tool_input") or {}
    grant = load_grant(sid)
    if touches_protected(tool, tool_input) and not (grant and grant.get("config")):
        deny(sid, tool, PROTECTED_MSG)
    elif not grant and needs_grant(tool, tool_input):
        deny(sid, tool, NO_GRANT_MSG)


def on_plan(data):
    if data.get("tool_name") != "ExitPlanMode":
        return
    response = data.get("tool_response") or {}
    plan = response.get("plan") if isinstance(response, dict) else None
    save_grant(data.get("session_id"), "plan aprobado en Plan Mode", plan or (data.get("tool_input") or {}).get("plan"))


def on_session(data):
    sid = data.get("session_id")
    if data.get("source") in ("resume", "clear", "fork"):
        revoke(sid, "sesión " + data.get("source"))
    try:
        now = time.time()
        for name in os.listdir(STATE_DIR):
            path = os.path.join(STATE_DIR, name)
            if name.endswith(".json") and now - os.path.getmtime(path) > STALE_SECONDS:
                os.remove(path)
    except OSError:
        pass
    grant = load_grant(sid)
    context("SessionStart", CTX_GRANTED.format(source=grant["source"]) if grant else CTX_NONE)


HANDLERS = {"prompt": on_prompt, "pretool": on_pretool, "plan": on_plan, "session": on_session}
SAFE_ON_ERROR = {"Read", "Glob", "Grep", "WebFetch", "WebSearch"}


def deferred_to_user_level():
    """Si esta es la copia de un proyecto y la de usuario ya está instalada, cede el paso
    para no evaluar ni inyectar contexto dos veces."""
    user_copy = os.path.join(os.path.expanduser("~"), ".claude", "hooks", "authz", "authz.py")
    if not os.path.isfile(user_copy) or os.path.realpath(user_copy) == os.path.realpath(__file__):
        return False
    try:
        with open(os.path.join(os.path.expanduser("~"), ".claude", "settings.json"), encoding="utf-8") as f:
            return "hooks/authz/authz.py" in f.read()
    except OSError:
        return False


def main(argv):
    if len(argv) != 2 or argv[1] not in HANDLERS:
        sys.stderr.write("uso: authz.py {%s}\n" % "|".join(HANDLERS))
        return 1
    if deferred_to_user_level():
        return 0
    try:
        data = json.load(sys.stdin)
    except ValueError:
        data = {}
    try:
        HANDLERS[argv[1]](data)
    except Exception as exc:  # noqa: BLE001 - un fallo nunca debe abrir la puerta
        if argv[1] == "pretool" and data.get("tool_name") not in SAFE_ON_ERROR:
            deny(data.get("session_id"), data.get("tool_name"), "Error interno del hook de autorización: %s" % exc)
        else:
            sys.stderr.write("authz: %s\n" % exc)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
