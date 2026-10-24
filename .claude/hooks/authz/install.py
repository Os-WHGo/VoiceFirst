#!/usr/bin/env python3
"""Instala el protocolo de autorización sin sobrescribir configuraciones existentes.

  python3 .claude/hooks/authz/install.py user [--skills] [--dry-run]
      ~/.claude: hook, regla de conducta y entradas en ~/.claude/settings.json.
      Cubre todos tus repositorios en esta máquina.
  python3 .claude/hooks/authz/install.py project <repo> [--skills] [--dry-run]
      <repo>/.claude: lo mismo, versionado en el repositorio. Necesario para las
      sesiones en la nube, donde ~/.claude no persiste.

Reglas de la instalación:
  * settings.json se combina: se añaden los hooks y las reglas `ask` que falten y no se
    toca nada más. Hay copia de seguridad (.bak-<fecha>) antes de cualquier cambio.
  * Volver a ejecutarlo no duplica nada.
  * Un archivo propio (authz.py, autorizacion.md) que ya exista con otro contenido se
    respalda antes de reemplazarlo. Las skills que ya existan no se tocan.
"""
import argparse
import filecmp
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.realpath(__file__))
SOURCE_CLAUDE = os.path.dirname(os.path.dirname(HERE))
SKILLS = ("brand-identity", "frontend-design", "canvas-design")
HOOK_MARK = "hooks/authz/authz.py"

# Operaciones que piden confirmación aunque exista autorización (punto 8 del protocolo):
# irreversibles, de publicación o de producción. Las reglas `ask` se evalúan aunque un
# hook devuelva "allow" y también en modo auto.
ASK_RULES = [
    "Bash(git push --force *)", "Bash(git push -f *)", "Bash(git push --force-with-lease *)",
    "Bash(git push * main)", "Bash(git push * master)", "Bash(git push * HEAD:main)",
    "Bash(git push * HEAD:master)", "Bash(git reset --hard *)", "Bash(git clean *)",
    "Bash(rm -rf *)", "Bash(rm -fr *)",
    "Bash(npm publish *)", "Bash(pnpm publish *)", "Bash(yarn publish *)", "Bash(twine upload *)",
    "Bash(vercel --prod *)", "Bash(vercel deploy *)", "Bash(wrangler deploy *)", "Bash(firebase deploy *)",
    "Bash(terraform apply *)", "Bash(terraform destroy *)", "Bash(kubectl apply *)", "Bash(kubectl delete *)",
    "mcp__*__merge_pull_request", "mcp__*__create_deployment", "mcp__*__request_promote",
    "mcp__*__buy_domain", "mcp__*__send_message", "mcp__*__forward", "mcp__*__share_file",
    "mcp__*__publish*", "mcp__*__delete*",
]


def hooks_fragment(script):
    def entry(sub, timeout=10):
        return {"type": "command", "command": 'python3 "%s" %s' % (script, sub), "timeout": timeout}
    return {
        "SessionStart": [{"hooks": [entry("session")]}],
        "UserPromptSubmit": [{"hooks": [entry("prompt")]}],
        "PreToolUse": [{"matcher": "*", "hooks": [entry("pretool")]}],
        "PostToolUse": [{"matcher": "ExitPlanMode", "hooks": [entry("plan")]}],
    }


def merge_settings(settings, script):
    """Devuelve (settings combinados, lista de cambios). No modifica la entrada."""
    out = json.loads(json.dumps(settings))
    changes = []
    hooks = out.setdefault("hooks", {})
    for event, groups in hooks_fragment(script).items():
        existing = hooks.setdefault(event, [])
        if any(HOOK_MARK in (h.get("command") or "") for g in existing for h in g.get("hooks", [])):
            continue
        existing.extend(groups)
        changes.append("hook " + event)
    ask = out.setdefault("permissions", {}).setdefault("ask", [])
    for rule in ASK_RULES:
        if rule not in ask:
            ask.append(rule)
            changes.append("ask " + rule)
    return out, changes


def backup(path, dry):
    if os.path.exists(path):
        dest = "%s.bak-%s" % (path, time.strftime("%Y%m%d-%H%M%S"))
        if not dry:
            (shutil.copytree if os.path.isdir(path) else shutil.copy2)(path, dest)
        return dest
    return None


def install_file(src, dest, dry, log):
    if os.path.exists(dest) and (os.path.samefile(src, dest) or filecmp.cmp(src, dest, shallow=False)):
        log("sin cambios  %s" % dest)
        return
    saved = backup(dest, dry)
    if not dry:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(src, dest)
    log("instalado    %s%s" % (dest, " (respaldo: %s)" % saved if saved else ""))


def install_settings(path, script, dry, log):
    try:
        with open(path, encoding="utf-8") as f:
            current = json.load(f)
    except FileNotFoundError:
        current = {}
    except ValueError as exc:
        raise SystemExit("%s no es JSON válido (%s); corrígelo antes de instalar." % (path, exc))
    merged, changes = merge_settings(current, script)
    if not changes:
        log("sin cambios  %s" % path)
        return
    saved = backup(path, dry)
    if not dry:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path + ".tmp", "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(path + ".tmp", path)
    log("combinado    %s: %d entradas nuevas%s" % (path, len(changes), " (respaldo: %s)" % saved if saved else ""))


def install_skills(dest_dir, dry, log):
    for name in SKILLS:
        src, dest = os.path.join(SOURCE_CLAUDE, "skills", name), os.path.join(dest_dir, name)
        if not os.path.isdir(src):
            log("falta skill  %s" % src)
        elif os.path.exists(dest):
            log("ya existe    %s (no se toca)" % dest)
        else:
            if not dry:
                shutil.copytree(src, dest)
            log("instalada    %s" % dest)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("scope", choices=("user", "project"))
    ap.add_argument("repo", nargs="?", help="raíz del repositorio (solo con 'project')")
    ap.add_argument("--skills", action="store_true", help="copiar también las skills de diseño")
    ap.add_argument("--dry-run", action="store_true", help="mostrar los cambios sin escribir nada")
    args = ap.parse_args(argv)

    if args.scope == "user":
        target = os.path.join(os.path.expanduser("~"), ".claude")
        script = "$HOME/.claude/hooks/authz/authz.py"
    else:
        if not args.repo:
            ap.error("'project' necesita la ruta del repositorio")
        target = os.path.join(os.path.realpath(args.repo), ".claude")
        script = "$CLAUDE_PROJECT_DIR/.claude/hooks/authz/authz.py"

    log = lambda msg: print(("[simulación] " if args.dry_run else "") + msg)
    install_file(os.path.join(HERE, "authz.py"), os.path.join(target, "hooks", "authz", "authz.py"), args.dry_run, log)
    install_file(os.path.join(SOURCE_CLAUDE, "rules", "autorizacion.md"),
                 os.path.join(target, "rules", "autorizacion.md"), args.dry_run, log)
    install_settings(os.path.join(target, "settings.json"), script, args.dry_run, log)
    if args.skills:
        install_skills(os.path.join(target, "skills"), args.dry_run, log)
    return 0


if __name__ == "__main__":
    sys.exit(main())
