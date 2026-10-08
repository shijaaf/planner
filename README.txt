GREENFLOW LOCAL

1) Double-click start-greenflow.bat
2) Browser opens http://localhost:8765
3) Keep the black command window open while using the app.
4) Because the origin stays localhost:8765, localStorage persists between sessions in the same browser profile.


PWA:
On the laptop, localhost is a secure-context exception and installation/offline shell can work.
On a phone reached through a plain http://LAN-IP address, browsers may not permit full PWA/service-worker installation. For a truly installable phone app with shared/synced data, deploy GreenFlow on HTTPS and add cloud/local-network sync.


v9 fix: automatic calendar-day rollover. Today, routines, plans, planner highlight and daily focus refresh at midnight / tab return.


FINAL v15 NOTES
- Persian/Jalali date dropdowns and hour/minute dropdowns are used across forms.
- The launcher opens with a v15 cache-busting query.
- Service-worker cache is versioned v15 and old GreenFlow shell caches are deleted on activation.
- Export a JSON backup before intentionally clearing browser site data.
