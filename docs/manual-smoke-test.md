# Manual Smoke Test: Customer / Tech / Manager

Run `npm run dev` and open two browser windows (tech, manager) plus one tab (customer). Use dropdowns for names.

1) **Customer creates WO**
- Go to `/customer`; submit new work order (all 9 required fields).
- Confirm it appears in the list.

2) **Manager assigns & messages**
- Go to `/manager`; open the new work order.
- Assign a technician from the dropdown; send a manager message.
- Confirm status and message render on the detail page.

3) **Tech starts, estimates, completes**
- Go to `/tech`; open the same work order.
- Click Start, add an estimate, send a tech message, then Complete.
- Confirm status updates and messages appear for manager/customer.

4) **Customer reviews**
- Refresh `/customer`; ensure messages, estimate, and status reflect tech/manager actions.
- Accept or reject the estimate and see status adjust.

5) **Portal chat (team + private)**
- In manager window, set Manager name; in tech window, set Tech name.
- Manager: open Team chat; send a global message; verify it appears for tech.
- Both: switch to Private channel (pair: manager/tech) and send messages both ways; confirm messages and green live indicator show on both sides.

6) **Persistence**
- Stop and restart dev server; reload portals.
- Confirm work orders remain (in-memory seed) and portal chat history persists (disk-backed).

Expected: status transitions obey role rules, messages visible across roles, chats live-update, and no console errors.
