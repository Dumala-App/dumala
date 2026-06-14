# Touchline: Investor & Internal MVP Brief

**Positioning:** The AI-assisted football team management system webapp for modern coaches and clubs.  
**Version:** MVP Brief v1  
**Date:** 2026-06-14  

---

## Executive Summary

Football operations at the grassroots, academy, and amateur levels are highly fragmented. Coaches and club managers run their weekly cycles across spreadsheets, chat apps, notebooks, and isolated scheduling tools. Touchline OS solves this by providing a unified, local-first workspace for daily team operations. The current MVP proves this value by handling roster management, match scheduling, training planning, tactical notes, and discipline tracking in one seamless loop. This established operational habit creates the foundation for our next phase: an AI-assisted intelligence layer that evaluates player development and recommends tactical decisions.

## Problem and Market Opportunity

Coaches spend too much time administrating and too little time analyzing. 
- **Fragmented Tools:** Important data like player availability, tactical notes, and match history are scattered.
- **Disconnected Development:** What happens in training is rarely mapped cleanly to matchday performance.
- **Intelligence Gap:** Professional clubs have dedicated analysts; smaller clubs and academies rely on memory and gut feeling.

This gap represents a massive opportunity to build an indispensable daily workflow tool that evolves into a high-value intelligence platform.

## Solution Overview

Touchline is not just admin software.
- **Today:** It is a comprehensive football team management system webapp. It speeds up the weekly cycle by connecting scheduling, training, tactics, and result logging in one place.
- **Tomorrow:** It becomes the intelligence layer for coaching and player development. By capturing the daily operational data, it builds a dataset ready for AI-driven insights and structured player progression.

## Current MVP Capabilities

The MVP is live and functional today, operating as a fast, local-first web application.

- **Club Setup & Roster:** Instantly create a club identity, manage staff, and build a full roster with generated player attributes and editable profiles.
- **Schedule & Results:** Create fixtures and training sessions. Logging a match result automatically updates the team standings and player statistics (goals, clean sheets, MVPs).
- **Training Library:** Plan the week using a built-in 52-drill library featuring positional focuses, "How-To" execution guides, and 9 drag-and-drop preset weekly schedules.
- **Match Intelligence:** Track player availability, review opponent head-to-head records, and draft persistent coach's tactical notes before the match.
- **Discipline & Awards:** Log yellow/red card offenses and Man of the Match awards, complete with historical tracking.
- **Data Portability:** Local-first architecture allows rapid use without backend friction, with JSON backup export and restore flows built-in.

## Core User and Workflows

**Primary User:** The Football Coach / Team Manager

**Key Workflows:**
1. **Setup:** Open the app, name the club, and add the roster.
2. **Weekly Planning:** Schedule the weekend match, check player availability, and drop tactical notes. Assign drills from the library to Tuesday/Thursday training.
3. **Matchday:** Review opponent intel. Post-match, record the score, attribute goals, log cards, and award the MVP. 
4. **Season Tracking:** The dashboard's Squad Summary instantly reflects the updated reality. Standings recalculate automatically.

## Differentiation

- **Football-Specific Depth:** We combine admin (roster, schedule) with technical football needs (52-drill library, tactical board, match intel) in one interface.
- **Coach-Centered Design:** Built for the person running the team, not just the club treasurer collecting fees.
- **Operational Foundation First:** We solve the immediate pain of organization to earn the right to provide AI insights later.

## Strategic Roadmap

### Phase A: MVP Stabilization
Polish current local-first workflows, improve data validation, and ensure the result-cascade logic is flawless.

### Phase B: Shared SaaS Foundation
Migrate from local-browser storage to cloud persistence. Introduce user authentication, team accounts, and role-based collaboration (Coach, Admin, Read-Only Player).

### Phase C: Football Player Rating & Development System
Move beyond raw stats to structured player growth.
- **Role-Specific Benchmarking:** Establish rating models tailored for forwards, midfielders, defenders, and goalkeepers across different age bands.
- **Development Tracking:** Monitor player progression and regression against team averages and individual targets.
- **Holistic Evaluation:** Combine coach input, match output, and drill execution into a unified development score.

### Phase D: AI Assistant for Coaches
Turn captured data into active coaching support.
- **Game & Training Analysis:** AI evaluates recent match results and training loads to summarize team performance.
- **Drill Recommendations:** Automatically suggest specific drills from the library to address identified squad weaknesses or prepare for an upcoming opponent.
- **Pre-Match Briefings:** Generate automated tactical focus points and opponent preparation checklists based on historical data.

### Phase E: Advanced Match Intelligence
Introduce event-linked analysis, tactical pattern recognition across multiple fixtures, and AI-generated development flags for individual players.

## Monetization Direction

While currently in MVP, the planned monetization structure relies on capturing value at the operational level:
- **Coach Plan:** Core operations, basic analytics, and training tools for the solo manager.
- **Club Plan:** Multi-team management, shared tactical boards, and aggregated club reporting.
- **Academy Plan:** Full access to the AI Assistant and the Football Player Rating & Development System for structured talent tracking.

## Risks and Constraints

The current MVP has intentional limitations designed for rapid testing:
- **Local-First Only:** Data lives in the user's browser storage. There is no cloud sync or multi-device continuity yet.
- **No Authentication:** Single-user experience without login gates.
- **Analytics are Inferred:** Visual progression charts are currently derived from aggregate totals rather than a deep, historical event engine.

## Closing Statement

Touchline uses the immediate necessity of team administration as a wedge to capture daily coaching habits. The current MVP proves that a unified workspace can replace fragmented tools. As we transition from a local-first operational dashboard to a cloud-backed intelligence platform, Touchline will evolve into the definitive AI-assisted system for football development and match strategy.
