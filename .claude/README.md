# Configuración de Claude Code

| Ruta | Qué es |
|---|---|
| `rules/autorizacion.md` | Protocolo de autorización inicial (conducta) |
| `hooks/authz/authz.py` | Hooks que hacen el protocolo verificable |
| `hooks/authz/install.py` | Instalador que combina, sin sobrescribir, en otros repositorios o en `~/.claude` |
| `hooks/authz/tests/` | Pruebas de regresión |
| `settings.json` | Generado por `install.py project .`: hooks y reglas `ask` |
| `skills/` | Skills de diseño fijadas a una versión (ver `skills/FUENTES.md`) |

## Uso diario

- Claude responde a consultas e ideas sin tocar nada. Antes de modificar algo, presenta un
  resumen y pregunta «¿Quieres que comience?».
- Para autorizar, empieza el mensaje con «Sí, comienza», «Adelante», «Sigue»… (o responde «Sí»
  justo después de la pregunta).
- Cualquier mensaje nuevo que no sea una aprobación revoca la autorización. Para corregir algo a
  mitad de una tarea sin perderla, empieza con «Sigue, …».
- Para cambiar esta misma configuración, añade «autorizo config» a la aprobación.
- Registro auditable de concesiones, revocaciones y bloqueos: `~/.claude/authz/log.jsonl`.

## Instalar en otros sitios

```bash
# En tu máquina, para todos los repositorios (combina con ~/.claude/settings.json; copia de seguridad incluida)
python3 .claude/hooks/authz/install.py user --skills --dry-run   # revisa primero
python3 .claude/hooks/authz/install.py user --skills

# En otro repositorio (necesario para sesiones en la nube, donde ~/.claude no persiste)
python3 .claude/hooks/authz/install.py project ../OtroRepo --skills
```

Con la copia de usuario instalada, la copia de cada proyecto se desactiva sola para no
duplicarse. Requisitos: Python 3.8 o superior en el `PATH` como `python3` (en Windows, Git Bash
o WSL).

## Pruebas

```bash
python3 -m unittest discover -s .claude/hooks/authz/tests -v
```
