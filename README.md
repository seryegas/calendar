# Calendar App
React + TypeScript frontend for a calendar app with time blocks.  
Handles displaying weeks, days, time blocks, and user interactions.

## 🔗 Links
- Backend: [calendar-backend](https://github.com/seryegas/productivity-backend)  
  The backend repository contains the API and database logic.

## ⚡ Installation & Running
### Requirements:
- docker installed.
### Steps
1. clone the repository:
```bash
git clone https://github.com/seryegas/calendar.git
```
2. create .env file (or copy from .env.prod
```bash
cp .env.prod .env
```
3. start container
```bash
docker-compose up
```

For correct work backend required: can be installed by link in links field. Ports you choose must be available and same with env file

## Features:
- [x] Week View
- [x] Time Block Create/Read/Update/Delete
- [x] Time Block Moving/Resizing

## Incoming Features:
- [ ] Day view
- [ ] Month view
- [ ] Tests inside
- [ ] UI improve
- [ ] Rotating between days in week view