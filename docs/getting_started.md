# Getting Started with RateGuard

## Installation

```bash
npm install rateguard
```

## Quick Start

```typescript
import express from 'express';
import { rateGuard } from 'rateguard';

const app = express();

const limiter = rateGuard({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```
