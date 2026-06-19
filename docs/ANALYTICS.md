# Visitor Analytics Documentation - DevForge AI

DevForge AI tracks portfolio interaction metrics (views, project clicks, contact form submissions) to populate user dashboards.

---

## 1. Metric Capture Workflow

```
Visitor (Browser)              Deployed Portfolio             DevForge Server
    |                                   |                            |
    |----- 1. Open live site ---------->|                            |
    |                                   |----- 2. POST view event -->|
    |                                   |                         Resolve IP/UA
    |                                   |                         Increment stats
    |                                   |                         Save Event Log
    |                                   |                            |
    |----- 3. Click Project Link ------>|                            |
    |                                   |----- 4. POST click event ->|
    |                                   |                         Increment stats
    |                                   |                         Save Event Log
```

---

## 2. Server Processing & Collections

When the tracking script on the portfolio sends a view/click event to `POST /api/analytics/ping`:
1. **Client IP lookup**: The server reads the client's IP from headers. If it's a localhost IP (e.g. `::1` or `127.0.0.1`), it simulates a random country (e.g., Germany, USA, India) to populate dashboards. Otherwise, it calls `ip-api.com` to geolocate.
2. **User-Agent parsing**: The server parses the `User-Agent` header using `ua-parser-js` to extract the visitor's device type (Desktop, Mobile, Tablet) and browser name (Chrome, Firefox, Safari).
3. **AnalyticsEvent Collection [NEW]**: Logs individual visits:
   ```json
   {
     "portfolioId": "Mongoose ID",
     "type": "view",
     "country": "Germany",
     "device": "Mobile",
     "browser": "Chrome",
     "referrer": "LinkedIn",
     "timestamp": "Date"
   }
   ```
4. **Analytic Summary Collection**: Atomically updates total counter aggregates in a summary record using MongoDB's `$inc` operator, preventing heavy database counts:
   - `views`
   - `githubClicks`
   - `resumeDownloads`
   - `contactSubmissions`

---

## 3. Querying Aggregates for Dashboard
The dashboard queries `GET /api/analytics/:portfolioId`, returning:
- Aggregated counters.
- Browser distributions.
- Device breakdowns.
- Top visitor countries.
- Traffic referral domains.
- A list of recent visits.
