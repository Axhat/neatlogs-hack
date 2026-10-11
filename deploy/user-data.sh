#!/bin/bash
# EC2 boot script (Amazon Linux 2023, us-east-1): serves the dashboard + onboarding on port 80 and
# re-pulls the repo every 5 minutes so updates need no console access.
dnf install -y git python3.11 python3.11-pip
git clone https://github.com/Axhat/neatlogs-hack.git /opt/br
cd /opt/br && python3.11 -m venv .venv && .venv/bin/pip install -q -r web/requirements.txt
cat > /etc/systemd/system/br.service <<'UNIT'
[Unit]
Description=Blast Radius dashboard
After=network-online.target
[Service]
WorkingDirectory=/opt/br
ExecStart=/opt/br/.venv/bin/uvicorn web.app:app --host 0.0.0.0 --port 80
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/systemd/system/br-update.service <<'UNIT'
[Service]
Type=oneshot
ExecStart=/bin/sh -c 'cd /opt/br && git pull -q && .venv/bin/pip install -q -r web/requirements.txt && systemctl restart br'
UNIT
cat > /etc/systemd/system/br-update.timer <<'UNIT'
[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload && systemctl enable --now br br-update.timer
