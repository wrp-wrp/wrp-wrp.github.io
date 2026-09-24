# Migration QA

Date: 2026-07-26

## Source node

- OS: Debian 13, amd64
- Managed services: Nginx, panel API, Xray, Hysteria 2, WireGuard, Fail2ban
- Managed listeners: TCP 22/80/443 and UDP 443/51820

## Tests performed

- `bash -n` passed for every migration script.
- Secret scan passed; no current proxy password, private key, token, UUID, or fixed
  server IP is stored in the kit.
- Export manifest resolved 53 live paths with 0 missing required paths.
- Live SQLite traffic data was exported through `.backup`, not copied while open.
- A real AES-256 encrypted archive was produced on the JP node.
- Ciphertext SHA-256 verification passed.
- The archive decrypted and passed `--stage-only` validation.
- The stage-only restore did not change destination files or restart services.
- Passphrase files readable by group/others were rejected.
- The test archive and temporary passphrase were deleted after the test.
- All six production services remained active after the exercise.
- Public DNS, HTTPS login, Nginx config, Xray config, and five listeners passed
  the post-test verifier.
- The daily systemd timer produced and verified a live 22 MiB encrypted backup.
- The dedicated GitHub Actions key was accepted for `status`, backup download, and
  checksum retrieval.
- An arbitrary `uname` request through the same key was rejected by the forced-command
  gateway.
- The downloaded ciphertext matched the gateway SHA-256 value.
- The archive passphrase is present in macOS Keychain, a mode-0600 server file, and a
  write-only GitHub Actions secret.
- ShellCheck passed at warning severity for all migration and automation scripts.

## Result

The tested encrypted archive was 22 MiB. Formal apply testing is intentionally deferred
until a separate destination VPS is available, because applying the archive to the source
node would overwrite live state and would not test a real host migration.

final result: passed
