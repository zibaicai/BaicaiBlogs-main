# Public access protection

Server-side configuration used during public testing:

- `nginx-ratelimit.conf` → `/etc/nginx/conf.d/baicai-ratelimit.conf`
- `jail-baicai.conf` → `/etc/fail2ban/jail.d/baicai.conf`
- `filter-baicai-scan.conf` → `/etc/fail2ban/filter.d/baicai-scan.conf`
- `filter-baicai-limit.conf` → `/etc/fail2ban/filter.d/baicai-limit.conf`
- `filter-ufw-scan.conf` → `/etc/fail2ban/filter.d/ufw-scan.conf`
- `jail-ufw-scan.conf` → `/etc/fail2ban/jail.d/ufw-scan.conf`

Firewall only exposes:

```text
22/tcp
80/tcp
443/tcp
```

Ports 3000/3001/3002/8080 must stay private.

UFW: deny incoming by default; allow 22, 80, 443 only. UFW blocked packets are
logged to syslog and picked up by the ufw-scan jail. The backend also performs
login failure tracking and temporary IP bans.

## Turnstile

Set these variables in `/etc/baicai/backend.env` before enabling public
registration:

```text
TURNSTILE_SITE_KEY=<public site key>
TURNSTILE_SECRET=<secret key>
```

When either variable is empty, registration is deliberately closed.

For the complete environment-variable reference, see
[`docs/configuration.md`](../../docs/configuration.md).
