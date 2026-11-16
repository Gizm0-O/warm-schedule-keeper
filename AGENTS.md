# Architecture rules
- Calculate multi-day calendar segments in `calendarEventLanes` and share them between month/week views, so inclusive ranges and lane allocation stay consistent.
- Normalize gift links through `giftUrls`/`giftUrlPayload`, preserving the legacy first-link column for compatibility.