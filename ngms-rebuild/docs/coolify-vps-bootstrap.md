# NGMS Coolify VPS bootstrap (preview first)

This runbook is for the isolated `preview/ngms-coolify` branch only. It does not authorize production DNS changes.

## 1. Budget-fit VPS example (not ordered)

The researched South African option is the Rackzar / LinuxVPS KLX2 plan. Its published page lists R199/month including VAT, 2 vCPU, 4 GB RAM, 60 GB NVMe, 500 GB bandwidth, full root access, free backup and monthly cancellation. Choose a Cape Town region if the order screen offers it; otherwise Johannesburg is also local. Verify the final price and plan in the supplier checkout before paying.

Order page: https://my.rackzar.com/order.php?m=OneStepOrder&gid=kvm-vps&pid=klx2

Choose a fresh VPS with Ubuntu 24.04 LTS. Do not install Coolify onto a computer or server already hosting production applications. Coolify's own published minimum is 2 CPU cores, 2 GB RAM and 10 GB disk; 4 GB RAM is a more sensible starting point when running a Next.js app and its Docker build on the same host.

## 2. After the provider supplies the VPS

Keep these private: root password, SSH private key, Coolify initial admin credentials and the generated Coolify `.env` secrets. Never paste them into GitHub issues or chat.

From Windows PowerShell, connect using the root username and IP shown in the provider panel:

```powershell
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with the VPS's actual IP. If root SSH is disabled by the provider, use the supplied sudo-capable account and run `sudo -i` only after connecting.

Check the machine before installing:

```bash
uname -a
free -h
df -h /
nproc
```

Use a fresh Ubuntu LTS server and retain reliable SSH access throughout installation.

## 3. Install Coolify

As root (or with supported sudo privileges), use the official Coolify installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Wait for the installer to finish and note the dashboard URL and any setup details it prints. Initially the dashboard is normally reached at:

```text
http://YOUR_SERVER_IP:8000
```

Create the first administrator account immediately. Back up the Coolify installation secrets securely, including `/data/coolify/source/.env`, as the official guide recommends. Do not commit these secrets to this repository.

Official instructions: https://coolify.io/docs/start-with-self-hosted

## 4. Firewall baseline

Use the provider firewall where available. For self-hosted Coolify, the official port list for the Coolify server is:

- TCP 22 for SSH (or the configured SSH port); keep this open while configuring the server.
- TCP 80 and 443 for public website traffic and TLS certificate issuance.
- TCP 8000, 6001 and 6002 for direct-IP dashboard access, live updates and the web terminal.

Restrict SSH source addresses where practical. Once a Coolify dashboard domain is configured and works through HTTPS, public access to ports 8000, 6001 and 6002 can be closed as documented by Coolify. Do not expose extra ports unless an application requires them.

Official firewall instructions: https://coolify.io/docs/core/infrastructure/servers/firewall

## 5. Connect the NGMS preview

In Coolify, create an Application from GitHub:

- Repository: `infonextgensolution1-cloud/ngms`
- Branch: `preview/ngms-coolify`
- Base Directory: `/ngms-rebuild`
- Build strategy: Dockerfile
- Dockerfile Location: `/Dockerfile`
- Exposed port: `3000`
- Build-time variable `NEXT_PUBLIC_NGMS_API_BASE`: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Build-time variable `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES`: `false`

Deploy to a generated preview hostname first. Do not change `www.nextgensolarmaintenance.co.za`.

After the hostname is assigned, add that exact origin to the CORS allow-list of the preview Cloudflare API only. Then, from a real browser, validate Access sign-in, read-only customer/job views and media access. Keep preview writes disabled until authentication, CORS and storage checks are successful.

## 6. Production safety gate

Do not switch the production domain as part of this bootstrap. First confirm:

- GitHub Actions passes on `preview/ngms-coolify`, including the Docker image build.
- Coolify reports the app as running and the health check passes.
- Public pages and mobile layout work over HTTPS.
- Cloudflare Access authentication succeeds from a real browser.
- Preview data and media remain isolated from production.
- Backups and a rollback method are documented.

Only after these checks should a separate production-migration plan be prepared.
