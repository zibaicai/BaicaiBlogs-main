# Public access protection

Server-side configuration used during public testing:

- `nginx-ratelimit.conf` → `/etc/nginx/conf.d/baicai-ratelimit.conf`
- `jail-baicai.conf` → `/etc/fail2ban/jail.d/baicai.conf`
- `filter-baicai-scan.conf` → `/etc/fail2ban/filter.d/baicai-scan.conf`
- `filter-baicai-limit.conf` → `/etc/fail2ban/filter.d/baicai-limit.conf`

Firewall only exposes:

```text
22/tcp
80/tcp
443/tcp
```

Ports 3000/3001/3002/8080 must stay private. The backend also performs login failures and temporary IP bans.
