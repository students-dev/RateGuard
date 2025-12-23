# RateGuard

**RateGuard** is a lightweight, framework-agnostic rate-limiting library for Node.js. It provides a simple, zero-dependency solution for protecting your applications from abusive traffic using Fixed Window or Sliding Window algorithms.

Designed with simplicity and clarity in mind, RateGuard is perfect for students, prototypes, and small-to-medium production services.

## Features

- ⚡ **Lightweight**: Zero external runtime dependencies.
- 🛡️ **Algorithms**: Supports **Fixed Window** and **Sliding Window** strategies.
- 💾 **Storage**: Built-in in-memory storage (default).
- 🔌 **Adapters**: Ready-to-use middleware for **Express** (and compatible frameworks).
- 📝 **TypeScript**: Written in TypeScript with full type definitions.

## Installation

```bash
npm install rateguard
```

## Usage

### Basic Express Example

```typescript
import express from 'express';
import { rateGuard } from 'rateguard';

const app = express();

// Create a rate limiter: 100 requests per 15 minutes
const limiter = rateGuard({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests created from this IP, please try again after 15 minutes.'
});

// Apply to all requests
app.use(limiter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### Advanced Configuration

```typescript
import { rateGuard, MemoryStore } from 'rateguard';

const apiLimiter = rateGuard({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  algorithm: 'sliding', // Use sliding window for smoother limiting
  statusCode: 429,
  message: 'Slow down!',
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip, // Custom key (e.g., API Key)
  store: new MemoryStore(60000) // Custom cleanup interval
});

app.use('/api/', apiLimiter);
```

## Options

| Option | Type | Default | Description |
|Args|---|---|---|
| `windowMs` | `number` | **Required** | Time frame for the rate limit in milliseconds. |
| `max` | `number` | **Required** | Maximum number of requests allowed per window. |
| `algorithm` | `"fixed" \| "sliding"` | `"fixed"` | The rate limiting algorithm to use. |
| `message` | `string` | `"Too many requests..."` | Response message when limit is exceeded. |
| `statusCode` | `number` | `429` | HTTP status code when limit is exceeded. |
| `keyGenerator` | `(req: any) => string` | `req.ip` | Function to generate a unique key for the request (e.g. IP, user ID). |
| `store` | `Store` | `MemoryStore` | Custom storage backend. |

## License



MIT
