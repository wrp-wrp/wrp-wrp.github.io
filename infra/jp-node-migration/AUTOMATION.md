# Automated Backup and Recovery Pipeline

## Pipeline

```text
JP systemd timer ── daily encrypted export ── restore stage-only verification
       │
       └── GitHub Actions schedule ── restricted SSH download
                                      ├── SHA-256 verification
                                      ├── off-site restore drill
                                      └── encrypted artifact, 14-day retention
```

The production cutover is intentionally not automatic. Restoring onto a new VPS still
requires the local `./migrate restore` command and the explicit word `APPLY`.

## Schedule

- JP systemd timer: every day at `20:15 UTC`, with up to 15 minutes of jitter.
- GitHub Actions: every day at `21:15 UTC`.
- Server retention: 14 days.
- GitHub encrypted artifact retention: 14 days.

Every backup is decrypted and checked with `restore-node --stage-only` before it becomes
`latest.enc`.

## Credentials

The pipeline uses a dedicated Ed25519 key. It is not the administrator SSH key.

The corresponding server entry uses:

```text
restrict,command="/usr/local/sbin/node-backup-gateway"
```

The key cannot open a shell or request forwarding. The gateway accepts only:

- `export`
- `latest`
- `latest-sha256`
- `status`

The archive passphrase is stored in:

- macOS Keychain service `jp-node-migration-archive`;
- `/etc/node-migration/archive.passphrase` on JP, mode `0600`;
- GitHub Actions secret `JP_ARCHIVE_PASSPHRASE`.

The GitHub repository also contains:

- secret `JP_BACKUP_SSH_KEY`;
- Actions variable `JP_BACKUP_HOST=jp.ppmister.com`;
- environment `migration-backup`.

## Operations

Inspect the server timer:

```bash
ssh jp 'systemctl status node-migration-backup.timer'
```

Run a backup immediately:

```bash
ssh jp 'systemctl start node-migration-backup.service'
```

Inspect the latest verified backup:

```bash
ssh -i ~/.ssh/jp_backup_ci root@jp.ppmister.com status
```

Trigger GitHub off-site backup after the workflow is merged into the default branch:

```bash
gh workflow run node-migration.yml
gh run watch
```

Recover the archive passphrase locally without printing it:

```bash
security find-generic-password \
  -a "$USER" \
  -s jp-node-migration-archive \
  -w > /path/to/root-only-passphrase-file
chmod 0600 /path/to/root-only-passphrase-file
```

## Host key rotation

`config/known_hosts` pins the JP SSH host key. A host-key change causes the Actions job
to fail closed. After a legitimate VPS replacement, verify the new fingerprint through
the provider console and update this file deliberately.
