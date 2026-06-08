# Operational Runbook — start-project

> Day-to-day operations reference. For incident response see `INCIDENT_RUNBOOK.md`.
> Keep this document current — a stale runbook is more dangerous than no runbook.
> Each procedure must be executable by an on-call engineer without prior context.

---

## 1. Service Inventory

| Service        | Role               | Port     | Health endpoint  | Restart command                                        |
| :------------- | :----------------- | :------- | :--------------- | :----------------------------------------------------- |
| `[api-server]` | HTTP API           | `[3000]` | `GET /health`    | `[systemctl restart api / docker compose restart api]` |
| `[worker]`     | Background jobs    | —        | `GET /health`    | `[systemctl restart worker]`                           |
| `[database]`   | Primary data store | `[REPLACE: port]` | `[REPLACE: e.g. pg_isready]`     | `[REPLACE: e.g. systemctl restart postgresql]`  |
| `[cache]`      | Session / hot data | `[REPLACE: port]` | `[REPLACE: e.g. redis-cli ping]` | `[REPLACE: e.g. systemctl restart redis]`      |

---

## 2. Deploy

### 2.1 Standard deploy (CI/CD)

All production deploys go through CI. Manual deploys are only permitted during incidents.

```bash
# Trigger via git push to main — CI handles build, test, deploy
git push origin main

# Monitor deploy progress
[gh run watch / check CI dashboard URL]

# Verify deploy succeeded
curl -s https://[domain]/health | jq .
```

Expected healthy response:

```json
{ "status": "ok", "version": "[semver]", "uptime_s": [N] }
```

### 2.2 Manual deploy (incident only)

```bash
# Build and push image
docker build -t [registry]/[image]:[tag] .
docker push [registry]/[image]:[tag]

# Deploy to [environment]
[kubectl set image deployment/api api=[registry]/[image]:[tag]]
# or
[docker compose pull && docker compose up -d]

# Verify rollout
[kubectl rollout status deployment/api]
```

### 2.3 Pre-deploy checklist

- [ ] All CI checks passing on the target commit.
- [ ] Database migrations reviewed and tested.
- [ ] Feature flags configured for gradual rollout (if applicable).
- [ ] On-call engineer available for the 30 minutes following deploy.
- [ ] Rollback procedure known and tested.

---

## 3. Rollback

### 3.1 Application rollback

```bash
# Option A — revert to previous image tag
[kubectl set image deployment/api api=[registry]/[image]:[previous-tag]]

# Option B — revert git commit and redeploy via CI
git revert HEAD
git push origin main

# Verify rollback
curl -s https://[domain]/health | jq .version
```

### 3.2 Database migration rollback

> Only possible if the migration has a `down` script. Check `DATA_MODEL.md` section 7.

```bash
# Run down migration
[migration-tool down --steps 1]

# Verify schema version
[migration-tool status]
```

**If the migration is irreversible:** follow the dual-write rollback procedure documented in `DATA_MODEL.md` section 7, or escalate to `[tech-lead]`.

---

## 4. Scaling

### 4.1 Horizontal scale (stateless services)

```bash
# Scale up API replicas
[kubectl scale deployment/api --replicas=N]
# or
[docker service scale api=N]

# Verify
[kubectl get pods -l app=api]
```

### 4.2 Database connection pool

If DB connection exhaustion is observed (`FATAL: remaining connection slots are reserved`):

```bash
# Check current connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='[dbname]';"

# Increase pool size in app config (requires redeploy)
# ENV: DATABASE_POOL_MAX=[N]

# Short-term: terminate idle connections older than 10 minutes
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname='[dbname]' AND state='idle'
         AND query_start < NOW() - INTERVAL '10 minutes';"
```

### 4.3 Cache scaling

```bash
# [REPLACE: adapt to your cache — examples below]
# Redis:      redis-cli info memory | grep used_memory_human
# Memcached:  memcached-tool localhost stats | grep bytes
# (remove this section if no cache layer)
```

---

## 5. Database Operations

### 5.1 Run a migration

```bash
# Dry-run first — verify SQL before applying
[migration-tool migrate --dry-run]

# Apply
[migration-tool migrate]

# Verify
[migration-tool status]
```

### 5.2 Backup

```bash
# Manual backup (automated backups run at [HH:MM UTC] via [cron/cloud scheduler])
pg_dump -Fc [dbname] > backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup integrity
pg_restore --list backup_*.dump | head -20
```

### 5.3 Restore from backup

```bash
# Stop application traffic (or use read-replica for restore)
[scale down api replicas to 0]

# Restore
pg_restore -d [dbname] --clean --if-exists backup_[timestamp].dump

# Verify row counts match expectation
psql -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"

# Resume traffic
[scale up api replicas]
```

### 5.4 Slow query investigation

```bash
# Find queries running > 5 seconds
psql -c "SELECT pid, now() - query_start AS duration, query
         FROM pg_stat_activity
         WHERE state = 'active' AND now() - query_start > INTERVAL '5 seconds'
         ORDER BY duration DESC;"

# Kill a specific query
psql -c "SELECT pg_cancel_backend([pid]);"

# Force terminate if cancel does not work
psql -c "SELECT pg_terminate_backend([pid]);"
```

---

## 6. Secret Rotation

> Rotate secrets on schedule or immediately after any suspected exposure.

### 6.1 JWT signing secret

```bash
# 1. Generate new secret (≥256 bits)
openssl rand -hex 32
# Windows PowerShell alternative:
# [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# 2. Update secret in [secrets manager / environment]
[aws ssm put-parameter --name /[project]/JWT_SECRET --value "[new-secret]" --overwrite]
# or equivalent for your secrets manager

# 3. Redeploy (old tokens signed with previous secret will be invalid after TTL)
[trigger deploy]

# 4. Monitor for auth failures spike in logs
[tail log command — see section 7]
```

### 6.2 Database password

```bash
# 1. Create new password
openssl rand -base64 24

# 2. Update in database
psql -c "ALTER USER [app_user] PASSWORD '[new-password]';"

# 3. Update in secrets manager
[update secret]

# 4. Redeploy
[trigger deploy]

# 5. Verify connectivity
[health check endpoint]
```

### 6.3 API keys (third-party services)

For each third-party integration:

1. Generate new key in the provider's dashboard.
2. Update in secrets manager.
3. Redeploy.
4. Verify integration is functional.
5. Revoke old key in provider dashboard.

---

## 7. Log Access

```bash
# Application logs (last 100 lines)
[kubectl logs -l app=api --tail=100]
# or
[docker compose logs --tail=100 api]
# or
[journalctl -u api -n 100]

# Filter for errors only
[... | grep '"level":"error"']

# Filter by request ID (distributed tracing)
[... | grep '"request_id":"[uuid]"']

# Follow live
[kubectl logs -l app=api -f]
```

### Log levels and expected rates

| Level   | Normal rate          | Investigate if                |
| :------ | :------------------- | :---------------------------- |
| `error` | `[< N/min]`          | Rate spikes 5× above baseline |
| `warn`  | `[< N/min]`          | Sustained for > 5 minutes     |
| `info`  | High volume — normal | —                             |

---

## 8. Cache Operations

```bash
# [REPLACE: adapt to your cache — examples below]
# Redis:      redis-cli --scan --pattern '[prefix]:*' | xargs redis-cli del
# Memcached:  echo "flush_all" | nc localhost 11211

# Flush entire cache (use only in emergencies — causes thundering herd)
# Redis:      redis-cli FLUSHDB
# Memcached:  echo "flush_all" | nc localhost 11211

# Inspect a key
# Redis:      redis-cli GET [key]
# Redis:      redis-cli TTL [key]
```

---

## 9. Health Check Reference

| Check    | Command                               | Healthy output          |
| :------- | :------------------------------------ | :---------------------- |
| API      | `curl -s https://[domain]/health`     | `{"status":"ok"}`       |
| Database | `[REPLACE: e.g. pg_isready -h [host] -U [user]]`  | `[REPLACE: e.g. accepting connections]` |
| Cache    | `[REPLACE: e.g. redis-cli -h [host] ping]`        | `[REPLACE: e.g. PONG]`                 |
| Workers  | `curl -s http://[worker-host]/health` | `{"status":"ok"}`       |

---

## 10. Scheduled Maintenance

| Task             | Schedule               | Command                      | Notes                   |
| :--------------- | :--------------------- | :--------------------------- | :---------------------- |
| DB backup        | `[daily at HH:MM UTC]` | See section 5.2              | Retention: [N days]     |
| Secret rotation  | `[semi-annual]`        | See section 6                | Calendar invite: [link] |
| Dependency audit | `[weekly via CI]`      | `npm audit`                  | Alerts to `[channel]`   |
| Log rotation     | `[daily]`              | `[logrotate / cloud native]` | Retention: [N days]     |

---

## Debug & Profiling Procedures

See `LANGUAGE_TOOLCHAINS.md` for toolchain setup.

### Attach Debugger to Running Process

| Stack | Command / Method |
|---|---|
| **TypeScript/JS** | Start Node with `--inspect` or `--inspect-brk` flag and connect via Chrome DevTools or IDE |
| **.NET** | `dotnet-debugger attach <pid>` (VSDBG) or attach IDE debugger to the process ID |

### Capture Dump

```bash
# .NET Core Dump
dotnet-dump collect -p <pid> -o /tmp/app.dmp
dotnet-dump analyze /tmp/app.dmp

# Node.js Heap Dump
node --heapsnapshot-near-heap-limit=3 myapp.js
```

### Profile in Production (Low Overhead)

| Stack | Tool | Command / Notes |
|---|---|---|
| **TypeScript/JS** | `clinic` or native profiler | `node --prof myapp.js` or `clinic flame -- node myapp.js` |
| **.NET** | `dotnet-trace` | `dotnet-trace collect -p <pid>` |

### .NET GC Dump

```bash
dotnet-gcdump collect -p <pid> -o /tmp/app.gcdump
dotnet-gcdump report /tmp/app.gcdump
```
