GREENFLOW LOCAL + MOBILE

Laptop:
1) Double-click start-greenflow.bat
2) Browser opens http://localhost:8765
3) Keep the black command window open while using the app.
4) Because the origin stays localhost:8765, localStorage persists between sessions in the same browser profile.

Phone on the SAME Wi-Fi:
1) Start GreenFlow on the laptop.
2) Run phone-address.bat to display the laptop IPv4 address.
3) On the phone open http://LAPTOP-IP:8765 (example: http://192.168.1.20:8765).
4) Windows Firewall may ask for permission. Allow Python on Private networks only.

Important data note:
Laptop and phone browsers have separate localStorage. They do NOT automatically sync yet.
Use Export backup / Restore backup to move data between them.

PWA:
On the laptop, localhost is a secure-context exception and installation/offline shell can work.
On a phone reached through a plain http://LAN-IP address, browsers may not permit full PWA/service-worker installation. For a truly installable phone app with shared/synced data, deploy GreenFlow on HTTPS and add cloud/local-network sync.


v9 fix: automatic calendar-day rollover. Today, routines, plans, planner highlight and daily focus refresh at midnight / tab return.


FINAL v15 NOTES
- Persian/Jalali date dropdowns and hour/minute dropdowns are used across forms.
- The launcher opens with a v15 cache-busting query.
- Service-worker cache is versioned v15 and old GreenFlow shell caches are deleted on activation.
- Export a JSON backup before intentionally clearing browser site data.
