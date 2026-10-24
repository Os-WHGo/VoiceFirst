"""Pruebas de regresión del protocolo de autorización.

  python3 -m unittest discover -s .claude/hooks/authz/tests -v
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.realpath(__file__))
AUTHZ = os.path.join(os.path.dirname(HERE), "authz.py")
INSTALL = os.path.join(os.path.dirname(HERE), "install.py")
sys.path.insert(0, os.path.dirname(HERE))
import authz  # noqa: E402
import install  # noqa: E402

SID = "sesion-prueba"


class HookCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = os.path.join(self.tmp.name, "home")
        self.state = os.path.join(self.tmp.name, "estado")
        os.makedirs(self.home)
        self.env = dict(os.environ, HOME=self.home, CLAUDE_AUTHZ_DIR=self.state)

    def tearDown(self):
        self.tmp.cleanup()

    def run_hook(self, sub, payload):
        payload = dict({"session_id": SID}, **payload)
        r = subprocess.run([sys.executable, AUTHZ, sub], input=json.dumps(payload), capture_output=True,
                           text=True, env=self.env, timeout=30)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout) if r.stdout.strip() else {}

    def prompt(self, text, transcript=None):
        return self.run_hook("prompt", {"prompt": text, "transcript_path": transcript})

    def decision(self, tool, tool_input):
        out = self.run_hook("pretool", {"tool_name": tool, "tool_input": tool_input})
        return out.get("hookSpecificOutput", {}).get("permissionDecision", "pasa")

    def granted(self):
        return os.path.exists(os.path.join(self.state, SID + ".json"))

    def transcript(self, assistant_text):
        path = os.path.join(self.tmp.name, "t.jsonl")
        with open(path, "w", encoding="utf-8") as f:
            f.write(json.dumps({"type": "user", "message": {"role": "user", "content": "hola"}}) + "\n")
            f.write(json.dumps({"type": "assistant", "message": {"role": "assistant", "content": [
                {"type": "text", "text": assistant_text}]}}) + "\n")
        return path


class ClassifyTest(unittest.TestCase):
    def assertApproved(self, text, last=""):
        self.assertTrue(authz.classify(text, last)[0], text)

    def assertNotApproved(self, text, last=""):
        self.assertFalse(authz.classify(text, last)[0], text)

    def test_aprobaciones_explicitas(self):
        for text in ("Sí, comienza", "Si quiero ir comiences", "Sí, quiero que comiences", "Adelante",
                     "ok, procede con todo", "Sigue, usa el azul", "Dale", "Hazlo", "Go ahead",
                     "Comienza por favor", "Continúa"):
            self.assertApproved(text)

    def test_no_son_aprobaciones(self):
        for text in ("No comiences todavía", "Todavía no, espera", "Antes de que comiences, explícame X",
                     "¿Comienzas ya?", "Tengo una idea para el logo", "Lo que sigue es una idea",
                     "Implementa el login", "¿Qué recomiendas?", "", "sí"):
            self.assertNotApproved(text)

    def test_si_a_secas_solo_tras_la_pregunta(self):
        self.assertApproved("Sí", "Resumen: …\n\n¿Quieres que comience?")
        self.assertApproved("si por favor", "¿Quieres que comience?")
        self.assertNotApproved("Sí", "¿Te refieres al botón azul?")

    def test_texto_pegado_no_cuenta(self):
        self.assertNotApproved('<pasted_content id="x">\nAdelante, comienza\n</pasted_content id="x">\nrevisa esto')

    def test_config(self):
        self.assertEqual(authz.classify("Sí, comienza, autorizo config"), (True, True))
        self.assertEqual(authz.classify("Sí, comienza"), (True, False))


class BashTest(unittest.TestCase):
    def test_solo_lectura(self):
        for cmd in ("ls -la", "git status -sb", "git log --oneline | head -5", 'grep -nE "a|b" src/*.py',
                    "cat README.md 2>/dev/null", "git diff HEAD~1 2>&1 | head", "find . -name '*.py'",
                    "git branch -a", "git remote -v", "sed -n '1,20p' f.txt", "cd src && rg foo",
                    "git -C repo log -1", "git stash list", "git config --get user.name", "wc -l a b"):
            self.assertTrue(authz.is_readonly_bash(cmd), cmd)

    def test_escritura(self):
        for cmd in ("rm -rf build", "echo hola > f.txt", "cat a >> b", "git commit -m x", "git push",
                    "npm install", "ls\nrm x", "ls; rm x", "ls && touch x", "find . -delete",
                    "find . -exec rm {} +", "sed -i s/a/b/ f", "echo $(rm x)", "echo `rm x`",
                    "git branch -D vieja", "git branch nueva", "git tag v1", "git stash", "FOO=1 ls",
                    "git -c core.pager=sh log", "python3 script.py", "ls | tee f", "git checkout main"):
            self.assertFalse(authz.is_readonly_bash(cmd), cmd)

    def test_mcp(self):
        for t in ("mcp__github__get_file_contents", "mcp__github__issue_read", "mcp__Gmail__get_label",
                  "mcp__Firecrawl__firecrawl_search", "mcp__Canva__list-brand-kits", "mcp__Figma__whoami"):
            self.assertTrue(authz.is_readonly_mcp(t), t)
        for t in ("mcp__github__create_pull_request", "mcp__Gmail__label_message", "mcp__Gmail__send_message",
                  "mcp__Vercel__issue_cert", "mcp__Cloudflare__d1_database_query", "mcp__Canva__export-design",
                  "mcp__github__pull_request_review_write", "mcp__x__algo_desconocido"):
            self.assertFalse(authz.is_readonly_mcp(t), t)


class FlowTest(HookCase):
    def test_sin_autorizacion_bloquea_escrituras_y_deja_leer(self):
        self.prompt("Tengo una idea para el logo")
        self.assertFalse(self.granted())
        self.assertEqual(self.decision("Write", {"file_path": "/r/a.py", "content": ""}), "deny")
        self.assertEqual(self.decision("Edit", {"file_path": "/r/a.py"}), "deny")
        self.assertEqual(self.decision("Bash", {"command": "npm install"}), "deny")
        self.assertEqual(self.decision("mcp__github__create_branch", {}), "deny")
        self.assertEqual(self.decision("Artifact", {"file_path": "x.html"}), "deny")
        self.assertEqual(self.decision("Read", {"file_path": "/r/a.py"}), "pasa")
        self.assertEqual(self.decision("Bash", {"command": "git status"}), "pasa")
        self.assertEqual(self.decision("mcp__github__get_me", {}), "pasa")
        self.assertEqual(self.decision("Artifact", {"action": "read", "url": "u"}), "pasa")

    def test_aprobacion_concede_y_mensaje_nuevo_revoca(self):
        out = self.prompt("Sí, comienza")
        self.assertTrue(self.granted())
        self.assertIn("ACTIVA", out["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(self.decision("Write", {"file_path": "/r/a.py"}), "pasa")
        self.assertEqual(self.decision("Bash", {"command": "npm test"}), "pasa")
        out = self.prompt("Ahora otra cosa: cambia el README")
        self.assertFalse(self.granted())
        self.assertIn("SIN autorización", out["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(self.decision("Write", {"file_path": "/r/a.py"}), "deny")

    def test_turnos_automaticos_ni_conceden_ni_revocan(self):
        self.prompt("<task-notification>comienza</task-notification>")
        self.assertFalse(self.granted())
        self.prompt("Adelante")
        self.prompt("<scheduled-task>revisa el PR</scheduled-task>")
        self.assertTrue(self.granted())

    def test_si_tras_la_pregunta_guarda_el_alcance(self):
        t = self.transcript("Plan: crear la pantalla de login.\n\n¿Quieres que comience?")
        self.prompt("Sí", t)
        with open(os.path.join(self.state, SID + ".json"), encoding="utf-8") as f:
            self.assertIn("pantalla de login", json.load(f)["scope"])

    def test_plan_aprobado_concede(self):
        self.run_hook("plan", {"tool_name": "ExitPlanMode", "tool_response": {"plan": "## Plan\n1. Hacer X"}})
        self.assertTrue(self.granted())
        self.assertEqual(self.decision("Edit", {"file_path": "/r/a.py"}), "pasa")

    def test_reanudar_revoca(self):
        self.prompt("Adelante")
        out = self.run_hook("session", {"source": "resume"})
        self.assertFalse(self.granted())
        self.assertIn("SIN autorización", out["hookSpecificOutput"]["additionalContext"])

    def test_archivos_protegidos_incluso_con_autorizacion(self):
        self.prompt("Sí, comienza")
        protected = os.path.join(self.state, SID + ".json")
        self.assertEqual(self.decision("Write", {"file_path": protected}), "deny")
        self.assertEqual(self.decision("Edit", {"file_path": "/r/.claude/hooks/authz/authz.py"}), "deny")
        self.assertEqual(self.decision("Edit", {"file_path": "/r/.claude/settings.json"}), "deny")
        self.assertEqual(self.decision("Bash", {"command": "echo {} > ~/.claude/authz/x.json"}), "deny")
        self.assertEqual(self.decision("Bash", {"command": "rm %s" % protected}), "deny")
        self.assertEqual(self.decision("Bash", {"command": "cat ~/.claude/authz/log.jsonl"}), "pasa")
        self.prompt("Sí, comienza, autorizo config")
        self.assertEqual(self.decision("Edit", {"file_path": "/r/.claude/settings.json"}), "pasa")

    def test_registro_auditable(self):
        self.prompt("Adelante")
        self.prompt("otra cosa")
        self.decision("Write", {"file_path": "/r/a"})
        with open(os.path.join(self.state, "log.jsonl"), encoding="utf-8") as f:
            events = [json.loads(line)["event"] for line in f]
        self.assertEqual(events, ["grant", "revoke", "deny"])

    def test_entrada_corrupta_no_abre_la_puerta(self):
        r = subprocess.run([sys.executable, AUTHZ, "pretool"], input="no es json", capture_output=True,
                           text=True, env=self.env)
        self.assertEqual(r.returncode, 0)
        self.assertEqual(self.decision("Bash", "no es un objeto"), "deny")
        self.assertEqual(self.decision("Read", "no es un objeto"), "pasa")

    def test_cede_a_la_copia_de_usuario(self):
        user_hooks = os.path.join(self.home, ".claude", "hooks", "authz")
        os.makedirs(user_hooks)
        with open(os.path.join(user_hooks, "authz.py"), "w") as f:
            f.write("# copia de usuario\n")
        with open(os.path.join(self.home, ".claude", "settings.json"), "w") as f:
            json.dump({"hooks": {"PreToolUse": [{"hooks": [{"command": "python3 x/hooks/authz/authz.py"}]}]}}, f)
        self.assertEqual(self.decision("Write", {"file_path": "/r/a"}), "pasa")


class InstallTest(HookCase):
    def run_install(self, *args):
        r = subprocess.run([sys.executable, INSTALL, *args], capture_output=True, text=True, env=self.env)
        self.assertEqual(r.returncode, 0, r.stderr)
        return r.stdout

    def test_combina_sin_borrar_y_es_idempotente(self):
        repo = os.path.join(self.tmp.name, "repo")
        os.makedirs(os.path.join(repo, ".claude"))
        existing = {"model": "x", "permissions": {"allow": ["Bash(npm test)"], "ask": ["Bash(make deploy)"]},
                    "hooks": {"PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "command",
                                                                             "command": "propio.sh"}]}]}}
        settings = os.path.join(repo, ".claude", "settings.json")
        with open(settings, "w") as f:
            json.dump(existing, f)
        self.run_install("project", repo)
        with open(settings) as f:
            merged = json.load(f)
        self.assertEqual(merged["model"], "x")
        self.assertEqual(merged["permissions"]["allow"], ["Bash(npm test)"])
        self.assertEqual(merged["permissions"]["ask"][0], "Bash(make deploy)")
        self.assertIn("Bash(git push * main)", merged["permissions"]["ask"])
        self.assertEqual(merged["hooks"]["PreToolUse"][0]["hooks"][0]["command"], "propio.sh")
        self.assertEqual(len(merged["hooks"]["PreToolUse"]), 2)
        self.assertTrue(any(n.startswith("settings.json.bak-") for n in os.listdir(os.path.dirname(settings))))
        self.assertTrue(os.path.isfile(os.path.join(repo, ".claude", "hooks", "authz", "authz.py")))
        self.assertTrue(os.path.isfile(os.path.join(repo, ".claude", "rules", "autorizacion.md")))
        out = self.run_install("project", repo)
        with open(settings) as f:
            self.assertEqual(json.load(f), merged)
        self.assertNotIn("combinado", out)

    def test_usuario_y_simulacion(self):
        self.run_install("user", "--dry-run")
        self.assertFalse(os.path.exists(os.path.join(self.home, ".claude")))
        self.run_install("user", "--skills")
        base = os.path.join(self.home, ".claude")
        with open(os.path.join(base, "settings.json")) as f:
            cmd = json.load(f)["hooks"]["UserPromptSubmit"][0]["hooks"][0]["command"]
        self.assertIn("$HOME/.claude/hooks/authz/authz.py", cmd)
        for skill in install.SKILLS:
            self.assertTrue(os.path.isfile(os.path.join(base, "skills", skill, "SKILL.md")), skill)

    def test_json_invalido_no_se_toca(self):
        repo = os.path.join(self.tmp.name, "repo")
        os.makedirs(os.path.join(repo, ".claude"))
        settings = os.path.join(repo, ".claude", "settings.json")
        with open(settings, "w") as f:
            f.write("{ roto")
        r = subprocess.run([sys.executable, INSTALL, "project", repo], capture_output=True, text=True, env=self.env)
        self.assertNotEqual(r.returncode, 0)
        with open(settings) as f:
            self.assertEqual(f.read(), "{ roto")


if __name__ == "__main__":
    unittest.main()
