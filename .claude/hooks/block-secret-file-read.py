#!/usr/bin/env python3
"""PreToolUse guardrail: deny reads of .env / secret files.

Root-cause fix for the 2026-07-17 secret-leak incident, where a .env file
was read straight into the CC session transcript with nothing mechanically
blocking it.

This hook DENIES (never warns) when a tool would slurp a secret file:
  - Read tool  -> file_path whose basename is `.env`, `.env.<x>`, or `<x>.env`
  - Bash tool  -> a file-reading/printing utility (cat, echo, less, more,
                  head, tail, tac, nl, od, xxd, hexdump, strings, type,
                  Get-Content/gc) targeting a `.env`-style path

Scope note: this intentionally over-blocks (e.g. `.env.example`, an inert
template). Over-blocking a non-secret is harmless; a carve-out is exactly the
kind of hole that gets abused. Widen the allowlist deliberately if needed.

2026-07-27 extension (sixth credential exposure — a live key transited
.env.example): ALL `*.example` files join the pattern set, not just
.env-flavored ones. The assumption that example files only hold placeholders
is exactly what failed; a companion pre-commit hook (.githooks/) blocks
secret-SHAPED values from ever committing in env-pattern files.

Contract: print a PreToolUse permissionDecision=deny JSON object to block;
print nothing and exit 0 to let the call proceed. Parse failures fail OPEN
here on purpose -- the built-in permissions.deny rules in settings.json are
the fail-closed backstop for the Read vector, so this hook never bricks the
whole tool pipeline if stdin is malformed.
"""
import sys
import os
import re
import json


def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def allow() -> None:
    # No output + exit 0 => no-op, normal permission flow continues.
    sys.exit(0)


def is_env_basename(path: str) -> bool:
    base = os.path.basename(path.strip().strip('"').strip("'"))
    return (
        base == ".env"
        or base.startswith(".env.")
        or base.endswith(".env")
        or base.endswith(".example")
    )


# A file-reading/printing utility applied DIRECTLY to a .env-style path:
#   <reader> [optional flags / numeric args] <.env path>
# Requiring adjacency (not just "reader word somewhere" AND ".env somewhere")
# avoids false positives like a commit message mentioning ".env.example" next
# to an unrelated word such as "more". Still catches `cat .env`, `head -5
# .env.local`, `/bin/cat ./.env`, `echo $(cat .env)`, `less prod.env`.
CMD_READ = re.compile(
    r"\b(?:cat|tac|echo|printf|less|more|head|tail|nl|od|xxd|hexdump|"
    r"strings|type|Get-Content|gc)\b"          # a reader in command position
    r"(?:\s+-{1,2}[A-Za-z0-9][\w-]*|\s+[0-9]+)*"  # optional flags / numeric args
    r"\s+[\"']?"                                # separator + optional open quote
    r"(?:[^\s\"'|;&]*[/\\])?"                   # optional directory prefix
    r"(?:\.env(?:\.[^\s\"'|;&]*)?|[^\s\"'/\\|;&]*\.env"
    r"|[^\s\"'/\\|;&]*\.example)",              # .env token or *.example file
    re.IGNORECASE,
)


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        allow()  # fail open; permissions.deny still covers Read
        return

    tool = data.get("tool_name", "")
    tool_input = data.get("tool_input") or {}

    if tool == "Read":
        fp = tool_input.get("file_path", "") or ""
        if is_env_basename(fp):
            deny(
                f"Blocked by the .env secret-file guardrail "
                f"(.claude/hooks/block-secret-file-read.py): reading '{fp}' "
                f"could leak secrets into the session transcript. Extract only "
                f"non-secret fragments (e.g. host id via grep -oE 'ep-[a-z0-9-]+')."
            )
        allow()

    if tool == "Bash":
        cmd = tool_input.get("command", "") or ""
        if CMD_READ.search(cmd):
            deny(
                "Blocked by the .env secret-file guardrail "
                "(.claude/hooks/block-secret-file-read.py): this command reads a "
                ".env-style secret file. Never print full secret files/values; "
                "extract only the non-secret host/branch fragment you need."
            )
        allow()

    allow()


if __name__ == "__main__":
    main()
