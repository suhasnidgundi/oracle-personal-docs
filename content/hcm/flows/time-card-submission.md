---
title: "Time Card Submission Flow"
module: "hcm"
subModule: "otl"
contentType: "flow"
tags: ["time-card", "submission", "approval", "workflow", "otl", "business-flow"]
related: ["hcm/tables/hwm-tm-rec", "hcm/tables/hwm-tm-rec-grp", "hcm/tables/hxt-aprv-txn-header", "hcm/tables/hxt-aprv-txn-details", "hcm/concepts/otl-overview"]
aliases: ["Time Card Flow", "OTL Submission"]
difficulty: "intermediate"
status: "published"
lastUpdated: "2026-05-06"
---

## Overview

The time card submission flow describes the end-to-end process of how a worker's time data moves from initial entry through approval and finally to downstream systems like Payroll.

This is one of the most critical business processes in the OTL module.

## Flow Diagram

```mermaid
flowchart TD
    A[Worker opens Time Card UI] --> B[Enter time for the period]
    B --> C{Save or Submit?}
    C -->|Save Draft| D[Status: SAVED]
    D --> B
    C -->|Submit| E[Status: SUBMITTED]
    E --> F[Manager Notification]
    F --> G[Manager Reviews]
    G --> H{Decision}
    H -->|Approve| I[Status: APPROVED]
    H -->|Reject| J[Status: REJECTED]
    J --> K[Worker Notification with reason]
    K --> B
    I --> L[Transfer Process runs]
    L --> M[Payroll receives hours]
    M --> N[Pay Calculation]

    style A fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style E fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style I fill:#d1fae5,stroke:#10b981,color:#064e3b
    style J fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style N fill:#ede9fe,stroke:#8b5cf6,color:#3b0764
```

## What Happens in the Database

Understanding which tables are affected at each step helps with debugging and building integrations.

```mermaid
sequenceDiagram
    participant UI as Time Card UI
    participant REC as HWM_TM_REC
    participant GRP as HWM_TM_REC_GRP
    participant HDR as HXT_APRV_TXN_HEADER
    participant DTL as HXT_APRV_TXN_DETAILS
    participant STS as HWM_TM_STATUSES

    UI->>REC: Create time records (MEASURE/RANGE)
    UI->>GRP: Group records into time card
    Note over REC,GRP: Status: WORKING
    
    UI->>HDR: Worker clicks Submit
    HDR->>DTL: Create approval detail lines
    Note over REC,STS: Status: SUBMITTED
    
    HDR->>HDR: Manager approves
    DTL->>DTL: Detail lines marked APPROVED
    Note over REC,STS: Status: APPROVED
```

## Step-by-Step Details

### 1. Time Card Creation

The worker accesses the Time and Labor UI and creates or opens a time card for the current period.

**What happens in the database:**
- A new row is inserted into `HWM_TM_REC` for each time entry
- Records are grouped via `HWM_TM_REC_GRP`
- The time matrix is tracked in `HXT_TM_HEADER` and `HXT_TM_MTRX`

```sql
-- Each day's entry becomes a time record
SELECT 
    r.TM_REC_ID,
    r.REF_DATE,
    r.MEASURE,
    r.TM_REC_TYPE,
    r.USER_STATUS
FROM 
    HWM_TM_REC r
WHERE 
    r.RESOURCE_ID = :person_id
    AND r.USER_STATUS = 'WORKING'
ORDER BY 
    r.REF_DATE;
```

### 2. Time Entry

The worker enters hours for each day. Each entry creates rows in both `HWM_TM_REC` (data layer) and `HXT_TM_MTRX` (UI layer).

**Key data captured:**
- Date (`REF_DATE` in `HWM_TM_REC`)
- Hours worked (`MEASURE`)
- Project/task codes (via DFF attributes or `HXT_TM_MTRX` columns)
- Pay type (Regular, Overtime, etc.)

### 3. Submission

When the worker submits the time card:
- `USER_STATUS` changes from `WORKING` to `SUBMITTED` in `HWM_TM_REC`
- A header row is created in `HXT_APRV_TXN_HEADER`
- Detail lines are created in `HXT_APRV_TXN_DETAILS` for each time entry
- An approval workflow is triggered via Oracle BPM
- The manager receives a notification

### 4. Approval

The manager reviews the time card and can:
- **Approve** → Status becomes `APPROVED`
- **Reject** → Status becomes `REJECTED` (with comments in `HXT_APRV_TXN_HEADER.COMMENTS`)
- **Request Information** → Worker is asked for clarification

### 5. Transfer to Payroll

After approval, a batch process (Transfer Time Card Data):
- Reads all `APPROVED` time records
- Creates corresponding payroll elements
- Marks records as `TRANSFERRED`

```sql
-- Find approved time ready for transfer
SELECT 
    r.TM_REC_ID,
    r.REF_DATE,
    r.MEASURE,
    p.PERSON_NUMBER
FROM 
    HWM_TM_REC r
    JOIN PER_ALL_PEOPLE_F p ON r.RESOURCE_ID = p.PERSON_ID
        AND SYSDATE BETWEEN p.EFFECTIVE_START_DATE AND p.EFFECTIVE_END_DATE
WHERE 
    r.USER_STATUS = 'APPROVED'
    AND r.REF_DATE >= :payroll_period_start;
```

## Validation Rules

During submission, the system validates:

| Rule | Description | Example |
|---|---|---|
| **Period Completeness** | All days in the period must have entries | Mon-Fri must have entries |
| **Maximum Hours** | Daily hours cannot exceed configured max | Max 24 hours/day |
| **Required Fields** | Mandatory DFF attributes must be filled | Project code required |
| **Duplicate Check** | No duplicate entries for same day/type | Can't enter Regular twice for Monday |

## Error Handling

Common error scenarios and their resolutions:

1. **Submission Fails** — Usually due to validation errors. Check validation rules above.
2. **Approval Timeout** — If no action within configured days, auto-escalation occurs.
3. **Transfer Failure** — Payroll element mapping issues. Check element configuration.

## Tables Involved in This Flow

| Step | Tables Written To | Tables Read From |
|---|---|---|
| Create | `HWM_TM_REC`, `HWM_TM_REC_GRP`, `HXT_TM_HEADER`, `HXT_TM_MTRX` | `PER_ALL_PEOPLE_F`, `PER_ALL_ASSIGNMENTS_M`, `HXT_TCLAY_B` |
| Submit | `HXT_APRV_TXN_HEADER`, `HXT_APRV_TXN_DETAILS` | `HWM_TM_REC`, `HWM_TM_STATUSES` |
| Approve | `HXT_APRV_TXN_HEADER`, `HXT_APRV_TXN_DETAILS`, `HWM_TM_REC` | `HWM_TM_STATUSES` |
| Transfer | `HWM_TM_REC` (status update) | All of the above |

## Related Processes

- **Auto-submit rules** — Time cards can be auto-submitted if configured
- **Delegate entry** — Managers can enter time on behalf of workers
- **Mass approval** — Managers can approve multiple time cards at once
- **Time card templates** — Workers can create reusable templates for recurring patterns
